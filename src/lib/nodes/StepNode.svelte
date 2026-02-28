<script lang="ts">
	import { useSvelteFlow, useNodeConnections, useNodesData, type NodeProps } from '@xyflow/svelte';

	import Label from '@/components/ui/label/label.svelte';
	import Input from '@/components/ui/input/input.svelte';
	import * as Collapsible from '@/components/ui/collapsible/index.js';

	import NodeWrapper from './NodeWrapper.svelte';

	import { stepTargetInput } from './types.ts';

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

	$effect(function () {
		if (noConnection) {
			if (data.value !== null) {
				updateNodeData(id, { value: null });
			}
			return;
		}

		// There should only be one connection anyway
		const connection = targetData.current[0];

		const value = connection.data?.value as number;
		const newValue = value - (data.delta as number);

		// IMPORTANT: Removing this will cause an infinite loop.
		if (newValue && data.value !== newValue) {
			updateNodeData(id, { value: newValue });
		}

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

<NodeWrapper title="Step" description="Inclusion or Exclusion" nodeId={id} nodeType={type}>
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
				<Input
					name="delta"
					value={data.delta}
					type="number"
					oninput={(evt) => {
						const raw = (evt.target as HTMLInputElement | null)?.value ?? '';
						const parsedDelta = Number.isFinite(Number(raw)) && raw !== '' ? parseInt(raw, 10) : 0;
						const prev =
							targetData.current.length !== 0
								? ((targetData.current[0].data.value as number) ?? NaN)
								: NaN;

						const newAfter = isNaN(prev) ? null : prev - parsedDelta;
						updateNodeData(id, { delta: parsedDelta, value: newAfter });
					}}
					class="nodrag"
				/>
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

			{#if data.value}
				<div transition:slide class="flex flex-col gap-2">
					<Label for="after">After</Label>
					<Input
						name="after"
						value={data.value ?? 0}
						type="number"
						oninput={(evt) => {
							const raw = (evt.target as HTMLInputElement | null)?.value ?? '';
							const parsedAfter =
								Number.isFinite(Number(raw)) && raw !== '' ? parseInt(raw, 10) : NaN;
							const prev =
								targetData.current.length !== 0
									? ((targetData.current[0]?.data?.value as number) ?? NaN)
									: NaN;

							const newDelta = isNaN(prev) ? null : prev - parsedAfter;
							updateNodeData(id, { value: parsedAfter, delta: newDelta });
						}}
						class="nodrag"
					/>
				</div>
			{/if}
		</div>
	{/snippet}
</NodeWrapper>
