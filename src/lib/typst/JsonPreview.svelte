<script lang="ts">
	import { useSvelteFlow } from '@xyflow/svelte';
	import { convertFlowchartToTypstJson } from './index.ts';

	// JSON encode
	const { toObject } = useSvelteFlow();

	const flowchartStringified = $derived.by(() => {
		const raw = toObject();
		const output = convertFlowchartToTypstJson(raw);
		return JSON.stringify(output, null, 2);
	});
</script>

<h2 class="font-bold text-xl mb-2">JSON preview</h2>
<pre class="overflow-y-auto">{flowchartStringified}</pre>
