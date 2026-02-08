import GroupNode from './GroupNode.svelte';
import SplitNode from './SplitNode.svelte';
import SplitStartNode from './SplitStartNode.svelte';
import StartNode from './StartNode.svelte';
import StepNode from './StepNode.svelte';
import SubstepNode from './SubstepNode.svelte';

import type { Component } from 'svelte';
import { type NodeProps, type HandleProps, Position } from '@xyflow/svelte';

import SplitIcon from '@lucide/svelte/icons/git-fork';
import StepIcon from '@lucide/svelte/icons/square';
import SubstepIcon from '@lucide/svelte/icons/workflow';
import GroupIcon from '@lucide/svelte/icons/workflow';

// Node Types and Defaults
// Use 'groups' instead of 'group' to avoid css name conflicts
export type RegisteredNodeType = 'groups' | 'split' | 'splitstart' | 'start' | 'step' | 'substep';
export const nodeTypes: Record<RegisteredNodeType, Component<NodeProps, {}, ''>> = {
	groups: GroupNode,
	split: SplitNode,
	splitstart: SplitStartNode,
	start: StartNode,
	step: StepNode,
	substep: SubstepNode
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
			// split
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
	graph.addEdge(groupSource, startTargetGroup);
	graph.addEdge(groupSource, stepTargetGroup);
	return graph;
};

export const handleConnectionLimits: Map<Handle, number> = new Map([
	[groupSource, Infinity],
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
	[splitSourceOutput, splitstartTargetInput],
	[splitstartSourceOutput, stepTargetInput],
	// [splitstartTargetGroup, groupSource],
	[startSourceOutput, stepTargetInput],
	[startTargetGroup, groupSource],
	[stepSourceOutput, stepTargetInput],
	[stepTargetGroup, groupSource],
	[stepSourceSubsteps, substepTarget],
]);

export const dragPanelNodes: Map<
	RegisteredNodeType,
	{
		icon: Component;
		label: string;
		class?: string;
		maxCount?: number;
	} | null
> = new Map([
	['start', null],
	['splitstart', null],
	['step', { icon: StepIcon, label: 'Step' }],
	['substep', { icon: SubstepIcon, label: 'Substep' }],
	['groups', { icon: GroupIcon, label: 'Group', class: '-rotate-90' }],
	['split', { icon: SplitIcon, label: 'Split', maxCount: 1 }],
]);

// Mixed Types
export type NodeHandleMap = {
	[key in RegisteredNodeType]: Handle[];
};

export const nodeHandles: NodeHandleMap = {
	groups: [groupSource],
	split: [splitSourceOutput, splitTargetInput],
	splitstart: [splitstartSourceOutput, splitstartTargetInput], // splitstartTargetGroup
	start: [startSourceOutput, startTargetGroup],
	step: [stepSourceOutput, stepSourceSubsteps, stepTargetInput, stepTargetGroup],
	substep: [substepTarget]
};
