import { type HandleProps, Position } from '@xyflow/svelte';

// The node vocabulary: which node types exist, what data they carry, and which
// handles they expose. Deliberately free of Svelte components.
//
// The component map lives in `./types.ts`, which re-exports everything here.
// Keeping the two apart breaks the import cycle that otherwise runs
// types.ts → SplitNode.svelte → Flow.svelte → types.ts, and lets pure data code
// such as `convert.ts` be imported without dragging in the whole UI.

// Node Types and Defaults
// Use 'groups' instead of 'group' to avoid css name conflicts
export type RegisteredNodeType =
	| 'groups'
	| 'row'
	| 'split'
	| 'splitstart'
	| 'start'
	| 'step'
	| 'substep';

/**
 * How many of a node type one chart may contain. Absent means unlimited.
 *
 * A CONSORT diagram has one start and at most one split. More than one split
 * is not supported: rows are numbered per split, so two of them would fold
 * their stages together.
 */
export const nodeLimits: Partial<Record<RegisteredNodeType, number>> = {
	start: 1,
	split: 1
};

export const getNodeDataDefaults = (type: RegisteredNodeType): Record<string, unknown> => {
	switch (type) {
		case 'groups':
			return { group: '' };
		case 'splitstart':
			return { label: 'Split start population', value: 0 };
		case 'step':
			return {
				value: null,
				delta: 0,
				stepLabel: 'Step',
				droppedLabel: 'excluded'
			};
		case 'substep':
			return { delta: 0, label: 'Substep' };
		case 'start':
			return { label: 'Start population', value: 1000 };
		default:
			// split, row
			return {};
	}
};

// Handle Types and Definitions
export type HandleType = HandleProps['type'];

export type Handle = {
	nodeType: RegisteredNodeType;
	handleId: string;
	handleType: HandleType;
	position: Position;
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
	position: Position.Right
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

export const handleGraph = (): Graph<Handle> => {
	const graph = new Graph<Handle>();
	graph.addEdge(splitSourceOutput, splitstartTargetInput);
	graph.addEdge(splitstartSourceOutput, stepTargetInput);
	graph.addEdge(startSourceOutput, stepTargetInput);
	graph.addEdge(stepSourceOutput, stepTargetInput);
	graph.addEdge(stepSourceOutput, splitTargetInput);
	graph.addEdge(stepSourceSubsteps, substepTarget);
	// graph.addEdge(groupSource, splitstartTargetGroup);
	graph.addEdge(groupSource, rowTargetGroup);
	graph.addEdge(groupSource, startTargetGroup);
	graph.addEdge(groupSource, stepTargetGroup);
	return graph;
};

export const handleConnectionLimits: Map<Handle, number> = new Map([
	[groupSource, Infinity],
	[rowTargetGroup, 1],
	[splitSourceOutput, Infinity],
	[splitTargetInput, 1],
	[splitstartSourceOutput, 1],
	// [splitstartTargetGroup, 1],
	[splitstartTargetInput, 1],
	[startSourceOutput, 1],
	[startTargetGroup, 1],
	[stepSourceOutput, 1],
	[stepSourceSubsteps, Infinity],
	[stepTargetGroup, 1],
	[stepTargetInput, 1],
	[substepTarget, 1]
]);

export const handleDragCreate: Map<Handle, Handle> = new Map([
	[rowTargetGroup, groupSource],
	[splitSourceOutput, splitstartTargetInput],
	[splitstartSourceOutput, stepTargetInput],
	// [splitstartTargetGroup, groupSource],
	[startSourceOutput, stepTargetInput],
	[startTargetGroup, groupSource],
	[stepSourceOutput, stepTargetInput],
	[stepTargetGroup, groupSource],
	[stepSourceSubsteps, substepTarget]
]);

// Mixed Types
export type NodeHandleMap = {
	[key in RegisteredNodeType]: Handle[];
};

export const nodeHandles: NodeHandleMap = {
	groups: [groupSource],
	row: [rowTargetGroup],
	split: [splitSourceOutput, splitTargetInput],
	splitstart: [splitstartSourceOutput, splitstartTargetInput], // splitstartTargetGroup
	start: [startSourceOutput, startTargetGroup],
	step: [stepSourceOutput, stepSourceSubsteps, stepTargetInput, stepTargetGroup],
	substep: [substepTarget]
};
