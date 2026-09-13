import type { Component } from 'svelte';

import SplitIcon from '@lucide/svelte/icons/git-fork';
import StepIcon from '@lucide/svelte/icons/square';
import SubstepIcon from '@lucide/svelte/icons/workflow';
import SubPopulationIcon from '@lucide/svelte/icons/chart-pie';
import GroupIcon from '@lucide/svelte/icons/workflow';

import type { RegisteredNodeType } from '@/flow/nodes/node-types';

/**
 * How each node type appears in the drag-and-drop panel, or null when it is not
 * offered there at all.
 *
 * Presentation for one view, so it lives with that view rather than with the
 * node vocabulary. How many of a type a chart may hold is a rule about the
 * chart, not about this panel, and lives in `nodeLimits`.
 */
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
	['subpopulation', { icon: SubPopulationIcon, label: 'Sub-population' }],
	['groups', { icon: GroupIcon, label: 'Group', class: '-rotate-90' }],
	['split', { icon: SplitIcon, label: 'Split' }]
]);
