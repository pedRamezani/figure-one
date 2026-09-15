<script lang="ts">
	import {
		styleConfig,
		arrowBodies,
		arrowHeads,
		aligmentOptions,
		textAligmentOptions,
		fontOptions,
		thousandSeparatorOptions,
		thousandSeparatorSample,
		fourDigitSample,
		titlePlacementOptions,
		numberingBodyOptions,
		numberingFormattingOptions,
		subDeltaMarkerOptions,
		type ArrowBody,
		type ArrowHead,
		type Alignment,
		type TextAlignment,
		type TitlePlacement,
		type ValueAligment,
		type NumberingBody,
		type NumberingFormatting
	} from './style-config.svelte';

	import Button from '@/components/ui/button/button.svelte';
	import * as Field from '@/components/ui/field/index.js';
	import * as Select from '@/components/ui/select';
	import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';

	import { ColorPicker } from '@/components/composed/color-picker';
	import { SimpleField } from '@/components/composed/simple-field';
	import Input from '@/components/ui/input/input.svelte';

	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import BoldIcon from '@lucide/svelte/icons/bold';
	import TypeIcon from '@lucide/svelte/icons/type';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import EyeOffIcon from '@lucide/svelte/icons/eye-off';
	import SquareIcon from '@lucide/svelte/icons/square';
	import SquareDashedIcon from '@lucide/svelte/icons/square-dashed';
	import TextAlignStartIcon from '@lucide/svelte/icons/text-align-start';
	import TextAlignCenterIcon from '@lucide/svelte/icons/text-align-center';
	import TextAlignEndIcon from '@lucide/svelte/icons/text-align-end';
	import type { Component } from 'svelte';

	const alignmentMapping: Record<Alignment, Component> = {
		left: TextAlignStartIcon,
		center: TextAlignCenterIcon,
		right: TextAlignEndIcon
	};

	// A two-option group rather than a single toggle, so it reads the same way as
	// Title Alignment beside it and neither state is ambiguous.
	const weightOptions: { value: string; label: string; icon: Component }[] = [
		{ value: 'regular', label: 'Regular', icon: TypeIcon },
		{ value: 'bold', label: 'Bold', icon: BoldIcon }
	];

	const valueVisibilityOptions: { value: string; label: string; icon: Component }[] = [
		{ value: 'shown', label: 'Shown', icon: EyeIcon },
		{ value: 'hidden', label: 'Hidden', icon: EyeOffIcon }
	];

	const titleOptions: { value: string; label: string; icon: Component }[] = [
		{ value: 'shown', label: 'Shown', icon: EyeIcon },
		{ value: 'hidden', label: 'Hidden', icon: EyeOffIcon }
	];

	const backgroundOptions: { value: string; label: string; icon: Component }[] = [
		{ value: 'filled', label: 'Filled', icon: SquareIcon },
		{ value: 'transparent', label: 'Transparent', icon: SquareDashedIcon }
	];

	const textAlignmentMapping: Record<TextAlignment, Component> = {
		'text-left': TextAlignStartIcon,
		'text-right': TextAlignEndIcon
	};

	let arrowBody = $state<ArrowBody>('-');
	let arrowHead = $state<ArrowHead>('|>');

	const arrowBodyMapping: Record<ArrowBody, string> = {
		'-': 'line-single',
		'=': 'line-double',
		'==': 'line-triple',
		'--': 'line-dashed',
		'..': 'line-dotted'
	};

	const arrowHeadMapping: Record<ArrowHead, string> = {
		'>': 'arrow-single',
		'>>': 'arrow-double',
		'>>>': 'arrow-triple',
		o: 'small-unfilled-circle',
		O: 'big-unfilled-circle',
		'|>': 'triangular',
		'}>': 'classic',
		x: 'small-cross',
		X: 'big-cross',
		'*': 'small-filled-circle',
		'@': 'big-filled-circle',
		'[]': 'square',
		'<>': 'rhombus'
	};

	function arrowUpdate() {
		styleConfig.current.mark.arrow = `${arrowBody}${arrowHead}`;
	}

	let numberingBody = $state<NumberingBody | string>(null);
	let numberingFormatting = $state<NumberingFormatting>(null);

	/** True when the chosen body is a literal bullet rather than a counter. */
	const isMarker = $derived(
		numberingBody !== null && (subDeltaMarkerOptions as readonly string[]).includes(numberingBody)
	);

	function numberingUpdate() {
		const step = styleConfig.current.stepBox;

		// A bullet is not a counting pattern, so it goes in its own field and the
		// dot and parentheses formatting does not apply to it.
		if (isMarker) {
			step.subDeltaMarker = numberingBody;
			step.subDeltaNumbering = null;
			return;
		}

		step.subDeltaMarker = null;

		let prefix = '';
		let suffix = '';
		if (numberingFormatting) {
			if (numberingFormatting.includes('parentheses')) {
				prefix = numberingFormatting.includes('single') ? '' : '(';
				suffix = ')';
			} else if (numberingFormatting === 'dot') {
				suffix = '.';
			}
		}

		if (numberingBody) {
			step.subDeltaNumbering = `${prefix}${numberingBody as NumberingBody}${suffix}`;
		} else {
			step.subDeltaNumbering = null;
		}
	}

	function restoreDefaults() {
		styleConfig.reset();
	}
</script>

{#snippet pairField(
	label: string,
	parts: {
		name: string;
		label: string;
		get: () => string | number;
		set: (next: string | number) => void;
		min?: number;
	}[],
	disabled: boolean = false
)}
	<!--
		Two settings that only mean something together: width and height, inset
		and outset, prefix and suffix. The group label names the pair so each
		part needs only a single word, which keeps them side by side.
	-->
	<Field.Field>
		<Field.Label>{label}</Field.Label>
		<div class="flex items-end gap-2">
			{#each parts as part (part.name)}
				{@const isText = typeof part.get() === 'string'}
				<div class="flex min-w-0 flex-1 flex-col gap-1.5">
					<Field.Label for={part.name} class="text-muted-foreground text-xs font-normal">
						{part.label}
					</Field.Label>
					<Input
						name={part.name}
						{disabled}
						type={isText ? 'text' : 'number'}
						min={part.min}
						bind:value={() => part.get(), (next) => part.set(isText ? next : next || part.min || 0)}
					/>
				</div>
			{/each}
		</div>
	</Field.Field>
{/snippet}

{#snippet alignToggle(
	name: string,
	label: string,
	get: () => Alignment,
	set: (next: Alignment) => void,
	disabled: boolean = false
)}
	<Field.Field>
		<Field.Label for={name}>{label}</Field.Label>
		<ToggleGroup.Root
			type="single"
			variant="outline"
			{disabled}
			bind:value={
				() => get(),
				(next) => {
					if (next) set(next as Alignment);
				}
			}
		>
			{#each aligmentOptions as alignment (alignment)}
				<ToggleGroup.Item
					{name}
					value={alignment}
					aria-label={`${label} ${alignment}`}
					class="data-[state=on]:bg-transparent data-[state=on]:*:[svg]:fill-primary data-[state=on]:*:[svg]:stroke-primary bg-secondary"
				>
					{@const Icon = alignmentMapping[alignment]}
					<Icon />
					{alignment.substring(0, 1).toUpperCase() + alignment.substring(1)}
				</ToggleGroup.Item>
			{/each}
		</ToggleGroup.Root>
	</Field.Field>
{/snippet}

{#snippet valueAlignToggle(
	name: string,
	label: string,
	get: () => ValueAligment,
	set: (next: ValueAligment) => void,
	disabled: boolean = false
)}
	<Field.Field>
		<Field.Label for={name}>{label}</Field.Label>
		<ToggleGroup.Root
			type="single"
			variant="outline"
			{disabled}
			bind:value={
				() => get(),
				(next) => {
					if (next) set(next as ValueAligment);
				}
			}
		>
			{#each textAligmentOptions as alignment (alignment)}
				<ToggleGroup.Item
					{name}
					value={alignment}
					aria-label={alignment === 'text-left' ? 'Left of text' : 'Right of text'}
					class="data-[state=on]:bg-transparent data-[state=on]:*:[svg]:fill-primary data-[state=on]:*:[svg]:stroke-primary bg-secondary"
				>
					{@const Icon = textAlignmentMapping[alignment]}
					<Icon />
					{alignment === 'text-left' ? 'Left of Text' : 'Right of Text'}
				</ToggleGroup.Item>
			{/each}
		</ToggleGroup.Root>

		<ToggleGroup.Root
			type="single"
			variant="outline"
			{disabled}
			bind:value={
				() => get(),
				(next) => {
					if (next) set(next as ValueAligment);
				}
			}
		>
			{#each aligmentOptions as alignment (alignment)}
				<ToggleGroup.Item
					{name}
					value={alignment}
					aria-label={`${label} ${alignment}`}
					class="data-[state=on]:bg-transparent data-[state=on]:*:[svg]:fill-primary data-[state=on]:*:[svg]:stroke-primary bg-secondary"
				>
					{@const Icon = alignmentMapping[alignment]}
					<Icon />
					{alignment.substring(0, 1).toUpperCase() + alignment.substring(1)}
				</ToggleGroup.Item>
			{/each}
		</ToggleGroup.Root>
	</Field.Field>
{/snippet}

{#snippet weightToggle(
	name: string,
	label: string,
	get: () => boolean,
	set: (bold: boolean) => void,
	disabled: boolean = false
)}
	<Field.Field>
		<Field.Label for={name}>{label}</Field.Label>
		<ToggleGroup.Root
			type="single"
			variant="outline"
			{disabled}
			bind:value={
				() => (get() ? 'bold' : 'regular'),
				(next) => {
					if (next) set(next === 'bold');
				}
			}
		>
			{#each weightOptions as option (option.value)}
				<ToggleGroup.Item
					{name}
					value={option.value}
					aria-label={`${label} ${option.label}`}
					class="data-[state=on]:bg-transparent data-[state=on]:*:[svg]:fill-primary data-[state=on]:*:[svg]:stroke-primary bg-secondary"
				>
					{@const Icon = option.icon}
					<Icon />
					{option.label}
				</ToggleGroup.Item>
			{/each}
		</ToggleGroup.Root>
	</Field.Field>
{/snippet}

<svg
	viewBox="0 0 30 15"
	width="30pt"
	height="15pt"
	xmlns="http://www.w3.org/2000/svg"
	xmlns:xlink="http://www.w3.org/1999/xlink"
>
	<defs>
		<g id="line-single">
			<path
				fill="none"
				stroke="currentColor"
				stroke-width="0.528"
				stroke-linecap="round"
				stroke-linejoin="miter"
				stroke-miterlimit="4"
				transform="matrix(1 0 0 1 -11 0)"
				d="M 0 0h 22 "
			/>
		</g>
		<g id="line-double">
			<path
				fill="none"
				stroke="currentColor"
				stroke-width="0.528"
				stroke-linecap="round"
				stroke-linejoin="miter"
				stroke-miterlimit="4"
				transform="matrix(1 0 0 1 -11 -1)"
				d="M 0 0h 22 "
			/>
			<path
				fill="none"
				stroke="currentColor"
				stroke-width="0.528"
				stroke-linecap="round"
				stroke-linejoin="miter"
				stroke-miterlimit="4"
				transform="matrix(1 0 0 1 -11 1)"
				d="M 0 0h 22 "
			/>
		</g>
		<g id="line-triple">
			<path
				fill="none"
				stroke="currentColor"
				stroke-width="0.528"
				stroke-linecap="round"
				stroke-linejoin="miter"
				stroke-miterlimit="4"
				transform="matrix(1 0 0 1 -11 -2)"
				d="M 0 0h 22 "
			/>
			<path
				fill="none"
				stroke="currentColor"
				stroke-width="0.528"
				stroke-linecap="round"
				stroke-linejoin="miter"
				stroke-miterlimit="4"
				transform="matrix(1 0 0 1 -11 0)"
				d="M 0 0h 22 "
			/>
			<path
				fill="none"
				stroke="currentColor"
				stroke-width="0.528"
				stroke-linecap="round"
				stroke-linejoin="miter"
				stroke-miterlimit="4"
				transform="matrix(1 0 0 1 -11 2)"
				d="M 0 0h 22 "
			/>
		</g>
		<g id="line-dashed">
			<path
				fill="none"
				stroke="currentColor"
				stroke-width="0.528"
				stroke-linecap="round"
				stroke-linejoin="miter"
				stroke-miterlimit="4"
				stroke-dashoffset="0"
				stroke-dasharray="3 3"
				transform="matrix(1 0 0 1 -11 0)"
				d="M 0 0h 22 "
			/>
		</g>
		<g id="line-dotted">
			<path
				fill="none"
				stroke="currentColor"
				stroke-width="0.528"
				stroke-linecap="round"
				stroke-linejoin="miter"
				stroke-miterlimit="4"
				stroke-dashoffset="0"
				stroke-dasharray="0.528 2"
				transform="matrix(1 0 0 1 -11 0)"
				d="M 0 0h 22 "
			/>
		</g>
		<g id="arrow-single">
			<path
				fill="none"
				stroke="currentColor"
				stroke-width="0.528"
				stroke-linecap="round"
				stroke-linejoin="miter"
				stroke-miterlimit="4"
				transform="matrix(1 0 0 1 -0.76 0)"
				d="M 0 0m 2.0734575 0 c -1.0645384 0.48963296 -1.8338406 1.455048 -2.0734575 2.6020293 "
			/>
			<path
				fill="none"
				stroke="currentColor"
				stroke-width="0.528"
				stroke-linecap="round"
				stroke-linejoin="miter"
				stroke-miterlimit="4"
				transform="matrix(1 0 0 1 -0.76 -2.6)"
				d="M 0 0m 2.0734575 2.6020293 c -1.0645384 -0.48963308 -1.8338406 -1.455048 -2.0734575 -2.6020293 "
			/>
		</g>
		<g id="arrow-double">
			<path
				fill="none"
				stroke="currentColor"
				stroke-width="0.528"
				stroke-linecap="round"
				stroke-linejoin="miter"
				stroke-miterlimit="4"
				transform="matrix(1 0 0 1 -1.14 0)"
				d="M 0 0m 2.0734575 0 c -1.0645384 0.48963296 -1.8338406 1.455048 -2.0734575 2.6020293 "
			/>
			<path
				fill="none"
				stroke="currentColor"
				stroke-width="0.528"
				stroke-linecap="round"
				stroke-linejoin="miter"
				stroke-miterlimit="4"
				transform="matrix(1 0 0 1 -1.14 -2.6)"
				d="M 0 0m 2.0734575 2.6020293 c -1.0645384 -0.48963308 -1.8338406 -1.455048 -2.0734575 -2.6020293 "
			/>
			<path
				fill="none"
				stroke="currentColor"
				stroke-width="0.528"
				stroke-linecap="round"
				stroke-linejoin="miter"
				stroke-miterlimit="4"
				transform="matrix(1 0 0 1 0.38 0)"
				d="M 0 0m 2.0734575 0 c -1.0645384 0.48963296 -1.8338406 1.455048 -2.0734575 2.6020293 "
			/>
			<path
				fill="none"
				stroke="currentColor"
				stroke-width="0.528"
				stroke-linecap="round"
				stroke-linejoin="miter"
				stroke-miterlimit="4"
				transform="matrix(1 0 0 1 0.38 -2.6)"
				d="M 0 0m 2.0734575 2.6020293 c -1.0645384 -0.48963308 -1.8338406 -1.455048 -2.0734575 -2.6020293 "
			/>
		</g>
		<g id="arrow-triple">
			<path
				fill="none"
				stroke="currentColor"
				stroke-width="0.528"
				stroke-linecap="round"
				stroke-linejoin="miter"
				stroke-miterlimit="4"
				transform="matrix(1 0 0 1 -2.28 0)"
				d="M 0 0m 2.0734575 0 c -1.0645384 0.48963296 -1.8338406 1.455048 -2.0734575 2.6020293 "
			/>
			<path
				fill="none"
				stroke="currentColor"
				stroke-width="0.528"
				stroke-linecap="round"
				stroke-linejoin="miter"
				stroke-miterlimit="4"
				transform="matrix(1 0 0 1 -2.28 -2.6)"
				d="M 0 0m 2.0734575 2.6020293 c -1.0645384 -0.48963308 -1.8338406 -1.455048 -2.0734575 -2.6020293 "
			/>
			<path
				fill="none"
				stroke="currentColor"
				stroke-width="0.528"
				stroke-linecap="round"
				stroke-linejoin="miter"
				stroke-miterlimit="4"
				transform="matrix(1 0 0 1 -0.76 0)"
				d="M 0 0m 2.0734575 0 c -1.0645384 0.48963296 -1.8338406 1.455048 -2.0734575 2.6020293 "
			/>
			<path
				fill="none"
				stroke="currentColor"
				stroke-width="0.528"
				stroke-linecap="round"
				stroke-linejoin="miter"
				stroke-miterlimit="4"
				transform="matrix(1 0 0 1 -0.76 -2.6)"
				d="M 0 0m 2.0734575 2.6020293 c -1.0645384 -0.48963308 -1.8338406 -1.455048 -2.0734575 -2.6020293 "
			/>
			<path
				fill="none"
				stroke="currentColor"
				stroke-width="0.528"
				stroke-linecap="round"
				stroke-linejoin="miter"
				stroke-miterlimit="4"
				transform="matrix(1 0 0 1 0.76 0)"
				d="M 0 0m 2.0734575 0 c -1.0645384 0.48963296 -1.8338406 1.455048 -2.0734575 2.6020293 "
			/>
			<path
				fill="none"
				stroke="currentColor"
				stroke-width="0.528"
				stroke-linecap="round"
				stroke-linejoin="miter"
				stroke-miterlimit="4"
				transform="matrix(1 0 0 1 0.76 -2.6)"
				d="M 0 0m 2.0734575 2.6020293 c -1.0645384 -0.48963308 -1.8338406 -1.455048 -2.0734575 -2.6020293 "
			/>
		</g>
		<g id="small-unfilled-circle">
			<path
				fill="none"
				stroke="currentColor"
				stroke-width="0.528"
				stroke-linecap="round"
				stroke-linejoin="miter"
				stroke-miterlimit="4"
				transform="matrix(1 0 0 1 -1.0560002 -1.0560002)"
				d="M 0 0m 1.0560002 0 c -0.58268404 0 -1.0560002 0.4733162 -1.0560002 1.0560002 c 0 0.5826839 0.4733162 1.0560002 1.0560002 1.0560002 c 0.5826839 0 1.0560002 -0.4733163 1.0560002 -1.0560002 c 0 -0.58268404 -0.4733163 -1.0560002 -1.0560002 -1.0560002 Z "
			/>
		</g>
		<g id="big-unfilled-circle">
			<path
				fill="none"
				stroke="currentColor"
				stroke-width="0.528"
				stroke-linecap="round"
				stroke-linejoin="miter"
				stroke-miterlimit="4"
				transform="matrix(1 0 0 1 -2.1120005 -2.1120005)"
				d="M 0 0m 2.1120005 0 c -1.1653681 0 -2.1120005 0.9466324 -2.1120005 2.1120005 c 0 1.1653678 0.9466324 2.1120005 2.1120005 2.1120005 c 1.1653678 0 2.1120005 -0.9466326 2.1120005 -2.1120005 c 0 -1.1653681 -0.9466326 -2.1120005 -2.1120005 -2.1120005 Z "
			/>
		</g>
		<g id="triangular">
			<path
				fill="currentColor"
				fill-rule="nonzero"
				transform="matrix(1 0 0 1 -2.480789 -1.8058667)"
				d="M 0 0m 0 3.6117334 l 4.961578 -1.8058667 l -4.961578 -1.8058667 "
			/>
		</g>
		<g id="classic">
			<path
				fill="currentColor"
				fill-rule="nonzero"
				stroke="currentColor"
				stroke-width="0.528"
				stroke-linecap="round"
				stroke-linejoin="miter"
				stroke-miterlimit="20"
				transform="matrix(1 0 0 1 -1.4355918 -1.3388549)"
				d="M 0 0m 2.8711836 1.3388549 l -2.8711836 1.3388549 l 0.86135507 -1.3388549 l -0.86135507 -1.3388549 l 2.8711836 1.3388549 Z "
			/>
		</g>
		<g id="small-cross">
			<path
				fill="currentColor"
				fill-rule="nonzero"
				stroke="currentColor"
				stroke-width="0.528"
				stroke-linecap="round"
				stroke-linejoin="miter"
				stroke-miterlimit="4"
				transform="matrix(1 0 0 1 -1.49340975 -1.49340975)"
				d="M 0 0m 0 2.9868195 l 2.9868195 -2.9868195 "
			/>
			<path
				fill="currentColor"
				fill-rule="nonzero"
				stroke="currentColor"
				stroke-width="0.528"
				stroke-linecap="round"
				stroke-linejoin="miter"
				stroke-miterlimit="4"
				transform="matrix(1 0 0 1 -1.49340975 -1.49340975)"
				d="M 0 0l 2.9868195 2.9868195 "
			/>
		</g>
		<g id="big-cross">
			<path
				fill="currentColor"
				fill-rule="nonzero"
				stroke="currentColor"
				stroke-width="0.528"
				stroke-linecap="round"
				stroke-linejoin="miter"
				stroke-miterlimit="4"
				transform="matrix(1 0 0 1 -2.6134672 -2.6134672)"
				d="M 0 0m 0 5.2269344 l 5.2269344 -5.2269344 "
			/>
			<path
				fill="currentColor"
				fill-rule="nonzero"
				stroke="currentColor"
				stroke-width="0.528"
				stroke-linecap="round"
				stroke-linejoin="miter"
				stroke-miterlimit="4"
				transform="matrix(1 0 0 1 -2.6134672 -2.6134672)"
				d="M 0 0l 5.2269344 5.2269344 "
			/>
		</g>
		<g id="small-filled-circle">
			<path
				fill="currentColor"
				fill-rule="nonzero"
				stroke="currentColor"
				stroke-width="0.528"
				stroke-linecap="round"
				stroke-linejoin="miter"
				stroke-miterlimit="4"
				transform="matrix(1 0 0 1 -1.0560002 -1.0560002)"
				d="M 0 0m 1.0560002 0 c -0.58268404 0 -1.0560002 0.4733162 -1.0560002 1.0560002 c 0 0.5826839 0.4733162 1.0560002 1.0560002 1.0560002 c 0.5826839 0 1.0560002 -0.4733163 1.0560002 -1.0560002 c 0 -0.58268404 -0.4733163 -1.0560002 -1.0560002 -1.0560002 Z "
			/>
		</g>
		<g id="big-filled-circle">
			<path
				fill="currentColor"
				fill-rule="nonzero"
				stroke="currentColor"
				stroke-width="0.528"
				stroke-linecap="round"
				stroke-linejoin="miter"
				stroke-miterlimit="4"
				transform="matrix(1 0 0 1 -2.1120005 -2.1120005)"
				d="M 0 0m 2.1120005 0 c -1.1653681 0 -2.1120005 0.9466324 -2.1120005 2.1120005 c 0 1.1653678 0.9466324 2.1120005 2.1120005 2.1120005 c 1.1653678 0 2.1120005 -0.9466326 2.1120005 -2.1120005 c 0 -1.1653681 -0.9466326 -2.1120005 -2.1120005 -2.1120005 Z "
			/>
		</g>
		<g id="square">
			<path
				fill="none"
				stroke="currentColor"
				stroke-width="0.528"
				stroke-linecap="round"
				stroke-linejoin="miter"
				stroke-miterlimit="4"
				transform="matrix(1 0 0 1 -1.05600025 -1.05600025)"
				d="M 0 0v 2.1120005 h 2.1120005 v -2.1120005 h -2.1120005 Z "
			/>
		</g>
		<g id="rhombus">
			<path
				fill="none"
				stroke="currentColor"
				stroke-width="0.528"
				stroke-linecap="round"
				stroke-linejoin="miter"
				stroke-miterlimit="20"
				transform="matrix(1 0 0 1 -1.4934098 -1.4934098)"
				d="M 0 0m 2.9868195 1.4934098 l -1.4934098 1.4934098 l -1.4934098 -1.4934098 l 1.4934098 -1.4934098 l 1.4934098 1.4934098 Z "
			/>
		</g>
	</defs>
</svg>

{#snippet arrayBodySvg(id: ArrowBody)}
	<svg
		viewBox="0 0 30 5"
		width="30pt"
		height="5pt"
		xmlns="http://www.w3.org/2000/svg"
		xmlns:xlink="http://www.w3.org/1999/xlink"
		class="w-24! text-card-foreground"
		><use transform="translate(15 2.5)" xlink:href={`#${arrowBodyMapping[id]}`} /></svg
	>
{/snippet}

{#snippet arrayHeadSvg(id: ArrowHead)}
	<svg
		viewBox="0 0 6 6"
		width="5pt"
		height="5pt"
		xmlns="http://www.w3.org/2000/svg"
		xmlns:xlink="http://www.w3.org/1999/xlink"
		class="text-card-foreground"
		><use transform="translate(3 3)" xlink:href={`#${arrowHeadMapping[id]}`} /></svg
	>
{/snippet}

<div class="@container/fields flex h-full flex-col gap-2 py-4">
	<!-- PAGE SETTINGS -->
	<Field.Set>
		<Field.Legend>Page</Field.Legend>
		<Field.Description>Customise page appearance.</Field.Description>
		<Field.Group
			class="grid grid-cols-1 items-start gap-x-6 gap-y-4 @lg/fields:grid-cols-2 @3xl/fields:grid-cols-3 @6xl/fields:grid-cols-4"
		>
			<Field.Field>
				<Field.Label for="page-show-title">Title Visibility</Field.Label>
				<ToggleGroup.Root
					type="single"
					variant="outline"
					bind:value={
						() => (styleConfig.current.page.showTitle ? 'shown' : 'hidden'),
						(next) => {
							if (next) styleConfig.current.page.showTitle = next === 'shown';
						}
					}
				>
					{#each titleOptions as option (option.value)}
						<ToggleGroup.Item
							name="page-show-title"
							value={option.value}
							aria-label={`Title ${option.label}`}
							class="data-[state=on]:bg-transparent data-[state=on]:*:[svg]:fill-primary data-[state=on]:*:[svg]:stroke-primary bg-secondary"
						>
							{@const Icon = option.icon}
							<Icon />
							{option.label}
						</ToggleGroup.Item>
					{/each}
				</ToggleGroup.Root>
			</Field.Field>

			<!-- Everything below describes the title, so it is dead while hidden. -->
			<SimpleField
				title="Title"
				name="page-title"
				bind:value={styleConfig.current.page.title}
				disabled={!styleConfig.current.page.showTitle}
			/>

			<SimpleField
				title="Caption"
				name="page-caption"
				bind:value={styleConfig.current.page.caption}
				placeholder="CONSORT flowchart of participant selection"
				disabled={!styleConfig.current.page.showTitle}
			/>

			<Field.Field>
				<Field.Label for="page-title-placement">Title Placement</Field.Label>
				<ToggleGroup.Root
					type="single"
					variant="outline"
					disabled={!styleConfig.current.page.showTitle}
					bind:value={
						() => styleConfig.current.page.titlePlacement,
						(next) => {
							if (next) styleConfig.current.page.titlePlacement = next as TitlePlacement;
						}
					}
				>
					{#each titlePlacementOptions as placement (placement)}
						<ToggleGroup.Item
							name="page-title-placement"
							value={placement}
							aria-label={`Title at ${placement}`}
							class="data-[state=on]:bg-transparent data-[state=on]:*:[svg]:fill-primary data-[state=on]:*:[svg]:stroke-primary bg-secondary"
						>
							{@const Icon = placement === 'top' ? ArrowUpIcon : ArrowDownIcon}
							<Icon />
							{placement.substring(0, 1).toUpperCase() + placement.substring(1)}
						</ToggleGroup.Item>
					{/each}
				</ToggleGroup.Root>

				<ToggleGroup.Root
					type="single"
					variant="outline"
					disabled={!styleConfig.current.page.showTitle}
					bind:value={
						() => styleConfig.current.page.titleAlign,
						(next) => {
							if (next) styleConfig.current.page.titleAlign = next as Alignment;
						}
					}
				>
					{#each aligmentOptions as alignment (alignment)}
						<ToggleGroup.Item
							name="page-title-aligment"
							value={alignment}
							aria-label={`Title aligned ${alignment}`}
							class="data-[state=on]:bg-transparent data-[state=on]:*:[svg]:fill-primary data-[state=on]:*:[svg]:stroke-primary bg-secondary"
						>
							{@const Icon = alignmentMapping[alignment]}
							<Icon />
							{alignment.substring(0, 1).toUpperCase() + alignment.substring(1)}
						</ToggleGroup.Item>
					{/each}
				</ToggleGroup.Root>
			</Field.Field>

			<Field.Field class="max-w-2xs">
				<Field.Label for="page-background">Background</Field.Label>
				<ToggleGroup.Root
					type="single"
					variant="outline"
					bind:value={
						() => (styleConfig.current.page.transparent ? 'transparent' : 'filled'),
						(next) => {
							// A single toggle group can deselect, which would otherwise
							// quietly mean "filled". Keep the current choice instead.
							if (next) styleConfig.current.page.transparent = next === 'transparent';
						}
					}
				>
					{#each backgroundOptions as option (option.value)}
						<ToggleGroup.Item
							name="page-background"
							value={option.value}
							aria-label={`Background ${option.label}`}
							class="data-[state=on]:*:[svg]:fill-primary data-[state=on]:*:[svg]:stroke-primary bg-secondary data-[state=on]:bg-transparent"
						>
							{@const Icon = option.icon}
							<Icon />
							{option.label}
						</ToggleGroup.Item>
					{/each}
				</ToggleGroup.Root>

				<ColorPicker
					bind:value={styleConfig.current.page.tint}
					disabled={styleConfig.current.page.transparent}
				/>
			</Field.Field>

			<Field.Field class="max-w-2xs">
				<Field.Label for="page-font">Font</Field.Label>
				<Select.Root name="page-font" type="single" bind:value={styleConfig.current.page.font}>
					<Select.Trigger>{styleConfig.current.page.font}</Select.Trigger>
					<Select.Content>
						{#each fontOptions as font (font)}
							<Select.Item value={font}>{font}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</Field.Field>

			<Field.Field class="max-w-2xs">
				<Field.Label for="page-thousand-separator">Thousands</Field.Label>
				<Select.Root
					name="page-thousand-separator"
					type="single"
					bind:value={styleConfig.current.page.thousandSeparator}
				>
					<Select.Trigger>
						<span class="tabular-nums"
							>{thousandSeparatorSample(styleConfig.current.page.thousandSeparator)}</span
						>
					</Select.Trigger>
					<Select.Content>
						{#each thousandSeparatorOptions as separator (separator)}
							<Select.Item value={separator}>
								<span class="tabular-nums">{thousandSeparatorSample(separator)}</span>
								<span class="text-muted-foreground ml-auto pl-4 text-xs capitalize"
									>{separator}</span
								>
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>

				<!--
					Whether four digits are grouped is the one case the separator alone
					does not settle: SI writes 1000 but 10 000. Paired with the separator
					rather than given its own field, because it is meaningless without
					one, and disabled when there is none for the same reason.
				-->
				<ToggleGroup.Root
					type="single"
					variant="outline"
					disabled={styleConfig.current.page.thousandSeparator === 'none'}
					bind:value={
						() => (styleConfig.current.page.groupFourDigits ? 'grouped' : 'plain'),
						(next) => {
							// A single toggle group can deselect, which would otherwise
							// quietly mean "grouped". Keep the current choice instead.
							if (next) styleConfig.current.page.groupFourDigits = next === 'grouped';
						}
					}
				>
					{#each [true, false] as grouped (grouped)}
						<ToggleGroup.Item
							name="page-group-four-digits"
							value={grouped ? 'grouped' : 'plain'}
							aria-label={grouped ? 'Group four-digit counts' : 'Leave four-digit counts ungrouped'}
							class="bg-secondary tabular-nums data-[state=on]:bg-transparent"
						>
							{fourDigitSample(styleConfig.current.page.thousandSeparator, grouped)}
						</ToggleGroup.Item>
					{/each}
				</ToggleGroup.Root>
			</Field.Field>

			<SimpleField
				title="Margin (mm)"
				name="page-margin"
				bind:value={styleConfig.current.page.margin}
				min={0}
			/>
		</Field.Group>
	</Field.Set>
	<Field.Separator class="my-2" />

	<!-- DIAGRAM SETTINGS -->
	<Field.Set>
		<Field.Legend>Diagram</Field.Legend>
		<Field.Description>Customise diagram appearance.</Field.Description>
		<Field.Group
			class="grid grid-cols-1 items-start gap-x-6 gap-y-4 @lg/fields:grid-cols-2 @3xl/fields:grid-cols-3 @6xl/fields:grid-cols-4"
		>
			{@render pairField('Spacing (pt)', [
				{
					name: 'diagram-spacing-x',
					label: 'Horizontal',
					get: () => styleConfig.current.diagram.spacingX,
					set: (next) => (styleConfig.current.diagram.spacingX = next as never),
					min: 0
				},
				{
					name: 'diagram-spacing-y',
					label: 'Vertical',
					get: () => styleConfig.current.diagram.spacingY,
					set: (next) => (styleConfig.current.diagram.spacingY = next as never),
					min: 0
				}
			])}

			{@render pairField('Minimum Cell Size (mm)', [
				{
					name: 'diagram-cell-width',
					label: 'Width',
					get: () => styleConfig.current.diagram.cellWidth,
					set: (next) => (styleConfig.current.diagram.cellWidth = next as never),
					min: 0
				},
				{
					name: 'diagram-cell-height',
					label: 'Height',
					get: () => styleConfig.current.diagram.cellHeight,
					set: (next) => (styleConfig.current.diagram.cellHeight = next as never),
					min: 0
				}
			])}
		</Field.Group>
	</Field.Set>
	<Field.Separator class="my-2" />

	<!-- NODE SETTINGS -->
	<Field.Set>
		<Field.Legend>Nodes</Field.Legend>
		<Field.Description>Customise general node appearance.</Field.Description>
		<Field.Group
			class="grid grid-cols-1 items-start gap-x-6 gap-y-4 @lg/fields:grid-cols-2 @3xl/fields:grid-cols-3 @6xl/fields:grid-cols-4"
		>
			{@render pairField('Node Border (pt)', [
				{
					name: 'node-stroke',
					label: 'Stroke',
					get: () => styleConfig.current.node.stroke,
					set: (next) => (styleConfig.current.node.stroke = next as never),
					min: 0
				},
				{
					name: 'node-corner-radius',
					label: 'Corner Radius',
					get: () => styleConfig.current.node.cornerRadius,
					set: (next) => (styleConfig.current.node.cornerRadius = next as never),
					min: 0
				}
			])}

			{@render pairField('Node Spacing (pt)', [
				{
					name: 'node-inset',
					label: 'Inset',
					get: () => styleConfig.current.node.inset,
					set: (next) => (styleConfig.current.node.inset = next as never),
					min: 0
				},
				{
					name: 'node-outset',
					label: 'Outset',
					get: () => styleConfig.current.node.outset,
					set: (next) => (styleConfig.current.node.outset = next as never),
					min: 0
				}
			])}
		</Field.Group>
	</Field.Set>
	<Field.Separator class="my-2" />

	<!-- EDGE SETTINGS -->
	<Field.Set>
		<Field.Legend>Edges</Field.Legend>
		<Field.Description>Customise general edge appearance.</Field.Description>
		<Field.Group
			class="grid grid-cols-1 items-start gap-x-6 gap-y-4 @lg/fields:grid-cols-2 @3xl/fields:grid-cols-3 @6xl/fields:grid-cols-4"
		>
			{@render pairField('Edge Line (pt)', [
				{
					name: 'edge-stroke',
					label: 'Stroke',
					get: () => styleConfig.current.edge.stroke,
					set: (next) => (styleConfig.current.edge.stroke = next as never),
					min: 0
				},
				{
					name: 'edge-corner-radius',
					label: 'Corner Radius',
					get: () => styleConfig.current.edge.cornerRadius,
					set: (next) => (styleConfig.current.edge.cornerRadius = next as never),
					min: 0
				}
			])}
		</Field.Group>
	</Field.Set>
	<Field.Separator class="my-2" />

	<!-- MARK SETTINGS -->
	<Field.Set>
		<Field.Legend>Arrow</Field.Legend>
		<Field.Description>Customise general arrow appearance.</Field.Description>
		<Field.Group
			class="grid grid-cols-1 items-start gap-x-6 gap-y-4 @lg/fields:grid-cols-2 @3xl/fields:grid-cols-3 @6xl/fields:grid-cols-4"
		>
			<!-- Body and head compose a single arrow, so neither means much alone. -->
			<Field.Field class="max-w-2xs">
				<Field.Label>Arrow</Field.Label>
				<div class="flex items-end gap-2">
					<div class="flex min-w-0 flex-1 flex-col gap-1.5">
						<Field.Label class="text-muted-foreground text-xs font-normal">Body</Field.Label>
						<Select.Root type="single" bind:value={arrowBody} onValueChange={arrowUpdate}>
							<Select.Trigger>{@render arrayBodySvg(arrowBody)}</Select.Trigger>
							<Select.Content>
								{#each arrowBodies as body (body)}
									<Select.Item value={body}>{@render arrayBodySvg(body)}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<div class="flex min-w-0 flex-1 flex-col gap-1.5">
						<Field.Label class="text-muted-foreground text-xs font-normal">Head</Field.Label>
						<Select.Root type="single" bind:value={arrowHead} onValueChange={arrowUpdate}>
							<Select.Trigger>{@render arrayHeadSvg(arrowHead)}</Select.Trigger>
							<Select.Content>
								{#each arrowHeads as head (head)}
									<Select.Item value={head}>{@render arrayHeadSvg(head)}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				</div>
			</Field.Field>

			<SimpleField
				title="Arrow Mark Scale (%)"
				name="edge-corner-radius"
				bind:value={styleConfig.current.mark.markScale}
				min={0}
				max={300}
			/>
		</Field.Group>
	</Field.Set>
	<Field.Separator class="my-2" />

	<!-- MAIN BOX -->
	<Field.Set>
		<Field.Legend>Main Box</Field.Legend>
		<Field.Description>Customise main box appearance.</Field.Description>
		<Field.Group
			class="grid grid-cols-1 items-start gap-x-6 gap-y-4 @lg/fields:grid-cols-2 @3xl/fields:grid-cols-3 @6xl/fields:grid-cols-4"
		>
			<Field.Field class="max-w-2xs">
				<Field.Label>Tint</Field.Label>
				<ColorPicker bind:value={styleConfig.current.mainBox.tint} />
			</Field.Field>

			<SimpleField
				title="Width (mm)"
				name="mainbox-width"
				bind:value={styleConfig.current.mainBox.width}
				min={0}
			/>

			{@render weightToggle(
				'mainbox-label-weight',
				'Label Weight',
				() => styleConfig.current.mainBox.labelBold,
				(bold) => (styleConfig.current.mainBox.labelBold = bold)
			)}

			<Field.Field>
				<Field.Label for="mainbox-value">Value</Field.Label>
				<ToggleGroup.Root
					type="single"
					variant="outline"
					bind:value={
						() => (styleConfig.current.mainBox.showValue ? 'shown' : 'hidden'),
						(next) => {
							if (next) styleConfig.current.mainBox.showValue = next === 'shown';
						}
					}
				>
					{#each valueVisibilityOptions as option (option.value)}
						<ToggleGroup.Item
							name="mainbox-value"
							value={option.value}
							aria-label={`Value ${option.label}`}
							class="data-[state=on]:bg-transparent data-[state=on]:*:[svg]:fill-primary data-[state=on]:*:[svg]:stroke-primary bg-secondary"
						>
							{@const Icon = option.icon}
							<Icon />
							{option.label}
						</ToggleGroup.Item>
					{/each}
				</ToggleGroup.Root>
			</Field.Field>

			{@render weightToggle(
				'mainbox-value-weight',
				'Value Weight',
				() => styleConfig.current.mainBox.valueBold,
				(bold) => (styleConfig.current.mainBox.valueBold = bold),
				!styleConfig.current.mainBox.showValue
			)}

			{@render alignToggle(
				'mainbox-text-aligment',
				'Text Aligment',
				() => styleConfig.current.mainBox.textAlign,
				(next) => (styleConfig.current.mainBox.textAlign = next)
			)}

			{@render valueAlignToggle(
				'mainbox-value-aligment',
				'Value Aligment',
				() => styleConfig.current.mainBox.valueAlign,
				(next) => (styleConfig.current.mainBox.valueAlign = next),
				!styleConfig.current.mainBox.showValue
			)}

			{@render pairField(
				'Value Affixes',
				[
					{
						name: 'mainbox-value-prefix',
						label: 'Prefix',
						get: () => styleConfig.current.mainBox.valuePrefix,
						set: (next) => (styleConfig.current.mainBox.valuePrefix = next as never)
					},
					{
						name: 'mainbox-value-suffix',
						label: 'Suffix',
						get: () => styleConfig.current.mainBox.valueSuffix,
						set: (next) => (styleConfig.current.mainBox.valueSuffix = next as never)
					}
				],
				!styleConfig.current.mainBox.showValue
			)}

			{@render weightToggle(
				'mainbox-subpop-label-weight',
				'Sub-Population Label Weight',
				() => styleConfig.current.mainBox.subPopulationLabelBold,
				(bold) => (styleConfig.current.mainBox.subPopulationLabelBold = bold)
			)}

			{@render weightToggle(
				'mainbox-subpop-value-weight',
				'Sub-Population Value Weight',
				() => styleConfig.current.mainBox.subPopulationValueBold,
				(bold) => (styleConfig.current.mainBox.subPopulationValueBold = bold),
				!styleConfig.current.mainBox.showSubPopulationValue
			)}

			<Field.Field>
				<Field.Label for="mainbox-subpop-value">Sub-Population Value</Field.Label>
				<ToggleGroup.Root
					type="single"
					variant="outline"
					bind:value={
						() => (styleConfig.current.mainBox.showSubPopulationValue ? 'shown' : 'hidden'),
						(next) => {
							if (next) styleConfig.current.mainBox.showSubPopulationValue = next === 'shown';
						}
					}
				>
					{#each valueVisibilityOptions as option (option.value)}
						<ToggleGroup.Item
							name="mainbox-subpop-value"
							value={option.value}
							aria-label={`Sub-population value ${option.label}`}
							class="data-[state=on]:bg-transparent data-[state=on]:*:[svg]:fill-primary data-[state=on]:*:[svg]:stroke-primary bg-secondary"
						>
							{@const Icon = option.icon}
							<Icon />
							{option.label}
						</ToggleGroup.Item>
					{/each}
				</ToggleGroup.Root>
			</Field.Field>

			{@render alignToggle(
				'mainbox-subpop-text-aligment',
				'Sub-Population Text Aligment',
				() => styleConfig.current.mainBox.subPopulationTextAlign,
				(next) => (styleConfig.current.mainBox.subPopulationTextAlign = next)
			)}

			{@render valueAlignToggle(
				'mainbox-subpop-aligment',
				'Sub-Population Aligment',
				() => styleConfig.current.mainBox.subPopulationAlign,
				(next) => (styleConfig.current.mainBox.subPopulationAlign = next),
				!styleConfig.current.mainBox.showSubPopulationValue
			)}

			{@render pairField(
				'Sub-Population Affixes',
				[
					{
						name: 'mainbox-subpop-prefix',
						label: 'Prefix',
						get: () => styleConfig.current.mainBox.subPopulationPrefix,
						set: (next) => (styleConfig.current.mainBox.subPopulationPrefix = next as never)
					},
					{
						name: 'mainbox-subpop-suffix',
						label: 'Suffix',
						get: () => styleConfig.current.mainBox.subPopulationSuffix,
						set: (next) => (styleConfig.current.mainBox.subPopulationSuffix = next as never)
					}
				],
				!styleConfig.current.mainBox.showSubPopulationValue
			)}

			<SimpleField
				title="Sub-Population Indent (spaces)"
				name="mainbox-subpop-indent"
				bind:value={styleConfig.current.mainBox.subPopulationIndent}
				min={0}
			/>
		</Field.Group>
	</Field.Set>
	<Field.Separator class="my-2" />

	<!-- STEP BOX -->
	<Field.Set>
		<Field.Legend>Step Box</Field.Legend>
		<Field.Description>Customise step box appearance.</Field.Description>
		<Field.Group
			class="grid grid-cols-1 items-start gap-x-6 gap-y-4 @lg/fields:grid-cols-2 @3xl/fields:grid-cols-3 @6xl/fields:grid-cols-4"
		>
			<Field.Field class="max-w-2xs">
				<Field.Label>Tint</Field.Label>
				<ColorPicker bind:value={styleConfig.current.stepBox.tint} />
			</Field.Field>

			<SimpleField
				title="Width (mm)"
				name="stepbox-width"
				bind:value={styleConfig.current.stepBox.width}
				min={0}
			/>

			{@render weightToggle(
				'stepbox-delta-label-weight',
				'Delta Label Weight',
				() => styleConfig.current.stepBox.deltaLabelBold,
				(bold) => (styleConfig.current.stepBox.deltaLabelBold = bold)
			)}

			{@render weightToggle(
				'stepbox-delta-value-weight',
				'Delta Value Weight',
				() => styleConfig.current.stepBox.deltaValueBold,
				(bold) => (styleConfig.current.stepBox.deltaValueBold = bold)
			)}

			{@render alignToggle(
				'stepbox-delta-text-aligment',
				'Delta Text Aligment',
				() => styleConfig.current.stepBox.deltaTextAlign,
				(next) => (styleConfig.current.stepBox.deltaTextAlign = next)
			)}

			{@render valueAlignToggle(
				'stepbox-delta-aligment',
				'Delta Aligment',
				() => styleConfig.current.stepBox.deltaAlign,
				(next) => (styleConfig.current.stepBox.deltaAlign = next)
			)}

			{@render pairField('Delta Affixes', [
				{
					name: 'stepbox-delta-prefix',
					label: 'Prefix',
					get: () => styleConfig.current.stepBox.deltaPrefix,
					set: (next) => (styleConfig.current.stepBox.deltaPrefix = next as never)
				},
				{
					name: 'stepbox-delta-suffix',
					label: 'Suffix',
					get: () => styleConfig.current.stepBox.deltaSuffix,
					set: (next) => (styleConfig.current.stepBox.deltaSuffix = next as never)
				}
			])}

			{@render weightToggle(
				'stepbox-subdelta-label-weight',
				'Sub-Delta Label Weight',
				() => styleConfig.current.stepBox.subDeltaLabelBold,
				(bold) => (styleConfig.current.stepBox.subDeltaLabelBold = bold)
			)}

			{@render weightToggle(
				'stepbox-subdelta-value-weight',
				'Sub-Delta Value Weight',
				() => styleConfig.current.stepBox.subDeltaValueBold,
				(bold) => (styleConfig.current.stepBox.subDeltaValueBold = bold),
				!styleConfig.current.stepBox.showSubDeltaValue
			)}

			<Field.Field>
				<Field.Label for="stepbox-subdelta-value">Sub-Delta Value</Field.Label>
				<ToggleGroup.Root
					type="single"
					variant="outline"
					bind:value={
						() => (styleConfig.current.stepBox.showSubDeltaValue ? 'shown' : 'hidden'),
						(next) => {
							if (next) styleConfig.current.stepBox.showSubDeltaValue = next === 'shown';
						}
					}
				>
					{#each valueVisibilityOptions as option (option.value)}
						<ToggleGroup.Item
							name="stepbox-subdelta-value"
							value={option.value}
							aria-label={`Sub-delta value ${option.label}`}
							class="data-[state=on]:bg-transparent data-[state=on]:*:[svg]:fill-primary data-[state=on]:*:[svg]:stroke-primary bg-secondary"
						>
							{@const Icon = option.icon}
							<Icon />
							{option.label}
						</ToggleGroup.Item>
					{/each}
				</ToggleGroup.Root>
			</Field.Field>

			{@render alignToggle(
				'stepbox-subdelta-text-aligment',
				'Sub-Delta Text Aligment',
				() => styleConfig.current.stepBox.subDeltaTextAlign,
				(next) => (styleConfig.current.stepBox.subDeltaTextAlign = next)
			)}

			{@render valueAlignToggle(
				'stepbox-subdelta-aligment',
				'Sub-Delta Aligment',
				() => styleConfig.current.stepBox.subDeltaAlign,
				(next) => (styleConfig.current.stepBox.subDeltaAlign = next),
				!styleConfig.current.stepBox.showSubDeltaValue
			)}

			{@render pairField(
				'Sub-Delta Affixes',
				[
					{
						name: 'stepbox-subdelta-prefix',
						label: 'Prefix',
						get: () => styleConfig.current.stepBox.subDeltaPrefix,
						set: (next) => (styleConfig.current.stepBox.subDeltaPrefix = next as never)
					},
					{
						name: 'stepbox-subdelta-suffix',
						label: 'Suffix',
						get: () => styleConfig.current.stepBox.subDeltaSuffix,
						set: (next) => (styleConfig.current.stepBox.subDeltaSuffix = next as never)
					}
				],
				!styleConfig.current.stepBox.showSubDeltaValue
			)}

			<SimpleField
				title="Sub-Delta Indent (spaces)"
				name="stepbox-subdelta-indent"
				bind:value={styleConfig.current.stepBox.subDeltaIndent}
				min={0}
			/>

			<!-- Marker and formatting compose one numbering pattern. -->
			<Field.Field class="max-w-2xs">
				<Field.Label>Sub-Delta Numbering</Field.Label>
				<div class="flex items-end gap-2">
					<div class="flex min-w-0 flex-1 flex-col gap-1.5">
						<Field.Label
							for="stepbox-subdelta-numbering-body"
							class="text-muted-foreground text-xs font-normal"
						>
							Marker
						</Field.Label>
						<Select.Root
							name="stepbox-subdelta-numbering-body"
							type="single"
							value={numberingBody || 'None'}
							onValueChange={(value) => {
								numberingBody = (value === 'None' ? null : value) as NumberingBody;
								numberingUpdate();
							}}
						>
							<Select.Trigger>{numberingBody || 'None'}</Select.Trigger>
							<Select.Content>
								{#each [...numberingBodyOptions, ...subDeltaMarkerOptions] as option (option)}
									<Select.Item value={option || 'None'}>{option || 'None'}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<div class="flex min-w-0 flex-1 flex-col gap-1.5">
						<Field.Label
							for="stepbox-subdelta-numbering-formatting"
							class="text-muted-foreground text-xs font-normal"
						>
							Formatting
						</Field.Label>
						<Select.Root
							name="stepbox-subdelta-numbering-formatting"
							type="single"
							disabled={isMarker}
							value={numberingFormatting || 'None'}
							onValueChange={(value) => {
								numberingFormatting = (value === 'None' ? null : value) as NumberingFormatting;
								numberingUpdate();
							}}
						>
							<Select.Trigger>{numberingFormatting || 'None'}</Select.Trigger>
							<Select.Content>
								{#each numberingFormattingOptions as format (format)}
									<Select.Item value={format || 'None'}>
										{format ? format.substring(0, 1).toUpperCase() + format.substring(1) : 'None'}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				</div>
			</Field.Field>
		</Field.Group>
	</Field.Set>
	<Field.Separator class="my-2" />

	<!-- GROUP BOX -->
	<Field.Set>
		<Field.Legend>Group Box</Field.Legend>
		<Field.Description>Customise group box appearance.</Field.Description>
		<Field.Group
			class="grid grid-cols-1 items-start gap-x-6 gap-y-4 @lg/fields:grid-cols-2 @3xl/fields:grid-cols-3 @6xl/fields:grid-cols-4"
		>
			<Field.Field class="max-w-2xs">
				<Field.Label>Tint</Field.Label>
				<ColorPicker bind:value={styleConfig.current.groupBox.tint} />
			</Field.Field>
		</Field.Group>
	</Field.Set>

	<Button variant="outline" class="self-end" onclick={restoreDefaults}>Restore defaults</Button>
</div>
