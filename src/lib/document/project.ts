import { z } from 'zod';

import { defaultConfig, type TypstFlowchartConfig } from '@/preview/style/config';

import { partialFlowchartConfigSchema } from './config-schema.ts';
import { persistedGraphSchema, type PersistedGraph } from './graph-schema.ts';
import { CURRENT_PROJECT_VERSION, PROJECT_KIND } from './kinds.ts';

// The project document: the graph is authoritative, styling and name ride with
// it, and the Typst semantic form is derived from it rather than stored.
//
// This is the only shape written to localStorage, and the only shape Export
// writes for a project file. There is exactly one of them, so there is exactly
// one migration chain and one decoder.

export const projectDocumentSchema = z.object({
	$kind: z.literal(PROJECT_KIND),
	$version: z.literal(CURRENT_PROJECT_VERSION),
	/** Bare base name, no extension. Empty means "use the fallback". */
	name: z.string().default(''),
	config: partialFlowchartConfigSchema.prefault({}),
	graph: persistedGraphSchema
});

export type ProjectDocumentFile = z.infer<typeof projectDocumentSchema>;

/** The in-memory form: config is always complete, gaps already filled. */
export interface ProjectDocument {
	name: string;
	config: TypstFlowchartConfig;
	graph: PersistedGraph;
}

export function createProjectDocument(document: ProjectDocument) {
	return {
		$kind: PROJECT_KIND,
		$version: CURRENT_PROJECT_VERSION,
		name: document.name,
		config: document.config,
		graph: document.graph
	};
}

export function emptyProjectDocument(): ProjectDocument {
	return {
		name: '',
		config: { ...defaultConfig },
		graph: {
			nodes: [
				{
					id: '0',
					type: 'start',
					position: { x: 0, y: 0 },
					data: { label: 'Start population', value: 1000 }
				}
			],
			edges: []
		}
	};
}

// -------------------------------------------------------------
// Migration chain
// -------------------------------------------------------------

/**
 * Version one stored a `row` on every node's data, kept in sync by effects.
 * Rows are now derived from the graph, so the stored copy is dropped. Nothing
 * is lost: the same value falls back out of `computeRows`, and a stale one
 * cannot survive to disagree with the topology.
 */
function migrateV1ToV2(value: unknown): unknown {
	const document = (value ?? {}) as Record<string, unknown>;
	const graph = (document.graph ?? {}) as Record<string, unknown>;
	const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];

	return {
		...document,
		$version: 2,
		graph: {
			...graph,
			nodes: nodes.map((candidate) => {
				if (typeof candidate !== 'object' || candidate === null) return candidate;

				const node = candidate as Record<string, unknown>;
				const data = node.data;
				if (typeof data !== 'object' || data === null || !('row' in data)) return node;

				const rest = { ...(data as Record<string, unknown>) };
				delete rest.row;
				return { ...node, data: rest };
			})
		}
	};
}

/** One entry per version, taking a document from that version to the next. */
export const projectMigrations: Record<number, (value: unknown) => unknown> = {
	1: migrateV1ToV2
};

export function migrateProject(value: unknown, fromVersion: number): unknown {
	let current = value;

	for (let version = fromVersion; version < CURRENT_PROJECT_VERSION; version++) {
		const step = projectMigrations[version];
		if (!step) {
			throw new Error(`Missing project migration from version ${version}`);
		}
		current = step(current);
	}

	return current;
}
