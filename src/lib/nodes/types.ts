import GroupNode from './GroupNode.svelte';
import RowNode from './RowNode.svelte';
import SplitNode from './SplitNode.svelte';
import SplitStartNode from './SplitStartNode.svelte';
import StartNode from './StartNode.svelte';
import StepNode from './StepNode.svelte';
import SubstepNode from './SubstepNode.svelte';

import type { Component } from 'svelte';
import { type NodeProps } from '@xyflow/svelte';

import SplitIcon from '@lucide/svelte/icons/git-fork';
import StepIcon from '@lucide/svelte/icons/square';
import SubstepIcon from '@lucide/svelte/icons/workflow';
import GroupIcon from '@lucide/svelte/icons/workflow';

import type { RegisteredNodeType } from './handles.ts';

// The node vocabulary lives in `./handles.ts`, which has no component imports.
// Only the two component maps below belong here.
export * from './handles.ts';

export const nodeTypes: Record<
	RegisteredNodeType,
	Component<NodeProps, Record<string, never>, ''>
> = {
	groups: GroupNode,
	row: RowNode,
	split: SplitNode,
	splitstart: SplitStartNode,
	start: StartNode,
	step: StepNode,
	substep: SubstepNode
};

export const dragPanelNodes: Map<
	RegisteredNodeType,
	{
		icon: Component;
		label: string;
		class?: string;
	} | null
> = new Map([
	['start', null],
	['splitstart', null],
	['step', { icon: StepIcon, label: 'Step' }],
	['substep', { icon: SubstepIcon, label: 'Substep' }],
	['groups', { icon: GroupIcon, label: 'Group', class: '-rotate-90' }],
	['split', { icon: SplitIcon, label: 'Split' }]
]);
