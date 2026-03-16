<script lang="ts">
	import { useSvelteFlow, useNodeConnections, type NodeProps } from '@xyflow/svelte';

	import Label from '@/components/ui/label/label.svelte';
	import Input from '@/components/ui/input/input.svelte';

	import NodeWrapper from './NodeWrapper.svelte';

	import { splitstartTargetInput } from './types';

	const { id, data, type }: NodeProps = $props();

	const { updateNodeData } = useSvelteFlow();

	const connectionsTargetInput = useNodeConnections({
		handleId: splitstartTargetInput.handleId,
		handleType: splitstartTargetInput.handleType
	});

	const noConnection = $derived<boolean>(connectionsTargetInput.current.length === 0);

	$effect(function () {
		if (noConnection) {
			if (data.row !== null) {
				updateNodeData(id, { row: null });
			}
			return;
		}

		// IMPORTANT: Removing this will cause an infinite loop.
		if (data.row !== 0) {
			updateNodeData(id, { row: 0 });
		}
	});
</script>

<NodeWrapper
	title="Split Start"
	description="The split will start from here."
	nodeId={id}
	nodeType={type}
>
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

			<!-- Main Section -->
			<Label for="start">Split population size</Label>
			<Input
				name="start"
				value={data.value}
				type="number"
				oninput={(evt) => {
					const raw = (evt.target as HTMLInputElement | null)?.value ?? '';
					const parsedValue = Number.isFinite(Number(raw)) && raw !== '' ? parseInt(raw, 10) : 0;
					updateNodeData(id, { value: parsedValue });
				}}
				class="nodrag"
			/>
		</div>
	{/snippet}
</NodeWrapper>
