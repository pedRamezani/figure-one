<script module>
	let id = 1;
	const getId = () => `${id++}`;

	export function addNode(
		nodeType: RegisteredNodeType,
		position: {
			x: number;
			y: number;
		},
		origin: [number, number] = [0.5, 0.5]
	): Node {
		const id = getId();

		const newNode = {
			id: id,
			type: nodeType,
			position,
			data: getNodeDataDefaults(nodeType),
			origin: origin
		} satisfies Node;

		nodes = [...nodes, newNode];

		return newNode;
	}

	export type RegisteredNodeType = 'start' | 'step' | 'substep';
	const nodeTypes: Record<RegisteredNodeType, Component<NodeProps, {}, ''>> = {
		start: StartNode,
		step: StepNode,
		substep: SubstepNode
	};

	const getNodeDataDefaults = (type: RegisteredNodeType) => {
		switch (type) {
			case 'step':
				return {
					value: null,
					delta: 0,
					stepLabel: 'Step',
					droppedLabel: 'excluded',
					group: ''
				};
			case 'substep':
				return { delta: 0, label: 'Substep' };
			case 'start':
				return { label: 'Start population', value: 1000, group: '' };
			default:
				return {};
		}
	};

	const initialNodes: Node[] = [
		{
			id: '0',
			type: 'start',
			data: getNodeDataDefaults('start'),
			position: { x: 0, y: 0 },
			deletable: false
		}
	];

	const initialEdges: Edge[] = [];

	let nodes = $state.raw<Node[]>(initialNodes);
	let edges = $state.raw<Edge[]>(initialEdges);
</script>

<script lang="ts">
	import {
		SvelteFlow,
		useSvelteFlow,
		Background,
		Controls,
		ControlButton,
		Panel,
		type Node,
		type Edge,
		type OnConnectEnd,
		type NodeProps
	} from '@xyflow/svelte';

	import StartNode from '@/nodes/StartNode.svelte';
	import StepNode from '@/nodes/StepNode.svelte';
	import SubstepNode from '@/nodes/SubstepNode.svelte';

	import * as Card from '@/components/ui/card/index.js';
	import { buttonGroupVariants } from '@/components/ui/button-group/button-group.svelte';

	import LayoutIcon from '@lucide/svelte/icons/circle-pile';
	import ClearIcon from '@lucide/svelte/icons/trash';

	import { getLayoutedElements } from '.';

	import { dragAndDropNodeType } from './drag-and-drop-node.svelte';
	import DragPanel from './DragPanel.svelte';
	import type { Component } from 'svelte';

	const minZoom = 0.1;
	const maxZoom = 2.5;

	const { screenToFlowPosition, fitView } = useSvelteFlow();

	const handleConnectEnd: OnConnectEnd = (event, connectionState) => {
		if (connectionState.isValid) return;

		const sourceNodeId = connectionState.fromNode?.id ?? '0';
		const { clientX, clientY } = 'changedTouches' in event ? event.changedTouches[0] : event;

		const fromStartNode = connectionState.fromNode?.type === 'start';
		const fromStepNodeOutput =
			connectionState.fromNode?.type === 'step' && connectionState.fromHandle?.id === 'step-output';
		const fromStepNodeSubsteps =
			connectionState.fromNode?.type === 'step' &&
			connectionState.fromHandle?.id === 'step-substeps';

		if (fromStartNode || fromStepNodeOutput || fromStepNodeSubsteps) {
			const newNodeType = fromStepNodeSubsteps ? 'substep' : 'step';
			const newNodeOrigin: [number, number] = newNodeType == 'step' ? [0.5, 0.0] : [0.0, 0.5];
			const newNode = addNode(
				newNodeType,
				screenToFlowPosition({
					x: clientX,
					y: clientY
				}),
				newNodeOrigin
			);

			const sourceHandle = fromStartNode
				? 'start'
				: fromStepNodeOutput
					? 'step-output'
					: fromStepNodeSubsteps
						? 'step-substeps'
						: undefined;
			const targetHandle =
				fromStartNode || fromStepNodeOutput
					? 'step-input'
					: fromStepNodeSubsteps
						? 'substep'
						: undefined;

			edges = [
				...edges,
				{
					source: sourceNodeId,
					sourceHandle: sourceHandle,
					target: newNode.id,
					targetHandle: targetHandle,
					id: `${sourceNodeId}--${newNode.id}`
				}
			];
		}
	};

	const handleDragOver = (event: DragEvent) => {
		event.preventDefault();

		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
	};

	const handleDrop = (event: DragEvent) => {
		event.preventDefault();

		if (!dragAndDropNodeType.current) {
			return;
		}

		const position = screenToFlowPosition({
			x: event.clientX,
			y: event.clientY
		});

		addNode(dragAndDropNodeType.current, position, [0.5, 0.5]);
	};

	function layoutNodes() {
		const layouted = getLayoutedElements(nodes, edges);

		nodes = [...layouted.nodes];
		edges = [...layouted.edges];

		fitView();
	}

	function clearNodes() {
		nodes = [...nodes.filter((node) => node.deletable === false)];
		edges = [
			...edges.filter(
				(edge) =>
					nodes.findIndex((node) => node.id == edge.source) !== -1 &&
					nodes.findIndex((node) => node.id == edge.target) !== -1
			)
		];

		fitView();
	}
</script>

<SvelteFlow
	bind:nodes
	bind:edges
	{nodeTypes}
	fitView
	fitViewOptions={{
		minZoom: minZoom,
		maxZoom: maxZoom
	}}
	{minZoom}
	{maxZoom}
	onconnectend={handleConnectEnd}
	ondragover={handleDragOver}
	ondrop={handleDrop}
	snapGrid={[20, 20]}
	proOptions={{
		hideAttribution: true
	}}
>
	<Controls class={buttonGroupVariants({ orientation: 'vertical' })}>
		<ControlButton
			title="Layout flowchart"
			aria-label="Layout flowchart"
			onclick={() => layoutNodes()}><LayoutIcon class="fill-primary" /></ControlButton
		>
		<ControlButton title="Clear flowchart" aria-label="Clear flowchart" onclick={() => clearNodes()}
			><ClearIcon class="fill-primary" /></ControlButton
		>
	</Controls>
	<Background />
	<Panel position="top-right" class="hidden md:block w-76">
		<Card.Root class="text-xs">
			<Card.Header>
				<Card.Title class="text-2xl">Flowchart Generator</Card.Title>
				<Card.Description
					>Simply drag and drop from the node handles to generate your Flowchart!</Card.Description
				>
			</Card.Header>
		</Card.Root>
	</Panel>
	<Panel position="bottom-right"><DragPanel /></Panel>
</SvelteFlow>
