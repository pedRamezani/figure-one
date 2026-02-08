<script module>
	let id = 1;
	const getId = () => `${id++}`;

	export function addNode(
		nodeType: RegisteredNodeType,
		position: {
			x: number;
			y: number;
		},
		origin: [number, number] = [0.5, 0.5],
		data: Record<string, unknown> = {}
	): Node {
		const id = getId();

		const newNode = {
			id: id,
			type: nodeType,
			position,
			data: {
				...getNodeDataDefaults(nodeType),
				...data
			},
			origin: origin
		} satisfies Node;

		nodes = [...nodes, newNode];

		return newNode;
	}

	export function addEdge(
		source: string,
		target: string,
		sourceHandle?: string,
		targetHandle?: string
	): Edge {
		const newEdge = {
			source,
			sourceHandle,
			target,
			targetHandle,
			id: `${source}--${target}`
		} satisfies Edge;

		edges = [...edges, newEdge];

		return newEdge;
	}

	export function setNodes(value: Node[]): void {
		nodes = value;
	}

	export function setEdges(value: Edge[]): void {
		edges = value;
	}

	export function layoutView(): void {
		const layouted = getLayoutedElements(nodes, edges);
		nodes = layouted.nodes;
		edges = layouted.edges;
	}

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
		BackgroundVariant,
		Controls,
		ControlButton,
		Panel,
		type Node,
		type Edge,
		type OnConnectEnd,
		Position
	} from '@xyflow/svelte';

	import { type RegisteredNodeType, nodeTypes, getNodeDataDefaults } from '@/nodes/types';

	import * as ButtonGroup from '@/components/ui/button-group/index.js';
	import { buttonGroupVariants } from '@/components/ui/button-group/button-group.svelte';
	import { ThemeSelector } from '@/components/ui/theme-selector';

	import InfoButton from './InfoButton.svelte';

	import LayoutIcon from '@lucide/svelte/icons/circle-pile';
	import ClearIcon from '@lucide/svelte/icons/trash';

	import { getLayoutedElements } from './layout.ts';

	import { dragAndDropNodeType } from './drag-and-drop-node.svelte';
	import DragPanel from './DragPanel.svelte';

	import { handleDragCreate, nodeHandles } from '@/nodes/types';

	const minZoom = 0.1;
	const maxZoom = 2.5;

	const { screenToFlowPosition, fitView } = useSvelteFlow();

	const handleConnectEnd: OnConnectEnd = (event, connectionState) => {
		if (connectionState.isValid) return;

		if (!connectionState.fromNode) return;

		if (!connectionState.fromNode.type) return;

		const fromHandle = nodeHandles[connectionState.fromNode.type as RegisteredNodeType].find(
			(h) =>
				h.handleId === connectionState.fromHandle?.id &&
				h.handleType === connectionState.fromHandle?.type
		);
		if (!fromHandle) return;

		const toHandle = handleDragCreate.get(fromHandle);
		if (toHandle === undefined) return;
		const toHandleId = toHandle.handleId;
		const toNodeType = toHandle.nodeType;
		const toNodeOrigin: [number, number] =
			toHandle.position === Position.Top
				? [0.5, 0]
				: toHandle.position === Position.Bottom
					? [0.5, 1]
					: toHandle.position === Position.Left
						? [0, 0.5]
						: [1, 0.5];

		const fromNodeId = connectionState.fromNode.id;
		const fromHandleId = fromHandle.handleId;

		const { clientX, clientY } = 'changedTouches' in event ? event.changedTouches[0] : event;

		const toNode = addNode(
			toNodeType,
			screenToFlowPosition({
				x: clientX,
				y: clientY
			}),
			toNodeOrigin
		);
		const toNodeId = toNode.id;

		addEdge(
			fromHandle.handleType == 'source' ? fromNodeId : toNodeId,
			fromHandle.handleType == 'source' ? toNodeId : fromNodeId,
			fromHandle.handleType == 'source' ? fromHandleId : toHandleId,
			fromHandle.handleType == 'source' ? toHandleId : fromHandleId
		);
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
	<Controls class={buttonGroupVariants({ orientation: 'vertical', class: 'bg-card/90' })}>
		<ControlButton title="Layout flowchart" aria-label="Layout flowchart" onclick={layoutNodes}
			><LayoutIcon class="fill-primary" /></ControlButton
		>
		<ControlButton title="Clear flowchart" aria-label="Clear flowchart" onclick={clearNodes}
			><ClearIcon class="fill-primary" /></ControlButton
		>
	</Controls>
	<Background variant={BackgroundVariant.Dots} size={1.2} />
	<Panel position="top-right" class="bg-card/90">
		<ButtonGroup.Root>
			<ThemeSelector />
			<InfoButton />
		</ButtonGroup.Root>
	</Panel>
	<Panel position="bottom-right"><DragPanel /></Panel>
</SvelteFlow>
