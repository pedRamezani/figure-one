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
	import * as Collapsible from '@/components/ui/collapsible/index.js';

	import WideHandle from '@/handles/WideHandle.svelte';
	import NodeWrapper from './NodeWrapper.svelte';

	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import { clsx } from 'clsx';
	import { buttonVariants } from '@/components/ui/button/index.js';

	const { id, data }: NodeProps = $props();

	const { updateNodeData } = useSvelteFlow();

	const connectionsTarget = useNodeConnections({
		handleType: 'target'
	});
	const connectionsSourceOutput = useNodeConnections({
		handleId: 'step-output',
		handleType: 'source'
	});
	// const connectionsSourceSubsteps = useNodeConnections({
	// 	id: 'step-substeps',
	// 	handleType: 'source'
	// });

	const isConnectableTarget = $derived(connectionsTarget.current.length === 0);
	const isConnectableSourceOutput = $derived(connectionsSourceOutput.current.length === 0);

	const isValidConnectionTarget: IsValidConnection = (edge) => {
		return ['start', 'step-output'].includes(edge.sourceHandle ?? '');
	};

	const isValidConnectionSourceSubsteps: IsValidConnection = (edge) => {
		return edge.targetHandle == 'substep';
	};

	const isValidConnectionSourceOutput: IsValidConnection = (edge) => {
		return edge.targetHandle == 'step-input' && edge.source !== edge.target;
	};

	const targetData = $derived(
		useNodesData(connectionsTarget.current.map((connection) => connection.source))
	);

	const noConnection = $derived(targetData.current.length === 0);

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
		if (newValue && data.value != newValue) {
			updateNodeData(id, { value: newValue });
		}
	});

	$inspect(isConnectableSourceOutput);
</script>

<NodeWrapper title="Step" description="Inclusion or Exclusion">
	{#snippet content()}
		<div class="flex flex-col gap-2">
			<!-- Top Section -->
			<div
				class={clsx(
					'absolute top-6 right-6 size-4 rounded-full',
					noConnection ? 'bg-rose-300' : data.value === null ? 'bg-amber-300' : 'bg-emerald-300'
				)}
			></div>
			<WideHandle
				id="step-input"
				type="target"
				position={Position.Top}
				isConnectable={isConnectableTarget}
				isValidConnection={isValidConnectionTarget}
			/>

			<!-- Right Section -->
			<WideHandle
				id="step-substeps"
				type="source"
				position={Position.Right}
				isValidConnection={isValidConnectionSourceSubsteps}
			/>

			<!-- Main Section -->
			<Collapsible.Root>
				<div class="flex items-center justify-between space-x-4">
					<Label for="step-label">Label</Label>
					<Collapsible.Trigger
						class={buttonVariants({ variant: 'ghost', size: 'sm', class: 'w-9 p-0' })}
					>
						<ChevronsUpDownIcon />
						<span class="sr-only">Toggle</span>
					</Collapsible.Trigger>
				</div>
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
				<Collapsible.Content class="mt-2 space-y-2">
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
					<Label for="group">Group</Label>
					<Input
						name="group"
						value={data.group}
						type="text"
						oninput={(evt) => {
							const raw = (evt.target as HTMLInputElement | null)?.value ?? '';
							updateNodeData(id, { group: raw });
						}}
						class="nodrag"
					/>
				</Collapsible.Content>
			</Collapsible.Root>

			<Label for="delta">Dropped</Label>
			<Input
				name="delta"
				value={data.delta}
				type="number"
				oninput={(evt) => {
					const raw = (evt.target as HTMLInputElement | null)?.value ?? '';
					const parsedDelta = Number.isFinite(Number(raw)) ? parseInt(raw, 10) : 0;
					const prev =
						targetData.current.length !== 0
							? ((targetData.current[0].data.value as number) ?? NaN)
							: NaN;

					const newAfter = isNaN(prev) ? null : prev - parsedDelta;
					updateNodeData(id, { delta: parsedDelta, value: newAfter });
				}}
				class="nodrag"
			/>

			{#if data.value}
				<Label for="after">After</Label>
				<Input
					name="after"
					value={data.value ?? 0}
					type="number"
					oninput={(evt) => {
						const raw = (evt.target as HTMLInputElement | null)?.value ?? '';
						const parsedAfter = Number.isFinite(Number(raw)) ? parseInt(raw, 10) : NaN;
						const prev =
							targetData.current.length !== 0
								? ((targetData.current[0]?.data?.value as number) ?? NaN)
								: NaN;

						const newDelta = isNaN(prev) ? null : prev - parsedAfter;
						updateNodeData(id, { value: parsedAfter, delta: newDelta });
					}}
					class="nodrag"
				/>
			{/if}

			<!-- Bottom Section -->
			<WideHandle
				id="step-output"
				type="source"
				position={Position.Bottom}
				isConnectable={isConnectableSourceOutput}
				isValidConnection={isValidConnectionSourceOutput}
			/>
		</div>
	{/snippet}
</NodeWrapper>
