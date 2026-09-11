<script lang="ts" module>
	export type SimpleFieldProps = WithElementRef<
		Omit<HTMLInputAttributes, 'type' | 'name' | 'files'> & {
			title: string;
			name: string;
			value: number | string;
			class?: ClassValue;
		}
	>;
</script>

<script lang="ts">
	import * as Field from '@/components/ui/field/index.js';
	import Input from '@/components/ui/input/input.svelte';

	import { type ClassValue } from 'clsx';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '@/utils';

	let {
		title,
		name,
		value = $bindable(),
		class: className,
		min,
		...restProps
	}: SimpleFieldProps = $props();

	const isNum = $derived(typeof value !== 'string');
</script>

<Field.Field class={cn(isNum ? 'max-w-48' : 'max-w-2xs', className)}>
	<Field.Label for={name}>{title}</Field.Label>
	<Input
		{name}
		type={isNum ? 'number' : 'text'}
		bind:value={() => value, (v) => (value = isNum ? v || min || 0 : v)}
		{min}
		{...restProps}
	/>
</Field.Field>
