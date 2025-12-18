<script lang="ts">
	import { SvelteFlowProvider } from '@xyflow/svelte';

	import * as Tabs from '$lib/components/ui/tabs/index.js';

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
		<div style:width="50vw" class="border-l-2 border-zinc-200 p-8 max-h-screen overflow-y-auto">
			<Tabs.Root value="typst">
				<Tabs.List>
					<Tabs.Trigger value="typst">Typst</Tabs.Trigger>
					<Tabs.Trigger value="json">JSON</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="typst">
					<TypstPreview />
				</Tabs.Content>
				<Tabs.Content value="json">
					<JsonPreview />
				</Tabs.Content>
			</Tabs.Root>
		</div>
	</SvelteFlowProvider>
</div>
