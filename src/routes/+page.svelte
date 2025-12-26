<script lang="ts">
	import { SvelteFlowProvider } from '@xyflow/svelte';

	import * as Resizable from '@/components/ui/resizable/index.js';
	import * as Tabs from '@/components/ui/tabs/index.js';

	import Flow from '@/flow/Flow.svelte';
	import JsonPreview from '@/preview/json/JsonPreview.svelte';
	import TypstPreview from '@/preview/typst/TypstPreview.svelte';
	import StyleConfigurator from '@/preview/style/StyleConfigurator.svelte';

	let height = $state<number | null>(null);
	let width = $state<number | null>(null);

	let direction = $derived<'horizontal' | 'vertical'>(
		width === null || height === null || width >= height ? 'horizontal' : 'vertical'
	);
</script>

<div class="flex w-auto h-dvh" bind:clientHeight={height} bind:clientWidth={width}>
	<!-- fitView -->
	<!-- You need the SvelteFlowProvider so you can useSvelteFlow  -->
	<SvelteFlowProvider>
		<Resizable.PaneGroup {direction}>
			<Resizable.Pane defaultSize={65}>
				<Flow />
			</Resizable.Pane>
			<Resizable.Handle />
			<Resizable.Pane
				defaultSize={35}
				class="border-l-2 border-zinc-200 p-4 md:p-8 overflow-y-auto"
			>
				<Tabs.Root value="typst" class="h-full">
					<Tabs.List>
						<Tabs.Trigger value="typst">Typst</Tabs.Trigger>
						<Tabs.Trigger value="json">JSON</Tabs.Trigger>
						<Tabs.Trigger value="style">Settings</Tabs.Trigger>
					</Tabs.List>
					<Tabs.Content value="typst">
						<TypstPreview />
					</Tabs.Content>
					<Tabs.Content value="json">
						<JsonPreview />
					</Tabs.Content>
					<Tabs.Content value="style">
						<StyleConfigurator />
					</Tabs.Content>
				</Tabs.Root>
			</Resizable.Pane>
		</Resizable.PaneGroup>
	</SvelteFlowProvider>
</div>
