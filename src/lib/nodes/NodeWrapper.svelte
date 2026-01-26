<script lang="ts">
	import * as Card from '@/components/ui/card/index.js';
	import type { Snippet } from 'svelte';
	import { type RegisteredNodeType, nodeHandles } from '@/nodes/types';

	import SimpleHandle from '@/handles/SimpleHandle.svelte';

	let {
		nodeId,
		nodeType,
		title,
		description,
		content,
		footer
	}: {
		nodeId: string;
		nodeType: RegisteredNodeType;
		title: string;
		description?: string;
		content: Snippet;
		footer?: Snippet;
	} = $props();

	const handles = $derived(nodeHandles[nodeType]);
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>{title}</Card.Title>
		{#if description}
			<Card.Description>{description}</Card.Description>
		{/if}
	</Card.Header>
	<Card.Content>
		{@render content()}

		<!-- Handles -->
		{#each handles as handle}
			<SimpleHandle {nodeId} {handle} />
		{/each}
	</Card.Content>
	{#if footer}
		<Card.Footer>
			{@render footer()}
		</Card.Footer>
	{/if}
</Card.Root>
