<script lang="ts">
	import { useSvelteFlow, type NodeProps } from '@xyflow/svelte';

	import Label from '@/components/ui/label/label.svelte';
	import Input from '@/components/ui/input/input.svelte';

	import NodeWrapper from './NodeWrapper.svelte';

	const { id, data }: NodeProps = $props();

	const { updateNodeData } = useSvelteFlow();
</script>

<NodeWrapper title="Group" description="The group name of a node." nodeId={id} nodeType="groups">
	{#snippet content()}
		<div class="flex flex-col gap-2">
			<Label for="group">Label</Label>
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
		</div>
	{/snippet}
</NodeWrapper>
