import { describe, expect, it } from 'vitest';

import {
	convertFlowchartToTypstFlowchartData,
	parseTypstFlowchartJSON,
	type TypstFlowchartData
} from './convert.ts';
import { createIdAllocator } from '@/flow/ids';
import { flowchartDataSchema } from '@/document/data';

import linear from '@/document/fixtures/data-v2-linear.json' with { type: 'json' };
import splits from '@/document/fixtures/data-v2-splits.json' with { type: 'json' };

// Read through the schema so fields added after a fixture was frozen are
// defaulted on both sides of the comparison. The fixtures stay untouched.
const fixtures: Record<string, TypstFlowchartData> = {
	linear: flowchartDataSchema.parse(linear.data),
	splits: flowchartDataSchema.parse(splits.data)
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

describe('sub-populations', () => {
	/** A start box with a breakdown of where its population came from. */
	const withSources: TypstFlowchartData = {
		steps: {
			main: [
				{
					label: 'Records identified from:',
					value: 253,
					subPopulations: [
						{ label: 'Web of Science', value: 139 },
						{ label: 'Scopus', value: 114 }
					],
					delta: null
				},
				{
					label: 'Records screened',
					value: 174,
					subPopulations: [],
					delta: { label: 'Duplicate records removed', value: 79, substeps: [] }
				}
			],
			splits: []
		},
		groups: {}
	};

	it('round trips a start box breakdown', () => {
		expect(roundTrip(withSources)).toEqual(withSources);
	});

	it('builds a sub-population node per source', () => {
		const graph = parseTypstFlowchartJSON(withSources, createIdAllocator());
		expect(graph.nodes.filter((n) => n.type === 'subpopulation')).toHaveLength(2);
	});

	it('does not build substeps for them', () => {
		// They are a different node type now, so they cannot be confused with
		// the exclusion reasons they sit beside.
		const graph = parseTypstFlowchartJSON(withSources, createIdAllocator());
		expect(graph.nodes.filter((n) => n.type === 'substep')).toHaveLength(0);
	});

	it('hangs them off the start box, not the exclusion', () => {
		const graph = parseTypstFlowchartJSON(withSources, createIdAllocator());

		const sourceEdges = graph.edges.filter((e) => e.sourceHandle === 'start-subpopulations');
		expect(sourceEdges).toHaveLength(2);

		const start = graph.nodes.find((n) => n.type === 'start')!;
		expect(sourceEdges.every((e) => e.source === start.id)).toBe(true);
	});

	it('keeps them out of the exclusion list', () => {
		// The second step has an exclusion with no reasons; the first step's
		// sources must not leak into it.
		expect(roundTrip(withSources).steps.main[1].delta?.substeps).toEqual([]);
	});

	it('leaves a chart without any as an empty list', () => {
		for (const step of roundTrip(fixtures.linear).steps.main) {
			expect(step.subPopulations).toEqual([]);
		}
	});
});
