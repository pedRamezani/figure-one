<script lang="ts">
	import { useSvelteFlow, type NodeProps } from '@xyflow/svelte';

	import Input from '@/components/ui/input/input.svelte';
	import Label from '@/components/ui/label/label.svelte';
	import * as NumberField from '$lib/components/ui/number-field';

	import NodeWrapper from './NodeWrapper.svelte';

	// A breakdown of where a population box's population came from, such as one
	// database in a systematic review's search. Distinct from a substep, which
	// itemises what an exclusion removed, hence `value` rather than `delta`.

	const { id, data, type }: NodeProps = $props();
	const { updateNodeData } = useSvelteFlow();

	const labelBinding = {
		get value() {
			return data.label as string;
		},
		set value(next: string) {
			updateNodeData(id, { label: next });
		}
	};

	const valueBinding = {
		get value() {
			return (data.value as number | null) ?? 0;
		},
		set value(next: number | undefined) {
			updateNodeData(id, { value: next ?? 0 });
		}
	};
</script>

<NodeWrapper
	title="Sub-population"
	description="Part of the population above."
	nodeId={id}
	nodeType={type}
>
	{#snippet content()}
		<div class="flex flex-col gap-2">
			<Label for="label">Label</Label>
			<Input name="label" bind:value={labelBinding.value} type="text" class="nodrag" />

			<Label for="value">Population size</Label>
			<NumberField.Root min={0} bind:value={valueBinding.value}>
				<NumberField.Group class="nodrag bg-background dark:bg-input/30 border dark:border-input">
					<NumberField.Decrement />
					<NumberField.Input class="w-[10ch]" name="value" />
					<NumberField.Increment />
				</NumberField.Group>
			</NumberField.Root>
		</div>
	{/snippet}
</NodeWrapper>
