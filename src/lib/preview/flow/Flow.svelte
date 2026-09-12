<script lang="ts">
	import {
		SvelteFlow,
		useSvelteFlow,
		Background,
		BackgroundVariant,
		Controls,
		ControlButton,
		Panel,
		type OnConnectEnd,
		Position
	} from '@xyflow/svelte';

	import { type RegisteredNodeType, nodeTypes } from '@/nodes/types';

	import * as ButtonGroup from '@/components/ui/button-group/index.js';
	import { buttonGroupVariants } from '@/components/ui/button-group/button-group.svelte';
	import { ConfirmDeleteDialog, confirmDelete } from '$lib/components/ui/confirm-delete-dialog';
	import { ThemeSelector } from '@/components/ui/theme-selector';

	import InfoButton from './InfoButton.svelte';

	import LayoutIcon from '@lucide/svelte/icons/circle-pile';
	import ClearIcon from '@lucide/svelte/icons/trash';

	import { getLayoutedElements } from './layout.ts';

	import { dragAndDropNodeType } from './drag-and-drop-node.svelte';
	import DragPanel from './DragPanel.svelte';

	import { handleDragCreate, nodeHandles } from '@/nodes/types';

	import { flowchartDocument } from '@/document/store.svelte';
	import { reconcileRowContainers } from '@/nodes/rows';

	import { onMount } from 'svelte';

	const minZoom = 0.1;
	const maxZoom = 2.5;

	const { screenToFlowPosition, fitView } = useSvelteFlow();

	// DocumentSync loads the stored document in its own onMount, which runs
	// first because it is rendered earlier in the page. Fit to whatever it
	// restored rather than to the empty canvas xyflow started with.
	onMount(() => {
		fitView();
	});

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

		const toNode = flowchartDocument.addNode(
			toNodeType,
			screenToFlowPosition({
				x: clientX,
				y: clientY
			}),
			toNodeOrigin
		);
		const toNodeId = toNode.id;

		flowchartDocument.addEdge(
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

		const nodeType = dragAndDropNodeType.current;

		// Consume it either way. Leaving it set meant any later drop on the
		// canvas, added another node of whatever type was last dragged from
		// the panel.
		dragAndDropNodeType.current = null;

		if (!nodeType) return;
		if (!flowchartDocument.canAddNode(nodeType)) return;

		const position = screenToFlowPosition({
			x: event.clientX,
			y: event.clientY
		});

		flowchartDocument.addNode(nodeType, position, [0.5, 0.5]);
	};

	function layoutNodes() {
		const layouted = getLayoutedElements(flowchartDocument.nodes, flowchartDocument.edges);

		flowchartDocument.nodes = [...layouted.nodes];
		flowchartDocument.edges = [...layouted.edges];

		fitView();
	}

	async function clearNodes() {
		flowchartDocument.reset();
		fitView();
	}

	// A document that arrived without positions, from a legacy file or a data
	// export, has every node at the origin and has to be laid out once.
	$effect(() => {
		if (!flowchartDocument.needsLayout) return;

		flowchartDocument.needsLayout = false;

		// After the next tick, so xyflow has measured the new nodes.
		setTimeout(() => {
			layoutNodes();
		}, 0);
	});

	// Row containers are entirely derived: they exist because nodes have rows,
	// and they are sized by their children. This keeps them matching the derived
	// rows in one idempotent pass, so the canvas is never seen half reconciled.
	$effect(() => {
		const reconciled = reconcileRowContainers(
			flowchartDocument.nodes,
			flowchartDocument.rows,
			flowchartDocument.allocateId
		);

		// Null means nothing needed changing, which is how this settles.
		if (reconciled) {
			flowchartDocument.nodes = reconciled;
		}
	});
</script>

<ConfirmDeleteDialog />

<SvelteFlow
	bind:nodes={flowchartDocument.nodes}
	bind:edges={flowchartDocument.edges}
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
		<ControlButton
			title="Clear flowchart"
			aria-label="Clear flowchart"
			onclick={(e: MouseEvent) => {
				confirmDelete({
					title: 'Delete',
					description: 'Are you sure you want to delete all nodes?',
					skipConfirmation: e.shiftKey,
					onConfirm: clearNodes
				});
			}}><ClearIcon class="fill-primary" /></ControlButton
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
