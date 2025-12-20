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

	let compilePdf = $state<(() => Promise<Uint8Array<ArrayBufferLike> | undefined>) | undefined>();
	const exportPdf = (pdfData: Uint8Array<ArrayBufferLike> | undefined) => {
		if (!pdfData) return;

		const pdfDataCopy = new Uint8Array(pdfData.length);
		pdfDataCopy.set(pdfData);
		const blob = new Blob([pdfDataCopy], { type: 'application/pdf' });

		// Creates element with <a> tag
		const link = document.createElement('a');

		// Sets file content in the object URL
		link.href = URL.createObjectURL(blob);

		// Sets file name
		link.download = 'flowchart.pdf';

		// Triggers a click event to <a> tag to save file.
		// document.body.appendChild(link);
		link.click();
		// document.body.removeChild(link);
		URL.revokeObjectURL(link.href);
	};
	const downloadPdf = () => {
		if (compilePdf) {
			compilePdf().then((pdfData) => {
				exportPdf(pdfData);
			});
		}
	};

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
	const downloadSvg = () => {
		exportSvg(currentSvg);
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
		bind:compilePdf
		class="grow"
	/>

	<div class="flex gap-4 mt-4 self-end">
		<Button variant="outline" disabled={!currentSvg} onclick={downloadSvg}>Download SVG</Button>

		<Button variant="outline" disabled={!compilePdf} onclick={downloadPdf}>Download PDF</Button>
	</div>
</div>
