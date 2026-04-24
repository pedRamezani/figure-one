<script lang="ts">
	import { useSvelteFlow, useNodeConnections, useNodesData, type NodeProps } from '@xyflow/svelte';

	import Input from '@/components/ui/input/input.svelte';
	import Label from '@/components/ui/label/label.svelte';
	import * as NumberField from '$lib/components/ui/number-field';

	import NodeWrapper from './NodeWrapper.svelte';

	import { substepTarget } from './types';

	// --- SETUP ---
	const { id, data, type }: NodeProps = $props();
	const { updateNodeData } = useSvelteFlow();

	const connectionsTarget = useNodeConnections({
		handleId: substepTarget.handleId,
		handleType: substepTarget.handleType
	});

	const targetData = $derived(
		useNodesData(connectionsTarget.current.map((connection) => connection.source))
	);

	const noConnection = $derived<boolean>(targetData.current.length === 0);

	// --- ROW INHERITANCE ---
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
		} else if (data.row !== row) {
			updateNodeData(id, { row: row });
		}
	});

	// --- BINDING OBJECTS ---
	const labelBinding = {
		get value() {
			return data.label as string;
		},
		set value(next: string) {
			updateNodeData(id, { label: next });
		}
	};

	const deltaBinding = {
		get value() {
			return (data.delta as number | null) ?? 0;
		},
		set value(next: number | undefined) {
			updateNodeData(id, { delta: next ?? 0 });
		}
	};
</script>

<NodeWrapper title="Substep" description="Inclusion or Exclusion" nodeId={id} nodeType={type}>
	{#snippet content()}
		<div class="flex flex-col gap-2">
			<Label for="label">Label</Label>
			<Input name="label" bind:value={labelBinding.value} type="text" class="nodrag" />

			<Label for="delta">Dropped</Label>
			<NumberField.Root min={0} bind:value={deltaBinding.value}>
				<NumberField.Group class="nodrag bg-background dark:bg-input/30 border dark:border-input">
					<NumberField.Decrement />
					<NumberField.Input class="w-[10ch]" name="delta" />
					<NumberField.Increment />
				</NumberField.Group>
			</NumberField.Root>
		</div>
	{/snippet}
</NodeWrapper>
