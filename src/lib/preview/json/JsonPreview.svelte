<script lang="ts">
	import * as Code from '@/components/ui/code';
	import { ScrollArea } from '@/components/ui/scroll-area/index.js';
	import { CodeOverflow } from '@/components/composed/code-overflow';

	import ExportBar from '@/document/ExportBar.svelte';
	import { dataJSON } from '@/document/artifacts';
	import { flowchartDocument } from '@/document/store.svelte';

	// The preview shows the data document: the semantic form, with no styling.
	// That is the machine-readable artifact, and the one worth reading. The
	// project file is graph-shaped and is for the app, not for a person.
	const preview = $derived(dataJSON(flowchartDocument.snapshot()));
</script>

<div class="@container flex flex-col h-full min-h-0 gap-2 py-4">
	<!-- `min-h-0` on the scroller is what keeps the export bar in view: without it
	     a flex child refuses to shrink below its content, so an expanded code block
	     would grow the column instead of scrolling inside it. -->
	<ScrollArea class="grow min-h-0">
		<CodeOverflow>
			<Code.Root hideLines code={preview}>
				<Code.CopyButton />
			</Code.Root>
		</CodeOverflow>
	</ScrollArea>

	<ExportBar />
</div>
