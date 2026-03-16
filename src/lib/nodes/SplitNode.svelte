<script lang="ts">
	import { useNodeConnections, type NodeProps, useNodesData, useSvelteFlow } from '@xyflow/svelte';

	import Button from '@/components/ui/button/button.svelte';
	import * as ButtonGroup from '@/components/ui/button-group/';
	import Label from '@/components/ui/label/label.svelte';
	import * as NumberField from '$lib/components/ui/number-field';

	import { SquarePlusIcon } from '@lucide/svelte';

	import NodeWrapper from './NodeWrapper.svelte';

	import { splitSourceOutput, splitTargetInput, splitstartTargetInput } from './types';

	import { addNode, addEdge } from '@/preview/flow/Flow.svelte';

	import { slide } from 'svelte/transition';

	const { id, type }: NodeProps = $props();

	const connectionsSourcesOutput = useNodeConnections({
		handleType: splitSourceOutput.handleType,
		handleId: splitSourceOutput.handleId
	});
	const connectionsTargetInput = useNodeConnections({
		handleType: splitTargetInput.handleType,
		handleId: splitTargetInput.handleId
	});

	// Check if there is no source connection
	const noSourceConnection = $derived(connectionsSourcesOutput.current.length === 0);

	// Sum of target value for split calculation
	const targetData = $derived(
		useNodesData(connectionsTargetInput.current.map((connection) => connection.source))
	);
	const targetValues = $derived(targetData.current.map((node) => (node.data.value ?? 0) as number));
	const targetSummedValue = $derived(
		targetValues.length > 0 ? targetValues.reduce((sum, value) => sum + value, 0) : null
	);

	// Generate Nodes based on specified splits
	let rawSplits = $state<number>(2);
	const splits = $derived<number>(rawSplits < 2 ? 2 : rawSplits);
	const { getNodesBounds } = useSvelteFlow();
	function generateSplits() {
		if (targetSummedValue === null) return;

		const splitValues: number[] = [];
		const rest = targetSummedValue % splits;
		const baseValue = Math.floor(targetSummedValue / splits);
		for (let i = 0; i < splits; i++) {
			splitValues.push(baseValue + (i < rest ? 1 : 0));
		}

		const bound = getNodesBounds([id]);
		const rowNode = addNode(
			'row',
			{
				x: bound.x - (300 * (splits - 1)) / 2,
				y: bound.y + bound.height + 50
			},
			[0, 0], // VERY IMPORTANT!
			{},
			undefined,
			true // VERY IMPORTANT!
		);

		const parentId = rowNode.id;
		for (const [index, splitVal] of splitValues.entries()) {
			const newNode = addNode(
				'splitstart',
				{
					x: index * 300,
					y: 50
				},
				[0, 0],
				{
					value: splitVal,
					row: 0
				},
				parentId
			);

			addEdge(id, newNode.id, splitSourceOutput.handleId, splitstartTargetInput.handleId);
		}
	}
</script>

<NodeWrapper
	title="Split"
	description="The flowchart will split from here."
	nodeId={id}
	nodeType={type}
>
	{#snippet content()}
		<div class="w-3xs"></div>
		{#if targetSummedValue && noSourceConnection}
			<div class="flex flex-col gap-2" transition:slide>
				<Label for="split">Splits</Label>
				<ButtonGroup.Root orientation="vertical" class="w-full">
					<NumberField.Root min={2} bind:value={rawSplits}>
						<NumberField.Group class="nodrag">
							<NumberField.Decrement />
							<NumberField.Input class="w-[10ch]" name="split" />
							<NumberField.Increment />
						</NumberField.Group>
					</NumberField.Root>

					<Button
						variant="outline"
						size="default"
						class="w-full"
						aria-label="Generate Split Nodes"
						onclick={generateSplits}
					>
						<SquarePlusIcon /> Generate Splits
					</Button>
				</ButtonGroup.Root>
			</div>
		{/if}
	{/snippet}
</NodeWrapper>
