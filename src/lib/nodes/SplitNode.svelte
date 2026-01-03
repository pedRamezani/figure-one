<script lang="ts">
	import {
		Position,
		useSvelteFlow,
		useNodeConnections,
		type NodeProps,
		type IsValidConnection
	} from '@xyflow/svelte';

	import WideHandle from '@/handles/WideHandle.svelte';
	import NodeWrapper from './NodeWrapper.svelte';

	const { id, data }: NodeProps = $props();
	// const { updateNodeData } = useSvelteFlow();

	const connectionsSource = useNodeConnections({ handleType: 'source' });

	const isConnectableInput = $derived<boolean>(connectionsSource.current.length === 0);

	const isValidConnectionInput: IsValidConnection = (edge) => edge.sourceHandle == 'step-input';
	const isValidConnectionOutput: IsValidConnection = (edge) => edge.targetHandle == 'step-input';
</script>

<NodeWrapper title="Split" description="The flowchart will split from here.">
	{#snippet content()}
		<WideHandle
			id="split-input"
			type="target"
			position={Position.Top}
			isConnectable={isConnectableInput}
			isValidConnection={isValidConnectionInput}
		/>

		<div class="w-xs"></div>

		<WideHandle
			id="split-output"
			type="source"
			position={Position.Bottom}
			isValidConnection={isValidConnectionOutput}
		/>
	{/snippet}
</NodeWrapper>
