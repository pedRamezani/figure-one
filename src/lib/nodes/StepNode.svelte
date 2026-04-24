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

	// --- SETUP ---
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

	// Helper to get parent value
	const getPrevValue = () => {
		if (noConnection) return NaN;
		return (targetData.current[0]?.data?.value as number | null) ?? NaN;
	};

	// --- BINDING OBJECTS ---
	const deltaBinding = {
		get value() {
			return (data.delta as number | null) ?? 0;
		},
		set value(next: number | undefined) {
			const parsedDelta = Number.isFinite(next) ? next! : 0;
			const prev = getPrevValue();
			const newAfter = isNaN(prev) ? null : prev - parsedDelta;

			updateNodeData(id, { delta: parsedDelta, value: newAfter });
		}
	};

	const afterBinding = {
		get value() {
			// Return NaN if no connection to hide the input via the UI check
			return noConnection ? NaN : ((data.value as number | null) ?? NaN);
		},
		set value(next: number | undefined) {
			const parsedAfter = Number.isFinite(next) ? next! : 0;
			const prev = getPrevValue();

			if (!isNaN(prev)) {
				const newDelta = prev - parsedAfter;
				updateNodeData(id, { value: parsedAfter, delta: newDelta });
			}
		}
	};

	// --- PARENT COUPLING ---
	$effect(() => {
		if (noConnection) return;

		// There should only be one connection
		const parentValue = targetData.current[0]?.data.value as number | null;
		if (parentValue === null) return;

		const calculatedAfter = parentValue - (data.delta as number);
		if (data.value !== calculatedAfter) {
			// IMPORTANT: Removing the check will cause an infinite loop.
			// Use untrack or a simple check to avoid loops in edge cases
			updateNodeData(id, { value: calculatedAfter });
		}
	});

	// --- ROW INCREMENT EFFECT ---
	$effect(function () {
		if (noConnection) {
			if (data.row !== null) updateNodeData(id, { row: null });
			return;
		}

		const connection = targetData.current[0];
		const row = ('row' in connection.data ? connection.data?.row : null) as number | null;

		if (row === null) {
			if (data.row !== null) updateNodeData(id, { row: null });
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
				oninput={(evt) => updateNodeData(id, { stepLabel: evt.currentTarget.value })}
				class="nodrag"
			/>

			<Collapsible.Root>
				<div class="flex items-center justify-between space-x-4">
					<Label for="delta">Dropped</Label>
					<Collapsible.Trigger
						class={buttonVariants({ variant: 'ghost', size: 'sm', class: 'w-9 p-0' })}
					>
						<ChevronsUpDownIcon />
					</Collapsible.Trigger>
				</div>

				<NumberField.Root bind:value={deltaBinding.value}>
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
									oninput={(evt) => updateNodeData(id, { droppedLabel: evt.currentTarget.value })}
									class="nodrag"
								/>
							</div>
						{/if}
					{/snippet}
				</Collapsible.Content>
			</Collapsible.Root>

			{#if !Number.isNaN(afterBinding.value)}
				<div transition:slide class="flex flex-col gap-2">
					<Label for="after">After</Label>
					<NumberField.Root min={0} bind:value={afterBinding.value}>
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
