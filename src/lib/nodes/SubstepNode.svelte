<script lang="ts">
	import { useSvelteFlow, useNodeConnections, useNodesData, type NodeProps } from '@xyflow/svelte';

	import Label from '@/components/ui/label/label.svelte';
	import Input from '@/components/ui/input/input.svelte';

	import NodeWrapper from './NodeWrapper.svelte';

	import { substepTarget } from './types';

	const { id, data, type }: NodeProps = $props();

	const { updateNodeData } = useSvelteFlow();

	const connectionsTarget = useNodeConnections({
		handleId: substepTarget.handleId,
		handleType: substepTarget.handleType
	});

	const targetData = $derived(
		useNodesData(connectionsTarget.current.map((connection) => connection.source))
	);

	const noConnection = $derived<boolean>(targetData.current.length === 0);

	$effect(function () {
		if (noConnection) {
			if (data.row !== null) {
				updateNodeData(id, { row: null });
			}
			return;
		}

		// There should only be one connection anyway
		const connection = targetData.current[0];

		const row = ('row' in connection.data ? connection.data?.row : null) as number | null;

		// IMPORTANT: Removing this will cause an infinite loop.
		if (row === null) {
			if (data.row !== null) {
				updateNodeData(id, { row: null });
			}
		} else if (data.row !== row) {
			updateNodeData(id, { row: row });
		}
	});
</script>

<NodeWrapper title="Substep" description="Inclusion or Exclusion" nodeId={id} nodeType={type}>
	{#snippet content()}
		<div class="flex flex-col gap-2">
			<Label for="label">Label</Label>
			<Input
				name="label"
				value={data.label}
				type="text"
				oninput={(evt) => {
					const raw = (evt.target as HTMLInputElement | null)?.value ?? '';
					updateNodeData(id, { label: raw });
				}}
				class="nodrag"
			/>

			<Label for="delta">Dropped</Label>
			<Input
				name="delta"
				value={data.delta}
				type="number"
				oninput={(evt) => {
					const raw = (evt.target as HTMLInputElement | null)?.value ?? '';
					const parsedDelta = Number.isFinite(Number(raw)) && raw !== '' ? parseInt(raw, 10) : 0;
					updateNodeData(id, { delta: parsedDelta });
				}}
				class="nodrag"
			/>
		</div>
	{/snippet}
</NodeWrapper>
