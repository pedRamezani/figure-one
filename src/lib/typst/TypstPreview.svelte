<script lang="ts">
	import { onMount } from 'svelte';

	import { useSvelteFlow } from '@xyflow/svelte';
	import TypstDocument from './TypstDocument.svelte';

	import { convertFlowchartToTypstJson, downloadBlob } from './index.ts';

	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
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

	// PDF Download
	let compilePdf = $state<(() => Promise<Uint8Array<ArrayBufferLike> | undefined>) | undefined>();
	const exportPdf = (pdfData: Uint8Array<ArrayBufferLike> | undefined) => {
		if (!pdfData) return;

		const pdfDataCopy = new Uint8Array(pdfData.length);
		pdfDataCopy.set(pdfData);

		downloadBlob(pdfDataCopy, 'application/pdf', 'flowchart.pdf');
	};

	const downloadPdf = () => {
		if (compilePdf) {
			compilePdf().then((pdfData) => {
				exportPdf(pdfData);
			});
		}
	};

	// SVG Download
	let currentSvg: string | undefined = $state();
	const exportSvg = (mainContent: string | undefined) => {
		if (!mainContent) return;

		downloadBlob(mainContent, 'application/svg+xml', 'flowchart.svg');
	};

	const downloadSvg = () => {
		exportSvg(currentSvg);
	};

	// Select options
	const DOWNLOAD_TYPES = [
		{
			value: 'svg',
			icon: ImageDownloadIcon,
			label: 'SVG'
		},
		{
			value: 'pdf',
			icon: FileDownIcon,
			label: 'PDF'
		}
	];
	let downloadType = $state('pdf');
	let disabled = $derived.by(() => {
		if (downloadType == 'pdf') {
			return !compilePdf;
		}

		if (downloadType == 'svg') {
			return !currentSvg;
		}

		return false;
	});
	let onclick = $derived.by(() => {
		if (downloadType == 'pdf') {
			return downloadPdf;
		}

		if (downloadType == 'svg') {
			return downloadSvg;
		}

		return () => {};
	});
</script>

<div class="flex flex-col h-full gap-2">
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
		<Button variant="outline" {disabled} {onclick}
			>Download {DOWNLOAD_TYPES.find((option) => option.value == downloadType)?.label}</Button
		>
		<Select.Root type="single" bind:value={downloadType} required={true}>
			<Select.Trigger class="font-mono" />
			<Select.Content class="min-w-24">
				{#each DOWNLOAD_TYPES as downloadOption (downloadOption.value)}
					<Select.Item value={downloadOption.value}>
						<svelte:component this={downloadOption.icon} />
						<span class="text-muted-foreground">{downloadOption.label}</span>
					</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
	</ButtonGroup.Root>
</div>
