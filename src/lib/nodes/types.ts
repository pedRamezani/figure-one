import GroupNode from './GroupNode.svelte';
import StartNode from './StartNode.svelte';
import StepNode from './StepNode.svelte';
import SubstepNode from './SubstepNode.svelte';

import type { Component } from 'svelte';
import { type NodeProps, type HandleProps, Position } from '@xyflow/svelte';

import StepIcon from '@lucide/svelte/icons/square';
import SubstepIcon from '@lucide/svelte/icons/workflow';
import GroupIcon from '@lucide/svelte/icons/workflow';

// Node Types and Defaults
export type RegisteredNodeType = 'group' | 'start' | 'step' | 'substep';
export const nodeTypes: Record<RegisteredNodeType, Component<NodeProps, {}, ''>> = {
	group: GroupNode,
	start: StartNode,
	step: StepNode,
	substep: SubstepNode
};

export const getNodeDataDefaults = (type: RegisteredNodeType): Record<string, unknown> => {
	switch (type) {
		case 'group':
			return { group: '' };
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
	nodeType: 'group',
	handleId: 'group',
	handleType: 'source',
	position: Position.Right
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
	graph.addEdge(startSourceOutput, stepTargetInput);
	graph.addEdge(stepSourceOutput, stepTargetInput);
	graph.addEdge(stepSourceSubsteps, substepTarget);
	graph.addEdge(groupSource, startTargetGroup);
	graph.addEdge(groupSource, stepTargetGroup);
	return graph;
};

export const handleConnectionLimits: Map<Handle, number> = new Map([
	[groupSource, Infinity],
	[startSourceOutput, 1],
	[startTargetGroup, 1],
	[stepSourceOutput, 1],
	[stepSourceSubsteps, Infinity],
	[stepTargetInput, 1],
	[stepTargetGroup, 1],
	[substepTarget, 1]
]);

export const handleDragCreate: Map<Handle, Handle> = new Map([
	[startSourceOutput, stepTargetInput],
	[startTargetGroup, groupSource],
	[stepSourceOutput, stepTargetInput],
	[stepTargetGroup, groupSource],
	[stepSourceSubsteps, substepTarget]
]);

export const dragPanelNodes: Map<RegisteredNodeType, {
	icon: Component;
	label: string;
	class?: string;
} | null> = new Map([
	["start", null],
	["step", { icon: StepIcon, label: 'Step' }],
	["substep", { icon: SubstepIcon, label: 'Substep' }],
	["group", { icon: GroupIcon, label: 'Group', class: '-rotate-90' }],
]);

// Mixed Types
export type NodeHandleMap = {
	[key in RegisteredNodeType]: Handle[];
};

export const nodeHandles: NodeHandleMap = {
	group: [groupSource],
	start: [startSourceOutput, startTargetGroup],
	step: [stepSourceOutput, stepSourceSubsteps, stepTargetInput, stepTargetGroup],
	substep: [substepTarget]
};
