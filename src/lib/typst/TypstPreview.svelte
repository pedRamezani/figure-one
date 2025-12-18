<script lang="ts">
	import { onMount } from 'svelte';

	import { useSvelteFlow } from '@xyflow/svelte';
	import TypstDocument from './TypstDocument.svelte';

	import { convertFlowchartToTypstJson } from './index.ts';

	const { toObject } = useSvelteFlow();
	const jsonData = $derived(convertFlowchartToTypstJson(toObject()));
	const encoder = new TextEncoder();
	const encodedJsonData = $derived(encoder.encode(JSON.stringify(jsonData)));

	let source: string | undefined = $state();
	onMount(async () => {
		source = await fetch('figure1.typ').then((response) => response.text());
	});
</script>

<h2 class="font-bold text-xl mb-2">Typst preview</h2>

<TypstDocument {source} sourceShadowMappings={{ '/assets/flowchart.json': encodedJsonData }} />
