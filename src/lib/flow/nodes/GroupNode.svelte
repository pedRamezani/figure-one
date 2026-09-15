<script lang="ts">
	import { useSvelteFlow, useNodeConnections, useNodesData, type NodeProps } from '@xyflow/svelte';

	import Label from '@/components/ui/label/label.svelte';
	import { Textarea } from '@/components/ui/textarea/index.js';

	import NodeWrapper from './NodeWrapper.svelte';

	import { flowchartDocument } from '@/document/store.svelte';

	import { groupSource } from '../handles/handle-types.ts';

	// --- SETUP ---
	const { id, data, type }: NodeProps = $props();
	const { updateNodeData, deleteElements } = useSvelteFlow();

	// --- BINDING OBJECTS ---
	const groupBinding = {
		get value() {
			return data.group as string;
		},
		set value(next: string) {
			updateNodeData(id, { group: next });
		}
	};

	// --- DISCONNECT LOGIC ---
	const connectionsSource = useNodeConnections({
		handleId: groupSource.handleId,
		handleType: groupSource.handleType
	});

	const sourceIds = $derived(connectionsSource.current.map((connection) => connection.edgeId));
	const sourceData = $derived(
		useNodesData(connectionsSource.current.map((connection) => connection.target))
	);

	const noConnection = $derived<boolean>(sourceData.current.length === 0);

	// Disconnect effect: Delete outgoing edges connected to node with row !== null → node has row node parent
	$effect(function () {
		if (noConnection) {
			return;
		}

		// There should only be one connection
		const connection = sourceData.current[0];

		// A node inside a split row is grouped through its row container, not
		// directly, so a direct group edge to one is dropped.
		if (flowchartDocument.rowOf(connection.id) === null) {
			return;
		}

		const edgeId = sourceIds[0];
		deleteElements({ edges: [{ id: edgeId }] });
	});
</script>

<NodeWrapper title="Group" description="Names a band of stages." nodeId={id} nodeType={type}>
	{#snippet content()}
		<div class="flex flex-col gap-2">
			<Label for="group">Label</Label>
			<Textarea
				name="group"
				bind:value={groupBinding.value}
				rows={1}
				class="nodrag min-h-9 w-[24ch] resize-none"
			/>
		</div>
	{/snippet}
</NodeWrapper>
