import { describe, expect, it } from 'vitest';
import type { Edge, Node } from '@xyflow/svelte';

import { computeRows, reconcileRowContainers, rowSpanOf } from './rows.ts';
import { createIdAllocator, edgeId } from './ids.ts';
import {
	splitSourceOutput,
	splitstartSourceOutput,
	splitstartTargetInput,
	stepSourceOutput,
	stepSourceSubsteps,
	stepTargetInput,
	substepTarget,
	startSourceOutput
} from './handles.ts';

function node(id: string, type: string, extra: Partial<Node> = {}): Node {
	return { id, type, position: { x: 0, y: 0 }, data: {}, ...extra } as Node;
}

function edge(
	source: string,
	target: string,
	sourceHandle: string,
	targetHandle: string,
	data?: Record<string, unknown>
): Edge {
	return { id: edgeId(source, target), source, target, sourceHandle, targetHandle, data } as Edge;
}

/** start → step → split → two split starts → one step under each. */
function splitGraph() {
	const nodes = [
		node('0', 'start'),
		node('1', 'step'),
		node('2', 'split'),
		node('3', 'splitstart'),
		node('4', 'splitstart'),
		node('5', 'step'),
		node('6', 'step')
	];

	const edges = [
		edge('0', '1', startSourceOutput.handleId, stepTargetInput.handleId),
		edge('1', '2', stepSourceOutput.handleId, 'split-input'),
		edge('2', '3', splitSourceOutput.handleId, splitstartTargetInput.handleId),
		edge('2', '4', splitSourceOutput.handleId, splitstartTargetInput.handleId),
		edge('3', '5', splitstartSourceOutput.handleId, stepTargetInput.handleId),
		edge('4', '6', splitstartSourceOutput.handleId, stepTargetInput.handleId)
	];

	return { nodes, edges };
}

describe('rowSpanOf', () => {
	it('defaults to one', () => {
		expect(rowSpanOf({})).toBe(1);
		expect(rowSpanOf({ data: undefined })).toBe(1);
		expect(rowSpanOf({ data: {} })).toBe(1);
	});

	it('reads a whole number of stages', () => {
		expect(rowSpanOf({ data: { rowSpan: 3 } })).toBe(3);
	});

	it('ignores nonsense rather than propagating it', () => {
		expect(rowSpanOf({ data: { rowSpan: 0 } })).toBe(1);
		expect(rowSpanOf({ data: { rowSpan: -2 } })).toBe(1);
		expect(rowSpanOf({ data: { rowSpan: 1.5 } })).toBe(1);
		expect(rowSpanOf({ data: { rowSpan: 'two' } })).toBe(1);
	});
});

describe('computeRows', () => {
	it('leaves the main spine without a row', () => {
		const { nodes, edges } = splitGraph();
		const rows = computeRows(nodes, edges);

		expect(rows.get('0')).toBeNull();
		expect(rows.get('1')).toBeNull();
		expect(rows.get('2')).toBeNull();
	});

	it('puts connected split starts on row zero', () => {
		const { nodes, edges } = splitGraph();
		const rows = computeRows(nodes, edges);

		expect(rows.get('3')).toBe(0);
		expect(rows.get('4')).toBe(0);
	});

	it('advances one row per step', () => {
		const { nodes, edges } = splitGraph();
		const rows = computeRows(nodes, edges);

		expect(rows.get('5')).toBe(1);
		expect(rows.get('6')).toBe(1);
	});

	it('leaves an unconnected split start on the main spine', () => {
		const nodes = [node('0', 'start'), node('9', 'splitstart')];
		const rows = computeRows(nodes, []);

		expect(rows.get('9')).toBeNull();
	});

	it('gives a substep the row of its step', () => {
		const { nodes, edges } = splitGraph();
		nodes.push(node('7', 'substep'));
		edges.push(edge('5', '7', stepSourceSubsteps.handleId, substepTarget.handleId));

		const rows = computeRows(nodes, edges);
		expect(rows.get('7')).toBe(1);
	});

	it('leaves a substep on the main spine without a row', () => {
		const nodes = [node('0', 'start'), node('1', 'step'), node('2', 'substep')];
		const edges = [
			edge('0', '1', startSourceOutput.handleId, stepTargetInput.handleId),
			edge('1', '2', stepSourceSubsteps.handleId, substepTarget.handleId)
		];

		expect(computeRows(nodes, edges).get('2')).toBeNull();
	});

	it('leaves an orphan node without a row', () => {
		const { nodes, edges } = splitGraph();
		nodes.push(node('99', 'step'));

		expect(computeRows(nodes, edges).get('99')).toBeNull();
	});

	it('terminates on a cycle', () => {
		const nodes = [
			node('0', 'split'),
			node('1', 'splitstart'),
			node('2', 'step'),
			node('3', 'step')
		];
		const edges = [
			edge('0', '1', splitSourceOutput.handleId, splitstartTargetInput.handleId),
			edge('1', '2', splitstartSourceOutput.handleId, stepTargetInput.handleId),
			edge('2', '3', stepSourceOutput.handleId, stepTargetInput.handleId),
			edge('3', '2', stepSourceOutput.handleId, stepTargetInput.handleId)
		];

		expect(() => computeRows(nodes, edges)).not.toThrow();
	});

	it('ignores edges pointing at nodes that are gone', () => {
		const { nodes, edges } = splitGraph();
		edges.push(edge('5', 'deleted', stepSourceOutput.handleId, stepTargetInput.handleId));

		expect(() => computeRows(nodes, edges)).not.toThrow();
	});
});

describe('computeRows with spans', () => {
	it('skips a stage when an edge spans two', () => {
		const { nodes, edges } = splitGraph();

		// Column one has nothing at stage one, so its next step is at stage two.
		const spanning = edges.find((e) => e.source === '4')!;
		spanning.data = { rowSpan: 2 };

		const rows = computeRows(nodes, edges);

		expect(rows.get('5')).toBe(1);
		expect(rows.get('6')).toBe(2);
	});

	it('accumulates spans down a column', () => {
		const nodes = [
			node('0', 'split'),
			node('1', 'splitstart'),
			node('2', 'step'),
			node('3', 'step')
		];
		const edges = [
			edge('0', '1', splitSourceOutput.handleId, splitstartTargetInput.handleId),
			edge('1', '2', splitstartSourceOutput.handleId, stepTargetInput.handleId, { rowSpan: 2 }),
			edge('2', '3', stepSourceOutput.handleId, stepTargetInput.handleId, { rowSpan: 3 })
		];

		const rows = computeRows(nodes, edges);

		expect(rows.get('2')).toBe(2);
		expect(rows.get('3')).toBe(5);
	});

	it('carries a spanned row down to substeps', () => {
		const nodes = [
			node('0', 'split'),
			node('1', 'splitstart'),
			node('2', 'step'),
			node('3', 'substep')
		];
		const edges = [
			edge('0', '1', splitSourceOutput.handleId, splitstartTargetInput.handleId),
			edge('1', '2', splitstartSourceOutput.handleId, stepTargetInput.handleId, { rowSpan: 4 }),
			edge('2', '3', stepSourceSubsteps.handleId, substepTarget.handleId)
		];

		expect(computeRows(nodes, edges).get('3')).toBe(4);
	});
});

describe('reconcileRowContainers', () => {
	it('creates one container per row', () => {
		const { nodes, edges } = splitGraph();
		const rows = computeRows(nodes, edges);

		const next = reconcileRowContainers(nodes, rows, createIdAllocator(100));
		expect(next).not.toBeNull();

		const containers = next!.filter((n) => n.type === 'row');
		expect(containers).toHaveLength(2);
	});

	it('puts every node of a row in the same container', () => {
		const { nodes, edges } = splitGraph();
		const rows = computeRows(nodes, edges);
		const next = reconcileRowContainers(nodes, rows, createIdAllocator(100))!;

		const byId = new Map(next.map((n) => [n.id, n]));
		expect(byId.get('3')!.parentId).toBe(byId.get('4')!.parentId);
		expect(byId.get('5')!.parentId).toBe(byId.get('6')!.parentId);
		expect(byId.get('3')!.parentId).not.toBe(byId.get('5')!.parentId);
	});

	it('leaves main spine nodes unparented', () => {
		const { nodes, edges } = splitGraph();
		const rows = computeRows(nodes, edges);
		const next = reconcileRowContainers(nodes, rows, createIdAllocator(100))!;

		const byId = new Map(next.map((n) => [n.id, n]));
		expect(byId.get('0')!.parentId).toBeUndefined();
		expect(byId.get('1')!.parentId).toBeUndefined();
	});

	it('puts containers before their children', () => {
		const { nodes, edges } = splitGraph();
		const rows = computeRows(nodes, edges);
		const next = reconcileRowContainers(nodes, rows, createIdAllocator(100))!;

		for (const [index, candidate] of next.entries()) {
			if (candidate.parentId === undefined) continue;
			const parentIndex = next.findIndex((n) => n.id === candidate.parentId);
			expect(parentIndex).toBeLessThan(index);
		}
	});

	it('is idempotent', () => {
		const { nodes, edges } = splitGraph();
		const rows = computeRows(nodes, edges);
		const once = reconcileRowContainers(nodes, rows, createIdAllocator(100))!;

		expect(
			reconcileRowContainers(once, computeRows(once, edges), createIdAllocator(200))
		).toBeNull();
	});

	it('reports no change for a graph with no rows', () => {
		const nodes = [node('0', 'start'), node('1', 'step')];
		const edges = [edge('0', '1', startSourceOutput.handleId, stepTargetInput.handleId)];

		expect(
			reconcileRowContainers(nodes, computeRows(nodes, edges), createIdAllocator())
		).toBeNull();
	});

	it('converts absolute positions to positions inside the container', () => {
		const { nodes, edges } = splitGraph();
		nodes.find((n) => n.id === '3')!.position = { x: 500, y: 300 };

		const rows = computeRows(nodes, edges);
		const next = reconcileRowContainers(nodes, rows, createIdAllocator(100))!;

		const byId = new Map(next.map((n) => [n.id, n]));
		const child = byId.get('3')!;
		const container = byId.get(child.parentId!)!;

		expect(container.position.x + child.position.x).toBe(500);
		expect(container.position.y + child.position.y).toBe(300);
	});

	it('releases a node that lost its row, restoring absolute position', () => {
		const { nodes, edges } = splitGraph();
		const parented = reconcileRowContainers(
			nodes,
			computeRows(nodes, edges),
			createIdAllocator(100)
		)!;

		const byId = new Map(parented.map((n) => [n.id, n]));
		const before = byId.get('5')!;
		const container = byId.get(before.parentId!)!;
		const absoluteX = container.position.x + before.position.x;

		// Cut the split apart, so nothing has a row any more.
		const released = reconcileRowContainers(
			parented,
			computeRows(parented, []),
			createIdAllocator(300)
		)!;

		const after = released.find((n) => n.id === '5')!;
		expect(after.parentId).toBeUndefined();
		expect(after.position.x).toBe(absoluteX);
	});

	it('removes a container once nobody is in it', () => {
		const { nodes, edges } = splitGraph();
		const parented = reconcileRowContainers(
			nodes,
			computeRows(nodes, edges),
			createIdAllocator(100)
		)!;

		expect(parented.filter((n) => n.type === 'row')).toHaveLength(2);

		const released = reconcileRowContainers(
			parented,
			computeRows(parented, []),
			createIdAllocator(300)
		)!;
		expect(released.filter((n) => n.type === 'row')).toHaveLength(0);
	});

	it('gives a spanned row its own container', () => {
		const { nodes, edges } = splitGraph();
		edges.find((e) => e.source === '4')!.data = { rowSpan: 2 };

		const rows = computeRows(nodes, edges);
		const next = reconcileRowContainers(nodes, rows, createIdAllocator(100))!;

		// Rows zero, one and two exist, even though row one has a single arm.
		expect(next.filter((n) => n.type === 'row')).toHaveLength(3);

		const byId = new Map(next.map((n) => [n.id, n]));
		expect(byId.get('5')!.parentId).not.toBe(byId.get('6')!.parentId);
	});
});

describe('the reconcile loop settles', () => {
	/**
	 * Stands in for the effect in Flow.svelte, which reassigns the nodes it
	 * reads. If reconcile ever stopped returning null the effect would re-run
	 * forever and Svelte would abort with an update-depth error.
	 */
	function runToFixpoint(startNodes: Node[], edges: Edge[], limit = 10) {
		let current = startNodes;
		let passes = 0;

		for (; passes < limit; passes++) {
			const next = reconcileRowContainers(
				current,
				computeRows(current, edges),
				createIdAllocator(500 + passes * 50)
			);
			if (next === null) return { nodes: current, passes };
			current = next;
		}

		throw new Error(`reconcile did not settle within ${limit} passes`);
	}

	it('settles after a single change', () => {
		const { nodes, edges } = splitGraph();
		expect(runToFixpoint(nodes, edges).passes).toBe(1);
	});

	it('settles when rows are spanned', () => {
		const { nodes, edges } = splitGraph();
		edges.find((e) => e.source === '4')!.data = { rowSpan: 3 };

		expect(runToFixpoint(nodes, edges).passes).toBe(1);
	});

	it('settles again after the split is cut apart', () => {
		const { nodes, edges } = splitGraph();
		const settled = runToFixpoint(nodes, edges).nodes;

		const released = runToFixpoint(settled, []);
		expect(released.passes).toBe(1);
		expect(released.nodes.filter((n) => n.type === 'row')).toHaveLength(0);
	});

	it('settles immediately on a chart with no split', () => {
		const nodes = [node('0', 'start'), node('1', 'step')];
		const edges = [edge('0', '1', startSourceOutput.handleId, stepTargetInput.handleId)];

		expect(runToFixpoint(nodes, edges).passes).toBe(0);
	});

	it('does not disturb a node being dragged inside its container', () => {
		const { nodes, edges } = splitGraph();
		const settled = runToFixpoint(nodes, edges).nodes;

		// xyflow hands back new objects while dragging, with a moved position.
		const dragged = settled.map((n) =>
			n.id === '5'
				? { ...n, dragging: true, position: { x: n.position.x + 40, y: n.position.y } }
				: n
		);

		expect(
			reconcileRowContainers(dragged, computeRows(dragged, edges), createIdAllocator(900))
		).toBeNull();
	});
});
