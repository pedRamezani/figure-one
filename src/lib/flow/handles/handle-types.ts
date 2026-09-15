import { type HandleProps, Position } from '@xyflow/svelte';

import type { RegisteredNodeType } from '../nodes/node-types.ts';

/**
 * The handle vocabulary: every connection point a node exposes, which handles
 * may connect to which, and how many connections each will accept.
 *
 * Handles reference node types, never the other way round. `nodeHandles` maps
 * a node type to its handles and lives here for that reason: it is built from
 * the handle constants, and a `Handle` already knows the node it belongs to.
 *
 * No components. Keeping this free of Svelte is what lets pure data code such
 * as `convert.ts` and `rows.ts` import it.
 */

export type HandleType = HandleProps['type'];

export type Handle = {
	nodeType: RegisteredNodeType;
	handleId: string;
	handleType: HandleType;
	position: Position;
	/**
	 * Where along its edge the handle sits, as a CSS percentage.
	 *
	 * Only needed when a node exposes two handles on the same side, which would
	 * otherwise sit on top of each other. Absent means centred.
	 */
	offset?: string;
};

export const groupSource: Handle = {
	nodeType: 'groups',
	handleId: 'group',
	handleType: 'source',
	position: Position.Right
};

export const rowTargetGroup: Handle = {
	nodeType: 'row',
	handleId: 'row-group',
	handleType: 'target',
	position: Position.Left
};

export const splitSourceOutput: Handle = {
	nodeType: 'split',
	handleId: 'split-output',
	handleType: 'source',
	position: Position.Bottom
};

export const splitTargetInput: Handle = {
	nodeType: 'split',
	handleId: 'split-input',
	handleType: 'target',
	position: Position.Top
};

export const splitstartSourceOutput: Handle = {
	nodeType: 'splitstart',
	handleId: 'splitstart-output',
	handleType: 'source',
	position: Position.Bottom
};

// export const splitstartTargetGroup: Handle = {
// 	nodeType: 'splitstart',
// 	handleId: 'splitstart-group',
// 	handleType: 'target',
// 	position: Position.Left
// };

export const splitstartTargetInput: Handle = {
	nodeType: 'splitstart',
	handleId: 'splitstart-input',
	handleType: 'target',
	position: Position.Top
};

export const startSourceOutput: Handle = {
	nodeType: 'start',
	handleId: 'start-output',
	handleType: 'source',
	position: Position.Bottom
};

export const startSourceSubPopulations: Handle = {
	nodeType: 'start',
	handleId: 'start-subpopulations',
	handleType: 'source',
	position: Position.Right
};

export const splitstartSourceSubPopulations: Handle = {
	nodeType: 'splitstart',
	handleId: 'splitstart-subpopulations',
	handleType: 'source',
	position: Position.Right
};

export const stepSourceSubPopulations: Handle = {
	nodeType: 'step',
	handleId: 'step-subpopulations',
	handleType: 'source',
	position: Position.Right,
	offset: '30%'
};

export const subPopulationTarget: Handle = {
	nodeType: 'subpopulation',
	handleId: 'subpopulation',
	handleType: 'target',
	position: Position.Left
};

export const startTargetGroup: Handle = {
	nodeType: 'start',
	handleId: 'start-group',
	handleType: 'target',
	position: Position.Left
};

export const stepSourceOutput: Handle = {
	nodeType: 'step',
	handleId: 'step-output',
	handleType: 'source',
	position: Position.Bottom
};

export const stepSourceSubsteps: Handle = {
	nodeType: 'step',
	handleId: 'step-substeps',
	handleType: 'source',
	position: Position.Right,
	offset: '70%'
};

export const stepTargetInput: Handle = {
	nodeType: 'step',
	handleId: 'step-input',
	handleType: 'target',
	position: Position.Top
};

export const stepTargetGroup: Handle = {
	nodeType: 'step',
	handleId: 'step-group',
	handleType: 'target',
	position: Position.Left
};

export const substepTarget: Handle = {
	nodeType: 'substep',
	handleId: 'substep',
	handleType: 'target',
	position: Position.Left
};

class Graph<T> {
	adjacencyList: Map<T, Set<T>>;

	constructor() {
		this.adjacencyList = new Map();
	}

	addNode(node: T): void {
		this.adjacencyList.set(node, new Set());
	}

	addEdge(node1: T, node2: T): void {
		this.getNeighboors(node1).add(node2);
		this.getNeighboors(node2).add(node1);
	}

	getNeighboors(node: T): Set<T> {
		if (!this.hasNode(node)) {
			this.addNode(node);
		}
		return this.adjacencyList.get(node)!;
	}

	hasNode(node: T): boolean {
		return this.adjacencyList.has(node);
	}

	hasEdge(node1: T, node2: T): boolean {
		return this.getNeighboors(node1).has(node2);
	}
}

/** Which handles are allowed to connect to which. */
export const handleGraph = (): Graph<Handle> => {
	const graph = new Graph<Handle>();
	graph.addEdge(splitSourceOutput, splitstartTargetInput);
	graph.addEdge(splitstartSourceOutput, stepTargetInput);
	graph.addEdge(startSourceOutput, stepTargetInput);
	graph.addEdge(stepSourceOutput, stepTargetInput);
	graph.addEdge(stepSourceOutput, splitTargetInput);
	graph.addEdge(stepSourceSubsteps, substepTarget);
	graph.addEdge(startSourceSubPopulations, subPopulationTarget);
	graph.addEdge(splitstartSourceSubPopulations, subPopulationTarget);
	graph.addEdge(stepSourceSubPopulations, subPopulationTarget);
	// graph.addEdge(groupSource, splitstartTargetGroup);
	graph.addEdge(groupSource, rowTargetGroup);
	graph.addEdge(groupSource, startTargetGroup);
	graph.addEdge(groupSource, stepTargetGroup);
	return graph;
};

/** How many connections each handle accepts. */
export const handleConnectionLimits: Map<Handle, number> = new Map([
	[groupSource, Infinity],
	[rowTargetGroup, 1],
	[splitSourceOutput, Infinity],
	[splitTargetInput, 1],
	[splitstartSourceOutput, 1],
	// [splitstartTargetGroup, 1],
	[splitstartTargetInput, 1],
	[startSourceOutput, 1],
	[startSourceSubPopulations, Infinity],
	[splitstartSourceSubPopulations, Infinity],
	[stepSourceSubPopulations, Infinity],
	[subPopulationTarget, 1],
	[startTargetGroup, 1],
	[stepSourceOutput, 1],
	[stepSourceSubsteps, Infinity],
	[stepTargetGroup, 1],
	[stepTargetInput, 1],
	[substepTarget, 1]
]);

/** Dragging from a handle into empty space creates the handle it maps to. */
export const handleDragCreate: Map<Handle, Handle> = new Map([
	[rowTargetGroup, groupSource],
	[splitSourceOutput, splitstartTargetInput],
	[splitstartSourceOutput, stepTargetInput],
	// [splitstartTargetGroup, groupSource],
	[startSourceOutput, stepTargetInput],
	[startTargetGroup, groupSource],
	[stepSourceOutput, stepTargetInput],
	[stepTargetGroup, groupSource],
	[stepSourceSubsteps, substepTarget],
	[startSourceSubPopulations, subPopulationTarget],
	[splitstartSourceSubPopulations, subPopulationTarget],
	[stepSourceSubPopulations, subPopulationTarget]
]);

export type NodeHandleMap = {
	[key in RegisteredNodeType]: Handle[];
};

/** Which handles each node type exposes. */
export const nodeHandles: NodeHandleMap = {
	groups: [groupSource],
	row: [rowTargetGroup],
	split: [splitSourceOutput, splitTargetInput],
	splitstart: [splitstartSourceOutput, splitstartSourceSubPopulations, splitstartTargetInput],
	start: [startSourceOutput, startSourceSubPopulations, startTargetGroup],
	step: [
		stepSourceOutput,
		stepSourceSubsteps,
		stepSourceSubPopulations,
		stepTargetInput,
		stepTargetGroup
	],
	subpopulation: [subPopulationTarget],
	substep: [substepTarget]
};
