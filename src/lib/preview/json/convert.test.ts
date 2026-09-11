import { describe, expect, it } from 'vitest';

import {
	convertFlowchartToTypstFlowchartData,
	parseTypstFlowchartJSON,
	type TypstFlowchartData
} from './convert.ts';
import { createIdAllocator } from '@/nodes/ids';

import linear from '@/document/fixtures/data-v2-linear.json' with { type: 'json' };
import splits from '@/document/fixtures/data-v2-splits.json' with { type: 'json' };

const fixtures: Record<string, TypstFlowchartData> = {
	linear: linear.data as TypstFlowchartData,
	splits: splits.data as TypstFlowchartData
};

/** Semantic data → graph → semantic data. Must be the identity. */
function roundTrip(data: TypstFlowchartData): TypstFlowchartData {
	const graph = parseTypstFlowchartJSON(data, createIdAllocator());
	return convertFlowchartToTypstFlowchartData(graph);
}

describe('convert and parse round trip', () => {
	for (const [name, data] of Object.entries(fixtures)) {
		it(`preserves ${name}`, () => {
			expect(roundTrip(data)).toEqual(data);
		});

		it(`is stable on a second pass for ${name}`, () => {
			expect(roundTrip(roundTrip(data))).toEqual(roundTrip(data));
		});
	}
});

describe('group indices', () => {
	it('addresses split rows by row, not by cell', () => {
		// The splits fixture has two main steps and three split rows of two
		// columns each, so the rows must occupy indices 2, 3 and 4. Consuming
		// one index per cell would push them to 2, 4 and 6 and silently
		// reassign every group below the first split.
		const data = fixtures.splits;

		expect(data.steps.main).toHaveLength(2);
		expect(data.steps.splits).toHaveLength(3);
		expect(data.steps.splits.every((row) => row.length === 2)).toBe(true);

		expect(roundTrip(data).groups).toEqual({
			Enrolment: [0, 1],
			Allocation: [2],
			'Follow-Up': [3],
			Analysis: [4]
		});
	});

	it('keeps every group name that was assigned', () => {
		const produced = roundTrip(fixtures.splits).groups;
		expect(Object.keys(produced).sort()).toEqual(Object.keys(fixtures.splits.groups).sort());
	});
});

describe('edge ids', () => {
	it('uses the double dash form everywhere', () => {
		const graph = parseTypstFlowchartJSON(fixtures.splits, createIdAllocator());

		for (const edge of graph.edges) {
			expect(edge.id).toBe(`${edge.source}--${edge.target}`);
		}
	});

	it('mints unique ids for every node and edge', () => {
		const graph = parseTypstFlowchartJSON(fixtures.splits, createIdAllocator());

		const nodeIds = graph.nodes.map((n) => n.id);
		const edgeIds = graph.edges.map((e) => e.id);

		expect(new Set(nodeIds).size).toBe(nodeIds.length);
		expect(new Set(edgeIds).size).toBe(edgeIds.length);
	});
});

describe('id allocation', () => {
	it('is deterministic for a given allocator', () => {
		const first = parseTypstFlowchartJSON(fixtures.linear, createIdAllocator());
		const second = parseTypstFlowchartJSON(fixtures.linear, createIdAllocator());

		expect(first.nodes.map((n) => n.id)).toEqual(second.nodes.map((n) => n.id));
	});

	it('continues from a seeded allocator rather than colliding', () => {
		const graph = parseTypstFlowchartJSON(fixtures.linear, createIdAllocator(100));

		expect(graph.nodes.every((n) => Number(n.id) >= 100)).toBe(true);
	});
});

describe('empty input', () => {
	it('produces an empty document when there is no start node', () => {
		expect(convertFlowchartToTypstFlowchartData({ nodes: [], edges: [] })).toEqual({
			steps: { main: [], splits: [] },
			groups: {}
		});
	});
});
