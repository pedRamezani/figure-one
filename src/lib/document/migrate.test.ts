import { describe, expect, it } from 'vitest';

import { readDocument } from './read.ts';
import { createProjectDocument } from './project.ts';
import { CURRENT_PROJECT_VERSION } from './kinds.ts';
import { hydrateGraph } from './graph-schema.ts';
import { computeRows } from '@/nodes/rows';
import { createIdAllocator } from '@/nodes/ids';

import captured from './fixtures/project-v1-captured.json' with { type: 'json' };
import dataV2Splits from './fixtures/data-v2-splits.json' with { type: 'json' };

// Version one stored a `row` on every node's data. Version two derives it from
// the graph instead. These tests exist to prove that the value falls back out
// of the derivation, so dropping the stored copy loses nothing.

describe('the captured version one document', () => {
	it('reads', () => {
		const result = readDocument(captured);

		expect(result.ok, result.ok ? '' : result.error).toBe(true);
	});

	it('keeps every node and edge', () => {
		const result = readDocument(captured);
		if (!result.ok) throw new Error(result.error);

		expect(result.document.graph.nodes).toHaveLength(captured.graph.nodes.length);
		expect(result.document.graph.edges).toHaveLength(captured.graph.edges.length);
	});

	it('drops the stored row from node data', () => {
		const result = readDocument(captured);
		if (!result.ok) throw new Error(result.error);

		for (const node of result.document.graph.nodes) {
			expect(node.data).not.toHaveProperty('row');
		}
	});

	it('keeps positions exactly', () => {
		const result = readDocument(captured);
		if (!result.ok) throw new Error(result.error);

		const positions = new Map(result.document.graph.nodes.map((n) => [n.id, n.position]));

		for (const original of captured.graph.nodes) {
			expect(positions.get(original.id)).toEqual(original.position);
		}
	});

	it('keeps the nodes that no edge touches', () => {
		const result = readDocument(captured);
		if (!result.ok) throw new Error(result.error);

		const connected = new Set(captured.graph.edges.flatMap((e) => [e.source, e.target]));
		const orphans = captured.graph.nodes.filter((n) => !connected.has(n.id)).map((n) => n.id);

		// This document really does contain unconnected work in progress.
		expect(orphans.length).toBeGreaterThan(0);

		const kept = new Set(result.document.graph.nodes.map((n) => n.id));
		for (const id of orphans) {
			expect(kept.has(id)).toBe(true);
		}
	});

	it('derives the same rows that version one had stored', () => {
		const result = readDocument(captured);
		if (!result.ok) throw new Error(result.error);

		const { nodes, edges } = hydrateGraph(result.document.graph);
		const derived = computeRows(nodes, edges);

		for (const original of captured.graph.nodes) {
			const stored = (original.data as Record<string, unknown>).row ?? null;
			expect(derived.get(original.id) ?? null).toBe(stored);
		}
	});

	it('is written back at the current version', () => {
		const result = readDocument(captured);
		if (!result.ok) throw new Error(result.error);

		expect(createProjectDocument(result.document).$version).toBe(CURRENT_PROJECT_VERSION);
	});

	it('is stable once migrated', () => {
		const first = readDocument(captured);
		if (!first.ok) throw new Error(first.error);

		const second = readDocument(createProjectDocument(first.document));
		if (!second.ok) throw new Error(second.error);

		expect(second.document).toEqual(first.document);
	});
});

describe('a version one document with a split', () => {
	/**
	 * Built by taking a real split chart and putting the rows back onto node
	 * data, which is exactly the shape version one stored.
	 */
	function syntheticV1() {
		const read = readDocument(dataV2Splits, createIdAllocator());
		if (!read.ok) throw new Error(read.error);

		const { nodes, edges } = hydrateGraph(read.document.graph);
		const rows = computeRows(nodes, edges);

		return {
			$kind: 'flowchart-project',
			$version: 1,
			name: 'legacy-split',
			config: read.document.config,
			graph: {
				nodes: read.document.graph.nodes.map((node) => ({
					...node,
					data: { ...node.data, row: rows.get(node.id) ?? null }
				})),
				edges: read.document.graph.edges
			}
		};
	}

	it('has rows to lose in the first place', () => {
		const legacy = syntheticV1();
		const stored = legacy.graph.nodes.map((n) => (n.data as Record<string, unknown>).row);

		expect(stored.some((row) => typeof row === 'number')).toBe(true);
	});

	it('reads and drops the stored rows', () => {
		const result = readDocument(syntheticV1());
		if (!result.ok) throw new Error(result.error);

		for (const node of result.document.graph.nodes) {
			expect(node.data).not.toHaveProperty('row');
		}
	});

	it('derives exactly the rows it used to store', () => {
		const legacy = syntheticV1();
		const result = readDocument(legacy);
		if (!result.ok) throw new Error(result.error);

		const { nodes, edges } = hydrateGraph(result.document.graph);
		const derived = computeRows(nodes, edges);

		for (const node of legacy.graph.nodes) {
			const stored = (node.data as Record<string, unknown>).row ?? null;
			expect(derived.get(node.id) ?? null).toBe(stored);
		}
	});

	it('keeps the name and styling through the migration', () => {
		const result = readDocument(syntheticV1());
		if (!result.ok) throw new Error(result.error);

		expect(result.document.name).toBe('legacy-split');
		expect(result.document.config.groupBox.tint).toBe('green');
	});
});

describe('rejections', () => {
	it('refuses a project document from a newer build', () => {
		const future = { ...captured, $version: CURRENT_PROJECT_VERSION + 1 };
		const result = readDocument(future);

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toMatch(/newer version/);
	});
});
