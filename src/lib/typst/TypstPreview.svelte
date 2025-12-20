<script lang="ts">
	import { onMount } from 'svelte';

	import { useSvelteFlow } from '@xyflow/svelte';
	import TypstDocument from './TypstDocument.svelte';

	import { convertFlowchartToTypstJson } from './index.ts';

	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
	import { Button } from '@/components/ui/button/index.js';
	import ImageDownloadIcon from '@lucide/svelte/icons/image-down';
	import FileDownIcon from '@lucide/svelte/icons/file-down';

	const { toObject } = useSvelteFlow();
	const jsonData = $derived(convertFlowchartToTypstJson(toObject()));
	const encoder = new TextEncoder();
	const encodedJsonData = $derived(encoder.encode(JSON.stringify(jsonData)));

	let source: string | undefined = $state();
	onMount(() => {
		fetch('figure1.typ').then((response) => response.text().then((text) => (source = text)));
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

	<ButtonGroup.Root class="self-end" aria-label="Download options">
		<Button variant="outline" disabled={!currentSvg} onclick={downloadSvg}>
			<ImageDownloadIcon /> Download SVG
		</Button>

		<Button variant="outline" disabled={!compilePdf} onclick={downloadPdf}
			><FileDownIcon />Download PDF</Button
		>
	</ButtonGroup.Root>
</div>
