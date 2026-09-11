<script lang="ts">
	import { onMount } from 'svelte';

	import TypstDocument from './TypstDocument.svelte';

	import { convertFlowchartToTypstFlowchartData } from '../json/convert.ts';

	import { exporters } from '@/document/exporters.svelte';
	import { hydrateGraph } from '@/document/graph-schema';
	import { flowchartDocument } from '@/document/store.svelte';

	// Rendering only. The download buttons moved to the single export menu next
	// to the project name, so that one name governs all four artifacts; this
	// component registers what it can produce and the menu offers it.

	const flowchartData = $derived(
		convertFlowchartToTypstFlowchartData(hydrateGraph(flowchartDocument.snapshot().graph))
	);

	const encoder = new TextEncoder();
	const encodedFlowchartJsonData = $derived(encoder.encode(JSON.stringify(flowchartData)));
	const encodedStyleConfigData = $derived(encoder.encode(JSON.stringify(flowchartDocument.config)));

	let source: string | undefined = $state();
	onMount(() => {
		fetch('figure1.typ').then((response) => response.text().then((text) => (source = text)));
	});

	let compilePdf = $state<(() => Promise<Uint8Array<ArrayBufferLike> | undefined>) | undefined>();
	let currentSvg: string | undefined = $state();

	$effect(() => {
		exporters.compilePdf = compilePdf ?? null;
	});

	$effect(() => {
		exporters.svg = currentSvg ?? null;
	});
</script>

<div class="flex flex-col h-full gap-2 py-4">
	<TypstDocument
		{source}
		sourceShadowMappings={{
			'/assets/flowchart.json': encodedFlowchartJsonData,
			'/assets/style.json': encodedStyleConfigData
		}}
		onSvgChange={(svg) => {
			currentSvg = svg;
		}}
		bind:compilePdf
		class="grow"
	/>
</div>
