import { mergeFlowchartConfig } from '@/preview/style/config';
import { parseTypstFlowchartJSON } from '@/preview/json/convert';
import { createIdAllocator, type IdAllocator } from '@/nodes/ids';

import { readPartialConfig } from './config-schema.ts';
import { describeIssues, readDataDocument } from './data.ts';
import { dehydrateGraph } from './graph-schema.ts';
import { CURRENT_PROJECT_VERSION, DATA_KIND, PROJECT_KIND } from './kinds.ts';
import { migrateProject, projectDocumentSchema, type ProjectDocument } from './project.ts';

// One entry point for every source of a document: localStorage, an imported
// file, and later a shared link. Each of them hands raw parsed JSON to
// `readDocument` and gets back either a project document or a reason it could
// not be read.

export type ReadResult =
	| {
			ok: true;
			document: ProjectDocument;
			/** True when positions had to be invented and the caller should lay out. */
			needsLayout: boolean;
			source: 'project' | 'data';
	  }
	| { ok: false; error: string };

function asRecord(value: unknown): Record<string, unknown> | null {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: null;
}

/**
 * Styling read separately from the version chain.
 *
 * Version one and two files carry a `config`; the version three data export
 * deliberately does not. Reading it here rather than inside the chain lets both
 * be true at once.
 */
function readConfigSidecar(raw: Record<string, unknown>) {
	return readPartialConfig(raw.config);
}

export function readDocument(
	value: unknown,
	nextId: IdAllocator = createIdAllocator()
): ReadResult {
	const raw = asRecord(value);
	if (!raw) {
		return { ok: false, error: 'This file does not contain a JSON object.' };
	}

	const version = raw.$version;
	if (typeof version !== 'number' || !Number.isInteger(version)) {
		return { ok: false, error: 'This file has no version and cannot be read.' };
	}

	// A file with no kind marker predates the marker, so it is a data document.
	const kind = raw.$kind ?? DATA_KIND;

	if (kind === PROJECT_KIND) {
		return readProject(raw, version);
	}

	if (kind === DATA_KIND) {
		return readData(raw, version, nextId);
	}

	return { ok: false, error: `Unknown document kind: ${String(kind)}` };
}

function readProject(raw: Record<string, unknown>, version: number): ReadResult {
	if (version > CURRENT_PROJECT_VERSION) {
		return {
			ok: false,
			error: `This file was written by a newer version of the app (project version ${version}, this build understands up to ${CURRENT_PROJECT_VERSION}).`
		};
	}

	let migrated: unknown;
	try {
		migrated = migrateProject(raw, version);
	} catch (error) {
		return { ok: false, error: error instanceof Error ? error.message : String(error) };
	}

	const parsed = projectDocumentSchema.safeParse(migrated);
	if (!parsed.success) {
		return { ok: false, error: describeIssues('this project file', parsed.error) };
	}

	return {
		ok: true,
		source: 'project',
		needsLayout: false,
		document: {
			name: parsed.data.name,
			config: mergeFlowchartConfig(parsed.data.config),
			graph: parsed.data.graph
		}
	};
}

function readData(raw: Record<string, unknown>, version: number, nextId: IdAllocator): ReadResult {
	const result = readDataDocument(raw.data, version);
	if (!result.ok) {
		return { ok: false, error: result.error };
	}

	// The semantic form carries no positions, so the caller has to lay out.
	const graph = dehydrateGraph(parseTypstFlowchartJSON(result.data, nextId));

	const name = typeof raw.name === 'string' ? raw.name : '';

	return {
		ok: true,
		source: 'data',
		needsLayout: true,
		document: {
			name,
			config: mergeFlowchartConfig(readConfigSidecar(raw)),
			graph
		}
	};
}
