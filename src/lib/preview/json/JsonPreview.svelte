<script lang="ts">
	import { useSvelteFlow, useNodes, useEdges } from '@xyflow/svelte';
	import {
		convertFlowchartToTypstFlowchartData,
		isFlowchartData,
		parseTypstFlowchartJSON
	} from './index.ts';

	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
	import Button from '@/components/ui/button/button.svelte';

	import { downloadBlob } from '../../index.ts';
	import { getLayoutedElements } from '../flow/index.ts';

	const { toObject, fitView } = useSvelteFlow();

	// Import / Export JSON
	const nodes = useNodes();
	const edges = useEdges();
	function importJSON(): void {
		const fileInput = document.createElement('input');
		fileInput.type = 'file';
		fileInput.onchange = (event) => {
			const target = event.target as HTMLInputElement | null;
			if (target === null) return;

			const file = target.files ? target.files[0] : null;
			if (file === null) return;
			if (file.type !== 'application/json') return;

			new Response(file).json().then((json) => {
				if (!isFlowchartData(json)) return;
				const parsed = parseTypstFlowchartJSON(json);
				nodes.set(parsed.nodes);
				edges.set(parsed.edges);

				setTimeout(function () {
					const layouted = getLayoutedElements(nodes.current, edges.current);
					nodes.set(layouted.nodes);
					edges.set(layouted.edges);
					fitView();
				}, 500);
			});
		};
		fileInput.click();
	}

	function exportJSON(): void {
		downloadBlob(flowchartStringified, 'application/json', 'flowchart.json');
	}

	// JSON encode
	const flowchartStringified = $derived.by<string>(() => {
		const raw = toObject();
		const output = convertFlowchartToTypstFlowchartData(raw);
		return JSON.stringify(output, null, 2);
	});
</script>

<div class="flex flex-col h-full gap-2 py-4">
	<pre class="overflow-y-auto grow">{flowchartStringified}</pre>
	<ButtonGroup.Root class="self-end" aria-label="Download options">
		<Button class="self-end" variant="outline" onclick={importJSON}>Import JSON</Button>
		<Button class="self-end" variant="outline" onclick={exportJSON}>Export JSON</Button>
	</ButtonGroup.Root>
</div>
