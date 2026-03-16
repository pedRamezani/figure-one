<script module>
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
		...restProps
	}: SimpleFieldProps = $props();
</script>

<Field.Field class={cn(typeof value == 'number' ? 'max-w-48' : 'max-w-2xs', className)}>
	<Field.Label for={name}>{title}</Field.Label>
	<Input {name} type={typeof value == 'number' ? 'number' : 'text'} bind:value {...restProps} />
</Field.Field>
