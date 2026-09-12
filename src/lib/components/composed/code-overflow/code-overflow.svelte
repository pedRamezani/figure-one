<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '@/utils';

	export type CodeOverflowProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/** Whether the block is clipped to `maxHeight`. */
		collapsed?: boolean;
		/** Height of the clipped state. */
		maxHeight?: string;
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { Button } from '@/components/ui/button/index.js';
	import { cn } from '@/utils';

	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';

	// A replacement for the registry's code overflow, which offers Expand but
	// nothing to undo it, and no way to change the icon. Keeps the
	// `data-code-overflow` attribute, because the code block's own stylesheet
	// uses it to decide whether to impose its own maximum height.

	let {
		ref = $bindable(null),
		collapsed = $bindable(true),
		maxHeight = '300px',
		class: className,
		children,
		...restProps
	}: CodeOverflowProps = $props();
</script>

<div
	bind:this={ref}
	data-code-overflow
	data-collapsed={collapsed}
	class={cn('relative overflow-y-hidden', className)}
	style:max-height={collapsed ? maxHeight : undefined}
	{...restProps}
>
	{@render children?.()}

	{#if collapsed}
		<!-- Fades the clipped edge so it reads as "there is more". -->
		<div
			class="from-background pointer-events-none absolute bottom-0 left-0 z-10 h-full w-full bg-linear-to-t to-transparent"
		></div>
	{/if}

	<Button
		variant="secondary"
		size="sm"
		class="absolute bottom-2 left-1/2 z-20 w-fit -translate-x-1/2"
		onclick={() => (collapsed = !collapsed)}
	>
		{#if collapsed}
			<ChevronDownIcon />
			Expand
		{:else}
			<ChevronUpIcon />
			Collapse
		{/if}
	</Button>
</div>
