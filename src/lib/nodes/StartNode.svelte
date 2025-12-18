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

	import WideHandle from '@/handles/WideHandle.svelte';
	import NodeWrapper from './NodeWrapper.svelte';

	const { id, data }: NodeProps = $props();

	const { updateNodeData } = useSvelteFlow();

	const connections = useNodeConnections({ handleType: 'source' });

	const isConnectable = $derived(connections.current.length === 0);

	const isValidConnection: IsValidConnection = (edge) => {
		console.log(edge);
		return true;
	};
</script>

<NodeWrapper title="CONSORT Start" description="The flowchart will start from here.">
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
