<script lang="ts">
	import { cn, type WithElementRef } from '@/utils.js';
	import { Handle, Position, type HandleProps } from '@xyflow/svelte';

	const handleClass =
		'inline-block rounded-full border transition-[color,box-shadow] bg-primary text-primary-foreground border-transparent';

	let { class: className, position, ...restProps }: WithElementRef<HandleProps> = $props();
</script>

<Handle
	class={cn(
		[Position.Top, Position.Bottom].includes(position) ? 'w-8 h-2' : 'w-2 h-8',
		handleClass,
		className
	)}
	{position}
	{...restProps}
/>
