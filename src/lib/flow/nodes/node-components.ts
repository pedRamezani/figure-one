import type { Component } from 'svelte';
import { type NodeProps } from '@xyflow/svelte';

import GroupNode from './GroupNode.svelte';
import RowNode from './RowNode.svelte';
import SplitNode from './SplitNode.svelte';
import SplitStartNode from './SplitStartNode.svelte';
import StartNode from './StartNode.svelte';
import StepNode from './StepNode.svelte';
import SubstepNode from './SubstepNode.svelte';

import type { RegisteredNodeType } from './node-types.ts';

/**
 * Which component renders each node type.
 *
 * Kept apart from `node-types.ts` on purpose. Importing this pulls in every
 * node component, and through them the whole UI, so anything that only needs
 * the vocabulary must import `node-types.ts` instead. Merging the two is what
 * previously created an import cycle through `Flow.svelte`.
 */
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
