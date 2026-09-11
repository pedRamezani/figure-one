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

export const projectDocumentV1Schema = z.object({
	$kind: z.literal(PROJECT_KIND),
	$version: z.literal(1),
	/** Bare base name, no extension. Empty means "use the fallback". */
	name: z.string().default(''),
	config: partialFlowchartConfigSchema.prefault({}),
	graph: persistedGraphSchema
});

export type ProjectDocumentV1 = z.infer<typeof projectDocumentV1Schema>;

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
					data: { label: 'Start population', value: 1000, row: null }
				}
			],
			edges: []
		}
	};
}

/**
 * Migration chain for the project kind.
 *
 * There is only one version so far, so this is a single pass-through. It exists
 * as a chain rather than a direct parse so that version two has somewhere
 * obvious to go, and so the corpus test has something to run.
 */
export const projectMigrations: Record<number, (value: unknown) => unknown> = {};

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
