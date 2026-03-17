<script lang="ts">
	import { useSvelteFlow, type NodeProps } from '@xyflow/svelte';

	import Input from '@/components/ui/input/input.svelte';
	import Label from '@/components/ui/label/label.svelte';
	import * as NumberField from '$lib/components/ui/number-field';

	import NodeWrapper from './NodeWrapper.svelte';

	const { id, data, type }: NodeProps = $props();

	const { updateNodeData } = useSvelteFlow();

	// Population size effect
	let populationSize = $state(data.value as number);
	$effect(() => {
		// populationSize is actually number | null
		// null if no value → Number.isFinite(null) == false → parsedValue = 0
		const parsedValue = Number.isFinite(populationSize) ? populationSize : 0;
		if (data.value !== parsedValue) {
			updateNodeData(id, { value: parsedValue });
		}
	});
</script>

<NodeWrapper
	title="CONSORT Start"
	description="The flowchart will start from here."
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
			<Label for="start">Population size</Label>
			<NumberField.Root min={0} bind:value={populationSize}>
				<NumberField.Group class="nodrag bg-background dark:bg-input/30 border dark:border-input">
					<NumberField.Decrement />
					<NumberField.Input class="w-[10ch]" name="start" />
					<NumberField.Increment />
				</NumberField.Group>
			</NumberField.Root>
		</div>
	{/snippet}
</NodeWrapper>
