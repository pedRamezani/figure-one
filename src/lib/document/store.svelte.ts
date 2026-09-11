import type { Edge, Node } from '@xyflow/svelte';

import { getNodeDataDefaults, type RegisteredNodeType } from '@/nodes/handles';
import { edgeId, nextIdAfter } from '@/nodes/ids';
import { computeRows } from '@/nodes/rows';
import { defaultConfig, type TypstFlowchartConfig } from '@/preview/style/config';

import { dehydrateGraph, hydrateGraph } from './graph-schema.ts';
import { toBaseName } from './name.ts';
import { createProjectDocument, emptyProjectDocument, type ProjectDocument } from './project.ts';
import { readDocument } from './read.ts';

/** The slice of `localStorage` this store needs. Injected so tests can fake it. */
export interface DocumentStorage {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
	removeItem(key: string): void;
}

/**
 * One key holds the whole document.
 *
 * Nodes, edges, config and name used to live in four keys written
 * independently, so a single logical save arrived in another tab as four
 * unsynchronised `storage` events. Between them the receiving tab held edges
 * referencing nodes it did not have. One key makes a save atomic by
 * construction.
 */
export const DOCUMENT_KEY = 'flowchart-document';

/** The keys written before the single document existed. Read once, then removed. */
export const LEGACY_KEYS = {
	nodes: 'storage-nodes',
	edges: 'storage-edges',
	timestamp: 'storage-timestamp',
	config: 'project-config',
	name: 'project-name'
} as const;

function parseJSON(value: string | null): unknown {
	if (value === null) return undefined;
	try {
		return JSON.parse(value);
	} catch {
		return undefined;
	}
}

/**
 * Builds a document from the pre-single-key storage layout.
 *
 * Returns null when none of the old keys are present, which is the normal case
 * for anyone who has loaded the app since this shipped.
 */
export function readLegacyStorage(storage: DocumentStorage): ProjectDocument | null {
	const rawNodes = storage.getItem(LEGACY_KEYS.nodes);
	const rawEdges = storage.getItem(LEGACY_KEYS.edges);
	const rawConfig = storage.getItem(LEGACY_KEYS.config);
	const rawName = storage.getItem(LEGACY_KEYS.name);

	if (rawNodes === null && rawEdges === null && rawConfig === null && rawName === null) {
		return null;
	}

	const nodes = parseJSON(rawNodes);
	const edges = parseJSON(rawEdges);

	// Reuse the normal reader so the old keys go through exactly the same
	// validation as everything else, rather than a second bespoke path.
	const result = readDocument({
		$kind: 'flowchart-project',
		$version: 1,
		// The old name field held whatever was typed, extension included.
		name: toBaseName(rawName ?? ''),
		config: parseJSON(rawConfig) ?? {},
		graph: {
			nodes: Array.isArray(nodes) ? nodes : [],
			edges: Array.isArray(edges) ? edges : []
		}
	});

	if (!result.ok) return null;

	// A document with nothing in it is not worth adopting.
	if (result.document.graph.nodes.length === 0) return null;

	return result.document;
}

export function clearLegacyStorage(storage: DocumentStorage): void {
	for (const key of Object.values(LEGACY_KEYS)) {
		storage.removeItem(key);
	}
}

export class FlowchartDocumentStore {
	// The canvas. `$state.raw` because xyflow reassigns whole arrays.
	nodes = $state.raw<Node[]>([]);
	edges = $state.raw<Edge[]>([]);
	config = $state<TypstFlowchartConfig>({ ...defaultConfig });
	name = $state('');

	/** Set when a load produced a graph with no positions worth keeping. */
	needsLayout = $state(false);

	/**
	 * Which split row each node sits in, derived from the graph.
	 *
	 * Not stored on the nodes. It used to be, maintained by four effects that
	 * each needed a guard to stop them looping.
	 */
	rows = $derived(computeRows(this.nodes, this.edges));

	/** The last read or write, used to tell a real remote change from our own echo. */
	#lastSeen: string | null = null;
	#storage: DocumentStorage | null = null;
	#nextId = 1;

	constructor() {
		this.#apply(emptyProjectDocument());
	}

	// ---------------------------------------------------------------
	// Identity
	// ---------------------------------------------------------------

	/**
	 * Mints the next node id.
	 *
	 * Bound rather than a plain method so it can be handed to
	 * `parseTypstFlowchartJSON` as an allocator.
	 */
	allocateId = (): string => `${this.#nextId++}`;

	/** The split row a node sits in, or null when it is on the main spine. */
	rowOf(id: string): number | null {
		return this.rows.get(id) ?? null;
	}

	// ---------------------------------------------------------------
	// Reading and writing the document
	// ---------------------------------------------------------------

	/** The document as it would be stored right now. */
	snapshot(): ProjectDocument {
		return {
			name: this.name,
			config: this.config,
			graph: dehydrateGraph({ nodes: this.nodes, edges: this.edges })
		};
	}

	serialize(): string {
		return JSON.stringify(createProjectDocument(this.snapshot()));
	}

	#apply(document: ProjectDocument): void {
		const { nodes, edges } = hydrateGraph(document.graph);

		this.nodes = nodes;
		this.edges = edges;
		this.config = document.config;
		this.name = document.name;
		this.#nextId = nextIdAfter(document.graph.nodes);
	}

	/**
	 * Replaces everything with another document.
	 *
	 * This is the destructive operation behind Import and, later, opening a
	 * shared link. Callers are responsible for confirming with the user first.
	 */
	replaceWith(document: ProjectDocument, options: { needsLayout?: boolean } = {}): void {
		this.#apply(document);
		this.needsLayout = options.needsLayout ?? false;
		this.save();
	}

	reset(): void {
		this.replaceWith(emptyProjectDocument());
	}

	/**
	 * True when there is nothing worth warning the user about losing: an
	 * untouched start node, no name, and default styling.
	 */
	get isPristine(): boolean {
		if (this.edges.length !== 0) return false;
		if (this.nodes.length !== 1) return false;
		if (this.nodes[0]?.type !== 'start') return false;
		if (this.name !== '') return false;

		return JSON.stringify(this.config) === JSON.stringify(defaultConfig);
	}

	// ---------------------------------------------------------------
	// Storage
	// ---------------------------------------------------------------

	/** Connects the store to storage and loads whatever is there. */
	attach(storage: DocumentStorage): void {
		this.#storage = storage;
		this.load();
	}

	detach(): void {
		this.#storage = null;
	}

	load(): void {
		const storage = this.#storage;
		if (!storage) return;

		const raw = storage.getItem(DOCUMENT_KEY);

		if (raw !== null) {
			this.#adopt(raw);
			return;
		}

		const legacy = readLegacyStorage(storage);
		if (legacy) {
			this.#apply(legacy);
			this.needsLayout = false;
			this.save();
			clearLegacyStorage(storage);
		}
	}

	/**
	 * Writes the document.
	 *
	 * Deliberately an explicit call rather than an effect that reacts to state.
	 * Effects that both read and write reactive state are what produced the
	 * sync races this replaced; this one only ever writes to storage.
	 */
	save(): void {
		const storage = this.#storage;
		if (!storage) return;

		const serialized = this.serialize();
		if (serialized === this.#lastSeen) return;

		storage.setItem(DOCUMENT_KEY, serialized);
		this.#lastSeen = serialized;
	}

	/**
	 * Re-reads storage in case a `storage` event was missed, for instance while
	 * the tab was hidden and throttled.
	 */
	syncFromStorage(): void {
		const storage = this.#storage;
		if (!storage) return;

		const raw = storage.getItem(DOCUMENT_KEY);
		if (raw === null || raw === this.#lastSeen) return;

		this.#adopt(raw);
	}

	/** Handles a cross-tab write. Last write wins, adopted silently. */
	receiveStorageEvent(event: Pick<StorageEvent, 'key' | 'newValue'>): void {
		if (event.key !== DOCUMENT_KEY) return;
		if (event.newValue === null) return;
		if (event.newValue === this.#lastSeen) return;

		this.#adopt(event.newValue);
	}

	#adopt(raw: string): void {
		const result = readDocument(parseJSON(raw), this.allocateId);

		// Remember the exact bytes either way. A document we cannot read will not
		// become readable by reading it again, and re-adopting it on every focus
		// would be a loop.
		this.#lastSeen = raw;

		if (!result.ok) return;

		this.#apply(result.document);
		this.needsLayout = result.needsLayout;
	}

	// ---------------------------------------------------------------
	// Graph edits
	// ---------------------------------------------------------------

	addNode(
		nodeType: RegisteredNodeType,
		position: { x: number; y: number } = { x: 0, y: 0 },
		origin: [number, number] = [0.5, 0.5],
		data: Record<string, unknown> = {},
		parentId?: string,
		isParent: boolean = false
	): Node {
		const newNode = {
			id: this.allocateId(),
			type: nodeType,
			position,
			data: {
				...getNodeDataDefaults(nodeType),
				...data
			},
			origin,
			parentId
		} satisfies Node;

		// Child nodes have to always come after parent nodes
		this.nodes = isParent ? [newNode, ...this.nodes] : [...this.nodes, newNode];

		return newNode;
	}

	addEdge(source: string, target: string, sourceHandle?: string, targetHandle?: string): Edge {
		const newEdge = {
			source,
			sourceHandle,
			target,
			targetHandle,
			id: edgeId(source, target)
		} satisfies Edge;

		this.edges = [...this.edges, newEdge];

		return newEdge;
	}
}

/** The one document this app edits. */
export const flowchartDocument = new FlowchartDocumentStore();
