import { z } from 'zod';
import type { Edge, Node } from '@xyflow/svelte';

// The persisted shape of the canvas.
//
// Only these fields are stored. Everything xyflow computes at runtime, such as
// `measured`, `selected` and `dragging`, is dropped on the way out and absent
// on the way in, so a library upgrade cannot quietly change the file format.
//
// Node type is strict: an unknown type has no component and must not reach the
// canvas. Node data is lenient: a missing field falls back to the same default
// a freshly dragged node would get, so adding a field needs no migration.

const positionSchema = z.object({
	x: z.number(),
	y: z.number()
});

const originSchema = z.tuple([z.number(), z.number()]);

const baseNodeFields = {
	id: z.string().min(1),
	position: positionSchema,
	parentId: z.string().min(1).optional(),
	origin: originSchema.optional()
};

// A node's split row is not stored. It is derived from the graph by
// `computeRows` in `@/flow/rows`, because it is a pure function of topology and
// storing it meant four effects kept it in sync and could disagree.

const groupsNode = z.object({
	...baseNodeFields,
	type: z.literal('groups'),
	data: z
		.object({
			group: z.string().default('')
		})
		.default({ group: '' })
});

const rowNode = z.object({
	...baseNodeFields,
	type: z.literal('row'),
	data: z.object({}).default({})
});

const splitNode = z.object({
	...baseNodeFields,
	type: z.literal('split'),
	data: z.object({}).default({})
});

const splitstartNode = z.object({
	...baseNodeFields,
	type: z.literal('splitstart'),
	data: z
		.object({
			label: z.string().default('Split start population'),
			value: z.number().default(0)
		})
		.prefault({})
});

const startNode = z.object({
	...baseNodeFields,
	type: z.literal('start'),
	data: z
		.object({
			label: z.string().default('Start population'),
			value: z.number().default(1000)
		})
		.prefault({})
});

const stepNode = z.object({
	...baseNodeFields,
	type: z.literal('step'),
	data: z
		.object({
			stepLabel: z.string().default('Step'),
			droppedLabel: z.string().default('excluded'),
			value: z.number().nullable().default(null),
			delta: z.number().default(0)
		})
		.prefault({})
});

const substepNode = z.object({
	...baseNodeFields,
	type: z.literal('substep'),
	data: z
		.object({
			label: z.string().default('Substep'),
			delta: z.number().default(0)
		})
		.prefault({})
});

export const persistedNodeSchema = z.discriminatedUnion('type', [
	groupsNode,
	rowNode,
	splitNode,
	splitstartNode,
	startNode,
	stepNode,
	substepNode
]);

export const persistedEdgeSchema = z.object({
	id: z.string().min(1),
	source: z.string().min(1),
	target: z.string().min(1),
	sourceHandle: z.string().nullish(),
	targetHandle: z.string().nullish(),
	/**
	 * How many stages this edge crosses, when it crosses more than one.
	 *
	 * Absent means one, which is why it is only written when it is greater.
	 * A span above one is how a split arm says it has nothing at a stage.
	 */
	data: z
		.object({ rowSpan: z.number().int().min(1) })
		.partial()
		.optional()
});

export const persistedGraphSchema = z.object({
	nodes: z.array(persistedNodeSchema),
	edges: z.array(persistedEdgeSchema)
});

export type PersistedNode = z.infer<typeof persistedNodeSchema>;
export type PersistedEdge = z.infer<typeof persistedEdgeSchema>;
export type PersistedGraph = z.infer<typeof persistedGraphSchema>;

/** Node types the user is not allowed to delete, reapplied on load. */
function isDeletable(type: PersistedNode['type']): boolean {
	return type !== 'start';
}

/** Persisted graph → what xyflow renders. */
export function hydrateGraph(graph: PersistedGraph): { nodes: Node[]; edges: Edge[] } {
	const nodes: Node[] = graph.nodes.map((node) => ({
		id: node.id,
		type: node.type,
		position: { ...node.position },
		data: { ...node.data },
		...(node.parentId === undefined ? {} : { parentId: node.parentId }),
		...(node.origin === undefined ? {} : { origin: [...node.origin] as [number, number] }),
		...(isDeletable(node.type) ? {} : { deletable: false })
	}));

	const edges: Edge[] = graph.edges.map((edge) => ({
		id: edge.id,
		source: edge.source,
		target: edge.target,
		...(edge.sourceHandle == null ? {} : { sourceHandle: edge.sourceHandle }),
		...(edge.targetHandle == null ? {} : { targetHandle: edge.targetHandle }),
		...(edge.data === undefined ? {} : { data: { ...edge.data } })
	}));

	return { nodes, edges };
}

/**
 * What xyflow renders → persisted graph.
 *
 * Runs the values back through the schema so that anything xyflow has attached
 * at runtime is stripped, and so that a node the app somehow produced in a
 * shape the schema rejects is caught here rather than on the next load.
 */
function spanData(data: unknown): { rowSpan: number } | undefined {
	if (typeof data !== 'object' || data === null) return undefined;

	const span = (data as Record<string, unknown>).rowSpan;
	if (typeof span !== 'number' || !Number.isInteger(span) || span <= 1) return undefined;

	return { rowSpan: span };
}

export function dehydrateGraph(raw: { nodes: Node[]; edges: Edge[] }): PersistedGraph {
	const nodes: PersistedNode[] = [];

	for (const node of raw.nodes) {
		const parsed = persistedNodeSchema.safeParse({
			id: node.id,
			type: node.type,
			position: node.position,
			data: node.data,
			parentId: node.parentId,
			origin: node.origin
		});

		if (parsed.success) {
			nodes.push(parsed.data);
		}
	}

	const keptIds = new Set(nodes.map((n) => n.id));

	const edges: PersistedEdge[] = [];

	for (const edge of raw.edges) {
		// An edge whose endpoints did not survive would dangle on the next load.
		if (!keptIds.has(edge.source) || !keptIds.has(edge.target)) continue;

		const parsed = persistedEdgeSchema.safeParse({
			id: edge.id,
			source: edge.source,
			target: edge.target,
			sourceHandle: edge.sourceHandle,
			targetHandle: edge.targetHandle,
			// A span of one is the default, so writing it would be noise on every
			// edge in the document. Only a real gap is worth storing.
			data: spanData(edge.data)
		});

		if (parsed.success) {
			edges.push(parsed.data);
		}
	}

	return { nodes, edges };
}
