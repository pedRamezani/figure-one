<script lang="ts">
	import { useSvelteFlow, type NodeProps } from '@xyflow/svelte';

	import Label from '@/components/ui/label/label.svelte';
	import { Textarea } from '@/components/ui/textarea/index.js';
	import * as NumberField from '$lib/components/ui/number-field';

	import NodeWrapper from './NodeWrapper.svelte';

	// --- SETUP ---
	const { id, data, type }: NodeProps = $props();
	const { updateNodeData } = useSvelteFlow();

	// --- BINDING OBJECTS ---
	const labelBinding = {
		get value() {
			return data.label as string;
		},
		set value(next: string) {
			updateNodeData(id, { label: next });
		}
	};

	const splitPopulationBinding = {
		get value() {
			return (data.value as number | null) ?? 0;
		},
		set value(next: number | undefined) {
			updateNodeData(id, { value: next ?? 0 });
		}
	};
</script>

<NodeWrapper
	title="Split Start"
	description="The first box of one arm."
	nodeId={id}
	nodeType={type}
>
	{#snippet content()}
		<div class="flex flex-col gap-2">
			<Label for="label">Label</Label>
			<Textarea
				name="label"
				bind:value={labelBinding.value}
				rows={1}
				class="nodrag min-h-9 w-[24ch] resize-none"
			/>

			<!-- Main Section -->
			<Label for="start">Split population size</Label>
			<NumberField.Root min={0} bind:value={splitPopulationBinding.value}>
				<NumberField.Group class="nodrag bg-background dark:bg-input/30 border dark:border-input">
					<NumberField.Decrement />
					<NumberField.Input class="w-[10ch]" name="start" />
					<NumberField.Increment />
				</NumberField.Group>
			</NumberField.Root>
		</div>
	{/snippet}
</NodeWrapper>
