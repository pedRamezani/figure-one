<script lang="ts">
	import { useNodeConnections, type NodeProps } from '@xyflow/svelte';

	import NodeWrapper from './NodeWrapper.svelte';

	const { id, data }: NodeProps = $props();

	const connectionsSource = useNodeConnections({ handleType: 'source' });
</script>

<NodeWrapper
	title="Split"
	description="The flowchart will split from here."
	nodeId={id}
	nodeType="split"
>
	{#snippet content()}
		<div class="w-xs"></div>
	{/snippet}
</NodeWrapper>
