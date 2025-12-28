<script module>
	let id = 1;
	export const getId = () => `${id++}`;
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
		type OnConnectEnd
	} from '@xyflow/svelte';

	import StartNode from '@/nodes/StartNode.svelte';
	import StepNode from '@/nodes/StepNode.svelte';
	import SubstepNode from '@/nodes/SubstepNode.svelte';

	import * as Card from '@/components/ui/card/index.js';
	import { buttonGroupVariants } from '@/components/ui/button-group/button-group.svelte';

	import NetworkIcon from '@lucide/svelte/icons/workflow';

	import '@xyflow/svelte/dist/base.css';
	import { getLayoutedElements } from '.';

	const minZoom = 0.1;
	const maxZoom = 2.5;

	const nodeTypes = {
		start: StartNode,
		step: StepNode,
		substep: SubstepNode
	};

	const initialNodes: Node[] = [
		{
			id: '0',
			type: 'start',
			data: { label: 'Start population', value: 1000, group: '' },
			position: { x: 0, y: 0 },
			deletable: false
		}
	];

	const initialEdges: Edge[] = [];

	let nodes = $state.raw<Node[]>(initialNodes);
	let edges = $state.raw<Edge[]>(initialEdges);

	const { screenToFlowPosition, fitView } = useSvelteFlow();

	const handleConnectEnd: OnConnectEnd = (event, connectionState) => {
		if (connectionState.isValid) return;

		const sourceNodeId = connectionState.fromNode?.id ?? '0';
		const id = getId();
		const { clientX, clientY } = 'changedTouches' in event ? event.changedTouches[0] : event;

		const fromStartNode = connectionState.fromNode?.type === 'start';
		const fromStepNodeOutput =
			connectionState.fromNode?.type === 'step' && connectionState.fromHandle?.id === 'step-output';
		const fromStepNodeSubsteps =
			connectionState.fromNode?.type === 'step' &&
			connectionState.fromHandle?.id === 'step-substeps';

		if (fromStartNode || fromStepNodeOutput || fromStepNodeSubsteps) {
			let newNode: Node;

			if (fromStepNodeSubsteps) {
				newNode = {
					id,
					type: 'substep',
					data: { delta: 0, label: `Substep ${id}` },
					// project the screen coordinates to pane coordinates
					position: screenToFlowPosition({
						x: clientX,
						y: clientY
					}),
					// set the origin of the new node so it is centered
					origin: [0.0, 0.5]
				};
			} else {
				newNode = {
					id,
					type: 'step',
					data: {
						value: null,
						delta: 0,
						stepLabel: `Step ${id}`,
						droppedLabel: 'excluded',
						group: ''
					},
					// project the screen coordinates to pane coordinates
					position: screenToFlowPosition({
						x: clientX,
						y: clientY
					}),
					// set the origin of the new node so it is centered
					origin: [0.5, 0.0]
				};
			}

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

			nodes = [...nodes, newNode];
			edges = [
				...edges,
				{
					source: sourceNodeId,
					sourceHandle: sourceHandle,
					target: id,
					targetHandle: targetHandle,
					id: `${sourceNodeId}--${id}`
				}
			];
		}
	};

	function onLayout() {
		const layouted = getLayoutedElements(nodes, edges);

		nodes = [...layouted.nodes];
		edges = [...layouted.edges];

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
	snapGrid={[20, 20]}
	proOptions={{
		hideAttribution: true
	}}
>
	<Controls class={buttonGroupVariants({ orientation: 'vertical' })}>
		<ControlButton onclick={() => onLayout()}><NetworkIcon class="fill-primary" /></ControlButton>
	</Controls>
	<Background />
	<Panel position="bottom-right" class="hidden md:block w-76">
		<Card.Root class="text-xs">
			<Card.Header>
				<Card.Title class="text-2xl">Flowchart Generator</Card.Title>
				<Card.Description
					>Simply drag and drop from the node handles to generate your Flowchart!</Card.Description
				>
			</Card.Header>
		</Card.Root>
	</Panel>
</SvelteFlow>
