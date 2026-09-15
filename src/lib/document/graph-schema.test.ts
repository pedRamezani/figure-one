import { describe, expect, it } from 'vitest';
import type { Edge, Node } from '@xyflow/svelte';

import { dehydrateGraph, hydrateGraph, persistedNodeSchema } from './graph-schema.ts';
import { readDocument } from './read.ts';
import { createProjectDocument, emptyProjectDocument } from './project.ts';

function startNode(): Node {
	return {
		id: '1',
		type: 'start',
		position: { x: 0, y: 0 },
		data: { label: 'Screened', value: 500 }
	} as Node;
}

function stepNode(id: string): Node {
	return {
		id,
		type: 'step',
		position: { x: 0, y: 0 },
		data: { stepLabel: 'Enrolled', droppedLabel: 'Excluded', value: 420, delta: 80 }
	} as Node;
}

describe('the edge span survives storage', () => {
	function graphWithSpan(rowSpan: number) {
		const nodes = [startNode(), stepNode('2')];
		const edges: Edge[] = [
			{
				id: '1--2',
				source: '1',
				target: '2',
				sourceHandle: 'start-output',
				targetHandle: 'step-input',
				data: { rowSpan }
			} as Edge
		];

		return { nodes, edges };
	}

	it('is kept through dehydrate and hydrate', () => {
		const stored = dehydrateGraph(graphWithSpan(3));
		expect(stored.edges[0].data).toEqual({ rowSpan: 3 });

		expect(hydrateGraph(stored).edges[0].data).toEqual({ rowSpan: 3 });
	});

	it('is kept through a whole save and load', () => {
		const document = { ...emptyProjectDocument(), graph: dehydrateGraph(graphWithSpan(4)) };
		const wire = JSON.parse(JSON.stringify(createProjectDocument(document)));

		const result = readDocument(wire);
		expect(result.ok, result.ok ? '' : result.error).toBe(true);
		if (!result.ok) return;

		expect(result.document.graph.edges[0].data).toEqual({ rowSpan: 4 });
	});

	it('is not written when it is the default of one', () => {
		// Otherwise every edge in every document would carry a redundant field.
		expect(dehydrateGraph(graphWithSpan(1)).edges[0].data).toBeUndefined();
	});

	it('drops a span that is not a whole number of stages', () => {
		expect(dehydrateGraph(graphWithSpan(0)).edges[0].data).toBeUndefined();
		expect(dehydrateGraph(graphWithSpan(-2)).edges[0].data).toBeUndefined();
		expect(dehydrateGraph(graphWithSpan(2.5)).edges[0].data).toBeUndefined();
	});

	it('leaves an edge with no data alone', () => {
		const stored = dehydrateGraph({
			nodes: [startNode(), stepNode('2')],
			edges: [{ id: '1--2', source: '1', target: '2' } as Edge]
		});

		expect(stored.edges[0].data).toBeUndefined();
		expect(hydrateGraph(stored).edges[0]).not.toHaveProperty('data');
	});
});

describe('what the persisted graph strips', () => {
	it('drops the fields xyflow computes at runtime', () => {
		const stored = dehydrateGraph({
			nodes: [
				{
					...startNode(),
					measured: { width: 100, height: 40 },
					selected: true,
					dragging: true
				} as Node
			],
			edges: []
		});

		expect(stored.nodes[0]).not.toHaveProperty('measured');
		expect(stored.nodes[0]).not.toHaveProperty('selected');
		expect(stored.nodes[0]).not.toHaveProperty('dragging');
	});

	it('drops an edge whose endpoints did not survive', () => {
		const stored = dehydrateGraph({
			nodes: [startNode()],
			edges: [{ id: '1--9', source: '1', target: '9' } as Edge]
		});

		expect(stored.edges).toHaveLength(0);
	});

	it('refuses a node type that has no component', () => {
		const parsed = persistedNodeSchema.safeParse({
			id: '1',
			type: 'not-a-real-type',
			position: { x: 0, y: 0 },
			data: {}
		});

		expect(parsed.success).toBe(false);
	});

	it('reapplies that the start node cannot be deleted', () => {
		const hydrated = hydrateGraph(dehydrateGraph({ nodes: [startNode()], edges: [] }));
		expect(hydrated.nodes[0].deletable).toBe(false);
	});
});
