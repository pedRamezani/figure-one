<script lang="ts">
	import { SvelteFlowProvider } from '@xyflow/svelte';
	import Flow from '@/flow/Flow.svelte';
	import JsonPreview from '@/typst/JsonPreview.svelte';
	import TypstPreview from '@/typst/TypstPreview.svelte';
</script>

<div class="flex w-screen h-screen">
	<!-- fitView -->
	<!-- You need the SvelteFlowProvider so you can useSvelteFlow  -->
	<SvelteFlowProvider>
		<div style:width="50vw" class="max-h-screen">
			<Flow />
		</div>
		<div style:width="25vw" class="border-l-2 border-zinc-200 p-8 max-h-screen overflow-y-auto">
			<JsonPreview />
		</div>
		<div style:width="25vw" class="border-l-2 border-zinc-200 p-8 max-h-screen overflow-y-auto">
			<TypstPreview />
		</div>
	</SvelteFlowProvider>
</div>
