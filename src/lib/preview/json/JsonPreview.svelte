<script lang="ts">
	import { useSvelteFlow, useNodes, useEdges } from '@xyflow/svelte';
	import { convertFlowchartToTypstFlowchartData, parseTypstFlowchartJSON } from './convert.ts';

	import { createProfile, isProfile } from '../../index.ts';
	import { styleConfig } from '../style/style-config.svelte.ts';

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
				if (!isProfile(json)) return;
				styleConfig.current = json.config;
				const parsed = parseTypstFlowchartJSON(json.data);
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
		downloadBlob(profileStringified, 'application/json', 'flowchart.json');
	}

	// JSON encode
	const profileStringified = $derived.by<string>(() => {
		const raw = toObject();
		const data = convertFlowchartToTypstFlowchartData(raw);
		const profile = createProfile(data, styleConfig.current);
		return JSON.stringify(profile, null, 2);
	});
</script>

<div class="flex flex-col h-full gap-2 py-4">
	<pre class="overflow-y-auto grow">{profileStringified}</pre>
	<ButtonGroup.Root class="self-end" aria-label="Download options">
		<Button class="self-end" variant="outline" onclick={importJSON}>Import JSON</Button>
		<Button class="self-end" variant="outline" onclick={exportJSON}>Export JSON</Button>
	</ButtonGroup.Root>
</div>
