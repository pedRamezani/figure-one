<script lang="ts">
	import { SvelteFlowProvider } from '@xyflow/svelte';

	import * as Resizable from '@/components/ui/resizable/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import * as Tabs from '@/components/ui/tabs/index.js';

	import Flow from '@/flow/Flow.svelte';
	import JsonPreview from '@/preview/json/JsonPreview.svelte';
	import TypstPreview from '@/preview/typst/TypstPreview.svelte';
	import StyleConfigurator from '@/preview/style/StyleConfigurator.svelte';

	import SettingsIcon from '@lucide/svelte/icons/settings';

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
				<ScrollArea class="h-full">
					<Tabs.Root value="flow" class="h-full">
						<Tabs.List class="absolute top-4 left-4 md:top-8 md:left-8 z-10">
							<Tabs.Trigger value="flow">Flow</Tabs.Trigger>
							<Tabs.Trigger value="style"><SettingsIcon /></Tabs.Trigger>
						</Tabs.List>
						<Tabs.Content value="flow">
							<Flow />
						</Tabs.Content>
						<Tabs.Content value="style" class="p-4 md:p-8 pt-16 md:pt-20">
							<StyleConfigurator />
						</Tabs.Content>
					</Tabs.Root>
				</ScrollArea>
			</Resizable.Pane>
			<Resizable.Handle />
			<Resizable.Pane defaultSize={35} class="border-l-2 border-zinc-200">
				<ScrollArea class="h-full">
					<Tabs.Root value="typst" class="h-full p-4 md:p-8">
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
				</ScrollArea>
			</Resizable.Pane>
		</Resizable.PaneGroup>
	</SvelteFlowProvider>
</div>
