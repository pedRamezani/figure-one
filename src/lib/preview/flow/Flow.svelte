<script module>
	let id = 1;
	export const getId: () => string = () => `${id++}`;

	export function addNode(
		nodeType: RegisteredNodeType,
		position: {
			x: number;
			y: number;
		} = { x: 0, y: 0 },
		origin: [number, number] = [0.5, 0.5],
		data: Record<string, unknown> = {},
		parentId?: string,
		isParent: boolean = false
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
			origin: origin,
			parentId: parentId
		} satisfies Node;

		// Child nodes have to always come after parent nodes
		if (isParent) {
			nodes = [newNode, ...nodes];
		} else {
			nodes = [...nodes, newNode];
		}

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
	] as const;

	const initialEdges: Edge[] = [] as const;

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
		Position,
		isNode,
		isEdge
	} from '@xyflow/svelte';

	import { type RegisteredNodeType, nodeTypes, getNodeDataDefaults } from '@/nodes/types';

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

	import { onMount } from 'svelte';

	const minZoom = 0.1;
	const maxZoom = 2.5;

	const { screenToFlowPosition, fitView, updateNode, getNode } = useSvelteFlow();

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

	async function clearNodes() {
		nodes = initialNodes;
		edges = initialEdges;
		fitView();
	}

	const rowNodes = $derived(
		nodes
			.filter((n) => 'row' in n.data)
			.reduce(
				(acc, node) => {
					const row = node.data?.row as number | null;
					if (!acc[row ?? -1]) {
						acc[row ?? -1] = [];
					}
					acc[row ?? -1].push(node);
					return acc;
				},
				{} as { [key: number]: Node[] }
			)
	);

	// Delete empty row effect
	$effect(() => {
		Object.entries(rowNodes).forEach(([row, nodes]) => {
			if (Number(row) === -1) {
				// Number(row) === -1 => row === null => no row node parent => remove parents
				const nodesWithParent = nodes.filter((n) => n.parentId !== undefined);
				nodesWithParent.forEach((node) => {
					const parentNode = getNode(node.parentId as string);
					updateNode(node.id, {
						parentId: undefined,
						position: {
							x: (parentNode?.position.x ?? 0) + node.position.x,
							y: (parentNode?.position.y ?? 0) + node.position.y
						}
					});
				});
			} else {
				// Number(row)  !== -1 => row !== null => node has row parent => add parent
				const nodesWithoutParent = nodes.filter((n) => n.parentId === undefined);
				if (nodesWithoutParent) {
					const nodeWithParentId = nodes.find((n) => n.parentId !== undefined)?.parentId;
					let existingParent =
						nodeWithParentId === undefined ? undefined : getNode(nodeWithParentId as string);
					nodesWithoutParent.forEach((node) => {
						const parentNode =
							existingParent ??
							addNode(
								'row',
								{ x: node.position.x - 20, y: node.position.y - 20 },
								[0, 0],
								{},
								undefined,
								true
							);

						// Needed for updating multiple nodes at once
						if (existingParent === undefined) {
							existingParent = parentNode;
						}

						updateNode(node.id, {
							parentId: parentNode.id,
							position: {
								x: node.position.x - parentNode.position.x,
								y: node.position.y - parentNode.position.y
							}
						});
					});
				}
			}
		});
	});

	// Local storage
	function isNodeList(nodes: unknown): nodes is Node[] {
		if (!Array.isArray(nodes)) {
			return false;
		}

		return nodes.every(isNode);
	}

	function isEdgeList(edges: unknown): edges is Edge[] {
		if (!Array.isArray(edges)) {
			return false;
		}

		return edges.every(isEdge);
	}

	function getStorageTimestamp(): number {
		const timestamp = localStorage.getItem('storage-timestamp');
		return timestamp ? parseInt(timestamp) : -1;
	}

	// Local storage timestamp used for detecting changes in other tabs
	let localTimestamp = -1; // Set to Date.now() when local storage is updated

	function updateStorageTimestamp() {
		const timestamp = Date.now();
		localTimestamp = timestamp;
		localStorage.setItem('storage-timestamp', timestamp.toString());
	}

	function getStorageNodes(): Node[] | null {
		const localStoreNodes = localStorage.getItem('nodes');
		if (localStoreNodes) {
			const nodes = JSON.parse(localStoreNodes);
			if (isNodeList(nodes)) {
				return nodes;
			}
		}

		return null;
	}

	function getStorageEdges(): Edge[] | null {
		const localStoreEdges = localStorage.getItem('edges');
		if (localStoreEdges) {
			const edges = JSON.parse(localStoreEdges);
			if (isEdgeList(edges)) {
				return edges;
			}
		}

		return null;
	}

	function adjustCurrentIdToNodesAndEdges(): void {
		const highestNodeId = Math.max(
			...nodes.map((n) => {
				const parsed = Number(n.id);
				return isNaN(parsed) ? 0 : parsed;
			})
		);
		const highestEdgeId = Math.max(
			...edges.map((e) => {
				const [source, target] = e.id.split('--');
				const sourceId = Number(source);
				const targetId = Number(target);
				return Math.max(isNaN(sourceId) ? 0 : sourceId, isNaN(targetId) ? 0 : targetId);
			})
		);
		id = Math.max(highestNodeId, highestEdgeId) + 1;
	}

	function syncWithLocalStorage(): void {
		const storageTimestamp = getStorageTimestamp();
		if (storageTimestamp > localTimestamp) {
			const storageNodes = getStorageNodes();
			const storageEdges = getStorageEdges();
			if (storageNodes) {
				nodes = storageNodes;
			}
			if (storageEdges) {
				edges = storageEdges;
			}
			if (storageNodes || storageEdges) {
				adjustCurrentIdToNodesAndEdges();
			}
		}
	}

	// Localstorage read effect
	onMount(() => {
		syncWithLocalStorage();
		fitView();
	});

	function debounce(func: Function, delay: number) {
		let timeoutId: NodeJS.Timeout;

		return function (...args: any[]) {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => func(...args), delay);
		};
	}

	// Nodes localstorage save effect (debounced)
	const saveNode = (n: Node[]) => {
		const stringifiedNodes = JSON.stringify(n);
		if (localStorage.getItem('nodes') === stringifiedNodes) {
			return;
		}
		// console.log('Saving nodes to local storage...');
		localStorage.setItem('nodes', stringifiedNodes);
		updateStorageTimestamp();
	};
	const debouncedSaveNode = debounce(saveNode, 200);
	$effect(() => {
		debouncedSaveNode(nodes);
	});

	// Edges localstorage save effect (debounced)
	const saveEdge = (e: Edge[]) => {
		const stringifiedEdges = JSON.stringify(e);
		if (localStorage.getItem('edges') === stringifiedEdges) {
			return;
		}
		// console.log('Saving edges to local storage...');
		localStorage.setItem('edges', stringifiedEdges);
		updateStorageTimestamp();
	};
	const debouncedSaveEdge = debounce(saveEdge, 200);
	$effect(() => {
		debouncedSaveEdge(edges);
	});

	// Forced localstorage save effect on window unload or blur
	function saveNodesAndEdges() {
		saveNode(nodes);
		saveEdge(edges);
	}

	function onblur(event: FocusEvent) {
		if (event.type === 'blur') {
			saveNodesAndEdges();
		}

		if (event.type === 'focus' || event.type === 'visibilitychange') {
			syncWithLocalStorage();
		}
	}

	function onstorage(event: StorageEvent) {
		if (event.key === 'nodes') {
			const parsed = JSON.parse(event.newValue ?? 'null');
			if (isNodeList(parsed) && getStorageTimestamp() > localTimestamp) {
				nodes = parsed;
				adjustCurrentIdToNodesAndEdges();
			}
		} else if (event.key === 'edges') {
			const parsed = JSON.parse(event.newValue ?? 'null');
			if (isEdgeList(parsed) && getStorageTimestamp() > localTimestamp) {
				edges = parsed;
				adjustCurrentIdToNodesAndEdges();
			}
		}
	}
</script>

<svelte:window {onstorage} onunload={saveNodesAndEdges} {onblur} />

<ConfirmDeleteDialog />

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
