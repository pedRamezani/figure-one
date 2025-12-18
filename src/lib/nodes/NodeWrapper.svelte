<script lang="ts">
	import * as Card from '@/components/ui/card/index.js';
	import type { Snippet } from 'svelte';

	let {
		title,
		description,
		content,
		footer
	}: { title: String; description?: String; content: Snippet; footer?: Snippet } = $props();
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
	</Card.Content>
	{#if footer}
		<Card.Footer>
			{@render footer()}
		</Card.Footer>
	{/if}
</Card.Root>
