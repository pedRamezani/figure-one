import StartNode from "./StartNode.svelte";
import StepNode from "./StepNode.svelte";
import SubstepNode from "./SubstepNode.svelte";

import type { Component } from "svelte";
import type { NodeProps } from "@xyflow/svelte";

export type RegisteredNodeType = 'start' | 'step' | 'substep';
export const nodeTypes: Record<RegisteredNodeType, Component<NodeProps, {}, ''>> = {
    start: StartNode,
    step: StepNode,
    substep: SubstepNode
};