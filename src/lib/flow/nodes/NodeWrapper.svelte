<script lang="ts">
	import * as Card from '@/components/ui/card/index.js';
	import type { Snippet } from 'svelte';
	import type { RegisteredNodeType } from './node-types.ts';
	import { nodeHandles } from '../handles/handle-types.ts';

	import HandleWrapper from '../handles/HandleWrapper.svelte';

	let {
		nodeId,
		nodeType,
		title,
		description,
		excludedHandles,
		content,
		footer
	}: {
		nodeId: string;
		nodeType: RegisteredNodeType;
		title: string;
		description?: string;
		excludedHandles?: string[];
		content: Snippet;
		footer?: Snippet;
	} = $props();

	const handles = $derived(
		nodeHandles[nodeType].filter((handle) => !(excludedHandles ?? []).includes(handle.handleId))
	);
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
		{#each handles as handle (handle.handleId)}
			<HandleWrapper {nodeId} {handle} />
		{/each}
	</Card.Content>
	{#if footer}
		<Card.Footer>
			{@render footer()}
		</Card.Footer>
	{/if}
</Card.Root>
