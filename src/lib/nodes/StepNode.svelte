<script lang="ts">
	import { useSvelteFlow, useNodeConnections, useNodesData, type NodeProps } from '@xyflow/svelte';

	import * as Collapsible from '@/components/ui/collapsible/index.js';
	import Input from '@/components/ui/input/input.svelte';
	import Label from '@/components/ui/label/label.svelte';
	import * as NumberField from '$lib/components/ui/number-field';

	import NodeWrapper from './NodeWrapper.svelte';

	import { stepTargetInput, stepTargetGroup } from './types.ts';

	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import { buttonVariants } from '@/components/ui/button/index.js';

	import { slide } from 'svelte/transition';

	const { id, data, type }: NodeProps = $props();

	const { updateNodeData } = useSvelteFlow();

	const connectionsTargetInput = useNodeConnections({
		handleId: stepTargetInput.handleId,
		handleType: stepTargetInput.handleType
	});

	const targetData = $derived(
		useNodesData(connectionsTargetInput.current.map((connection) => connection.source))
	);

	const noConnection = $derived<boolean>(targetData.current.length === 0);

	// Delta effect
	let delta = $state(data.delta as number);
	$effect(() => {
		// delta is actually number | null
		// null if no value → Number.isFinite(null) == false → parsedDelta = 0
		const parsedDelta = Number.isFinite(delta) ? delta : 0;
		if (data.delta !== parsedDelta) {
			const prev = noConnection
				? NaN
				: ((targetData.current[0].data.value as number | null) ?? NaN);

			const newAfter = isNaN(prev) ? null : prev - parsedDelta;
			updateNodeData(id, { delta: parsedDelta, value: newAfter });
			after = newAfter;
		}
	});

	// After effect
	let after = $state(data.value as number | null);
	$effect(() => {
		// parsedAfter is actually number | null
		// null if no value → Number.isFinite(null) == false → parsedAfter = NaN
		const parsedAfter = Number.isFinite(after) && after !== null ? after : NaN;
		if (!isNaN(parsedAfter) && data.value !== parsedAfter) {
			const prev = noConnection
				? NaN
				: ((targetData.current[0]?.data?.value as number | null) ?? NaN);

			// isNaN(prev) should be impossible => noConnection will hide the input
			const newDelta = isNaN(prev) ? 0 : prev - parsedAfter;
			updateNodeData(id, { value: parsedAfter, delta: newDelta });
			delta = newDelta;
		}
	});

	// Value coupling effect
	$effect(function () {
		if (noConnection) {
			if (after !== null) {
				after = null;
				updateNodeData(id, { value: null });
			}
			return;
		}

		// There should only be one connection anyway
		const connection = targetData.current[0];

		const value = connection.data.value as number | null;
		const newAfter = value === null ? null : value - (data.delta as number);

		// IMPORTANT: Removing this will cause an infinite loop.
		if (newAfter && after !== newAfter) {
			after = newAfter;
			updateNodeData(id, { value: newAfter });
		}
	});

	// Row increment effect
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
		} else if (data.row !== row + 1) {
			updateNodeData(id, { row: row + 1 });
		}
	});
</script>

<NodeWrapper
	title="Step"
	description="Inclusion or Exclusion"
	nodeId={id}
	nodeType={type}
	excludedHandles={data.row === null ? [] : [stepTargetGroup.handleId]}
>
	{#snippet content()}
		<div class="flex flex-col gap-2">
			<Label for="step-label">Label</Label>
			<Input
				name="step-label"
				value={data.stepLabel}
				type="text"
				oninput={(evt) => {
					const raw = (evt.target as HTMLInputElement | null)?.value ?? '';
					updateNodeData(id, { stepLabel: raw });
				}}
				class="nodrag"
			/>

			<Collapsible.Root>
				<div class="flex items-center justify-between space-x-4">
					<Label for="delta">Dropped</Label>
					<Collapsible.Trigger
						class={buttonVariants({ variant: 'ghost', size: 'sm', class: 'w-9 p-0' })}
					>
						<ChevronsUpDownIcon />
						<span class="sr-only">Toggle</span>
					</Collapsible.Trigger>
				</div>
				<NumberField.Root bind:value={delta}>
					<NumberField.Group class="nodrag bg-background dark:bg-input/30 border dark:border-input">
						<NumberField.Decrement />
						<NumberField.Input class="w-[10ch]" name="delta" />
						<NumberField.Increment />
					</NumberField.Group>
				</NumberField.Root>
				<Collapsible.Content class="mt-2 space-y-2" forceMount>
					{#snippet child({ props, open })}
						{#if open}
							<div {...props} transition:slide>
								<Label for="dropped-label">Dropped label</Label>
								<Input
									name="dropped-Label"
									value={data.droppedLabel}
									type="text"
									oninput={(evt) => {
										const raw = (evt.target as HTMLInputElement | null)?.value ?? '';
										updateNodeData(id, { droppedLabel: raw });
									}}
									class="nodrag"
								/>
							</div>
						{/if}
					{/snippet}
				</Collapsible.Content>
			</Collapsible.Root>
			{#if after}
				<div transition:slide class="flex flex-col gap-2">
					<Label for="after">After</Label>
					<NumberField.Root min={0} bind:value={after}>
						<NumberField.Group
							class="nodrag bg-background dark:bg-input/30 border dark:border-input"
						>
							<NumberField.Decrement />
							<NumberField.Input class="w-[10ch]" name="after" />
							<NumberField.Increment />
						</NumberField.Group>
					</NumberField.Root>
				</div>
			{/if}
		</div>
	{/snippet}
</NodeWrapper>
