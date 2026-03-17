<script lang="ts">
	import { useSvelteFlow, useNodeConnections, useNodesData, type NodeProps } from '@xyflow/svelte';

	import Label from '@/components/ui/label/label.svelte';
	import Input from '@/components/ui/input/input.svelte';

	import NodeWrapper from './NodeWrapper.svelte';

	import { groupSource } from './types';

	const { id, data, type }: NodeProps = $props();

	const { updateNodeData, deleteElements } = useSvelteFlow();

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

		// There should only be one connection anyway
		const connection = sourceData.current[0];
		if (!('row' in connection.data)) {
			return;
		}

		const row = connection.data?.row as number | null;
		if (row === null) {
			return;
		}

		const edgeId = sourceIds[0];
		deleteElements({ edges: [{ id: edgeId }] });
	});
</script>

<NodeWrapper title="Group" description="The group name of a node." nodeId={id} nodeType={type}>
	{#snippet content()}
		<div class="flex flex-col gap-2">
			<Label for="group">Label</Label>
			<Input
				name="group"
				value={data.group}
				type="text"
				oninput={(evt) => {
					const raw = (evt.target as HTMLInputElement | null)?.value ?? '';
					updateNodeData(id, { group: raw });
				}}
				class="nodrag"
			/>
		</div>
	{/snippet}
</NodeWrapper>
