<script lang="ts">
	import {
		Position,
		useSvelteFlow,
		useNodeConnections,
		type NodeProps,
		type IsValidConnection
	} from '@xyflow/svelte';

	import Label from '@/components/ui/label/label.svelte';
	import Input from '@/components/ui/input/input.svelte';
	import * as Collapsible from '@/components/ui/collapsible/index.js';

	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import { buttonVariants } from '@/components/ui/button/index.js';

	import WideHandle from '@/handles/WideHandle.svelte';
	import NodeWrapper from './NodeWrapper.svelte';

	const { id, data }: NodeProps = $props();

	const { updateNodeData } = useSvelteFlow();

	const connections = useNodeConnections({ handleType: 'source' });

	const isConnectable = $derived(connections.current.length === 0);

	const isValidConnection: IsValidConnection = (edge) => edge.targetHandle == 'step-input';
</script>

<NodeWrapper title="CONSORT Start" description="The flowchart will start from here.">
	{#snippet content()}
		<div class="flex flex-col gap-2">
			<Collapsible.Root>
				<div class="flex items-center justify-between space-x-4">
					<Label for="label">Label</Label>
					<Collapsible.Trigger
						class={buttonVariants({ variant: 'ghost', size: 'sm', class: 'w-9 p-0' })}
					>
						<ChevronsUpDownIcon />
						<span class="sr-only">Toggle</span>
					</Collapsible.Trigger>
				</div>
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
				<Collapsible.Content class="mt-2 space-y-2">
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

			<Label for="start">Population size</Label>
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
			<WideHandle
				id="start"
				type="source"
				position={Position.Bottom}
				{isConnectable}
				{isValidConnection}
			/>
		</div>
	{/snippet}
</NodeWrapper>
