<script lang="ts">
	import { useSvelteFlow } from '@xyflow/svelte';
	import { convertFlowchartToTypstJson } from './index.ts';

	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
	import Button from '@/components/ui/button/button.svelte';

	import { downloadBlob } from './index.ts';

	function isValidJSON(file: File) {
		// TODO
	}

	function importJSON(): void {
		const fileInput = document.createElement('input');
		fileInput.type = 'file';
		fileInput.onchange = (event) => {
			const target = event.target as HTMLInputElement | null;
			if (target === null) return;

			const file = target.files ? target.files[0] : null;
			if (file === null) return;

			console.log(file.name);
		};
		fileInput.click();
	}

	function exportJSON(): void {
		downloadBlob(flowchartStringified, 'application/json', 'flowchart.json');
	}

	// JSON encode
	const { toObject } = useSvelteFlow();

	const flowchartStringified = $derived.by(() => {
		const raw = toObject();
		const output = convertFlowchartToTypstJson(raw);
		return JSON.stringify(output, null, 2);
	});
</script>

<div class="flex flex-col h-full">
	<h2 class="font-bold text-xl mb-2">JSON preview</h2>
	<pre class="overflow-y-auto grow">{flowchartStringified}</pre>
	<ButtonGroup.Root class="self-end" aria-label="Download options">
		<Button class="self-end" variant="outline" onclick={importJSON}>Import JSON</Button>
		<Button class="self-end" variant="outline" onclick={exportJSON}>Export JSON</Button>
	</ButtonGroup.Root>
</div>
