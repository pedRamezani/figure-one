<script lang="ts">
	import { onMount } from 'svelte';

	import { useSvelteFlow } from '@xyflow/svelte';
	import TypstDocument from './TypstDocument.svelte';

	import { convertFlowchartToTypstJson } from './index.ts';

	import { Button } from '@/components/ui/button/index.js';

	const { toObject } = useSvelteFlow();
	const jsonData = $derived(convertFlowchartToTypstJson(toObject()));
	const encoder = new TextEncoder();
	const encodedJsonData = $derived(encoder.encode(JSON.stringify(jsonData)));

	let source: string | undefined = $state();
	onMount(() => {
		(async () => {
			source = await fetch('figure1.typ').then((response) => response.text());
		})();
	});

	let currentSvg: string | undefined = $state();
	const exportSvg = (mainContent: string | undefined) => {
		if (!mainContent) return;

		const blob = new Blob([mainContent], { type: 'image/svg+xml' });

		// Creates element with <a> tag
		const link = document.createElement('a');

		// Sets file content in the object URL
		link.href = URL.createObjectURL(blob);

		// Sets file name
		link.download = 'flowchart.svg';

		// Triggers a click event to <a> tag to save file.
		// document.body.appendChild(link);
		link.click();
		// document.body.removeChild(link);
		URL.revokeObjectURL(link.href);
	};
</script>

<div class="flex flex-col h-full">
	<h2 class="font-bold text-xl mb-2">Typst preview</h2>

	<TypstDocument
		{source}
		sourceShadowMappings={{ '/assets/flowchart.json': encodedJsonData }}
		onSvgChange={(svg) => {
			currentSvg = svg;
		}}
		class="grow"
	/>

	<Button
		variant="outline"
		class="mt-4 self-end"
		disabled={!currentSvg}
		onclick={() => {
			exportSvg(currentSvg);
		}}>Download SVG</Button
	>
</div>
