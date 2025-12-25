<script lang="ts">
	import {
		Position,
		useSvelteFlow,
		useNodeConnections,
		useNodesData,
		type NodeProps,
		type IsValidConnection
	} from '@xyflow/svelte';

	import Label from '@/components/ui/label/label.svelte';
	import Input from '@/components/ui/input/input.svelte';

	import WideHandle from '@/handles/WideHandle.svelte';
	import NodeWrapper from './NodeWrapper.svelte';

	const { id, data }: NodeProps = $props();

	const { updateNodeData } = useSvelteFlow();

	const connectionsTarget = useNodeConnections({
		handleType: 'target'
	});

	const isConnectable = $derived<boolean>(connectionsTarget.current.length === 0);

	const isValidConnection: IsValidConnection = (edge) => edge.sourceHandle === 'step-substeps';

	const targetData = $derived(
		useNodesData(connectionsTarget.current.map((connection) => connection.source))
	);

	// const noConnection = $derived<boolean>(targetData.current.length === 0);

	// $effect(function () {
	// 	if (noConnection) {
	// 		if (data.value !== null) {
	// 			updateNodeData(id, { value: null });
	// 		}
	// 		return;
	// 	}

	// 	// There should only be one connection anyway
	// 	const connection = targetData.current[0];
	// 	const value = connection.data?.value as number;
	// 	const newValue = value - (data.delta as number);

	// 	// IMPORTANT: Removing this will cause an infinite loop.
	// 	if (newValue && data.value != newValue) {
	// 		updateNodeData(id, { value: newValue });
	// 	}
	// });
</script>

<NodeWrapper title="Substep" description="Inclusion or Exclusion">
	{#snippet content()}
		<div class="flex flex-col gap-2">
			<!-- Left Section -->
			<WideHandle
				id="substep"
				type="target"
				position={Position.Left}
				{isConnectable}
				{isValidConnection}
			/>

			<!-- Main Section -->
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
					const parsedDelta = Number.isFinite(Number(raw)) ? parseInt(raw, 10) : 0;
					updateNodeData(id, { delta: parsedDelta });
				}}
				class="nodrag"
			/>
		</div>
	{/snippet}
</NodeWrapper>
