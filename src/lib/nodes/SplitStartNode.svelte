<script lang="ts">
	import { useSvelteFlow, type NodeProps } from '@xyflow/svelte';

	import Label from '@/components/ui/label/label.svelte';
	import Input from '@/components/ui/input/input.svelte';

	import NodeWrapper from './NodeWrapper.svelte';

	const { id, data }: NodeProps = $props();

	const { updateNodeData } = useSvelteFlow();
</script>

<NodeWrapper
	title="Split Start"
	description="The split will start from here."
	nodeId={id}
	nodeType="splitstart"
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
					const parsedValue = Number.isFinite(Number(raw)) ? parseInt(raw, 10) : 0;
					updateNodeData(id, { value: parsedValue });
				}}
				class="nodrag"
			/>
		</div>
	{/snippet}
</NodeWrapper>
