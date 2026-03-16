<script lang="ts">
	import type { Attachment } from 'svelte/attachments';

	import Input from '../input/input.svelte';

	import ColorPicker from './colorpicker.min.js';
	import './colorpicker.css';

	let { value = $bindable('white') }: { value: string } = $props();

	// let pickerSetter = $state<(value: string) => void>(() => {});

	const tintMapping = {
		black: '#000000',
		gray: '#dddddd',
		silver: '#f1f1f1',
		white: '#ffffff',
		navy: '#001f3f',
		blue: '#0074d9',
		aqua: '#7fdbff',
		teal: '#39cccc',
		eastern: '#239dad',
		purple: '#b10dc9',
		fuchsia: '#f012be',
		maroon: '#85144b',
		red: '#ff4136',
		orange: '#ff851b',
		yellow: '#ffdc00',
		olive: '#3d9970',
		green: '#2ecc40',
		lime: '#01ff70'
	};

	function swatchPicker(swatchMapping: Record<string, string> = {}): Attachment {
		const swatchToHex = (value: string): string => {
			if (value in swatchMapping) {
				return swatchMapping[value];
			} else {
				return value;
			}
		};

		const revertedMapping = Object.fromEntries(
			Object.entries(swatchMapping).map(([k, v]) => [v, k])
		);

		const hexToSwatch = (value: string): string => {
			if (value in revertedMapping) {
				return revertedMapping[value];
			} else {
				return value;
			}
		};

		return (element: Element) => {
			let currentValue = (element as HTMLInputElement).value;
			let convertedValue = swatchToHex(currentValue);
			if (currentValue !== convertedValue) {
				(element as HTMLInputElement).value = convertedValue;
			}

			const picker = new ColorPicker(element, {
				toggleStyle: 'input',
				color: null,
				swatches: Object.values(swatchMapping),
				enableAlpha: false,
				enableEyedropper: true,
				// submitMode: 'instant',
				submitMode: 'confirm',
				showClearButton: false
			});
			// pickerSetter = (value) => {
			// 	const hex = swatchToHex(value);
			// 	if (picker.color.string('hex') !== hex) {
			// 		picker.setColor(hex);
			// 	}
			// };

			currentValue = (element as HTMLInputElement).value;
			convertedValue = hexToSwatch(picker.color.string('hex'));
			if (currentValue !== convertedValue) {
				// Sync value with picker
				(element as HTMLInputElement).value = convertedValue;
			}

			// @ts-ignore
			picker.on('pick', (color) => (value = hexToSwatch(color.string('hex'))));

			// return picker.destroy;
		};
	}

	// $effect(() => {
	// 	pickerSetter(value);
	// });

	// $inspect(value);
</script>

<!-- NOTE: Will not use type color to display typst color names when possible -->
<Input {@attach swatchPicker(tintMapping)} {value} type="text" />
