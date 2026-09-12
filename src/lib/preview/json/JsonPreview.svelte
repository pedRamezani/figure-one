<script lang="ts">
	import * as Code from '@/components/ui/code';
	import { CodeOverflow } from '@/components/composed/code-overflow';

	import ExportBar from '@/document/ExportBar.svelte';
	import { dataJSON } from '@/document/artifacts';
	import { flowchartDocument } from '@/document/store.svelte';

	// The preview shows the data document: the semantic form, with no styling.
	// That is the machine-readable artifact, and the one worth reading. The
	// project file is graph-shaped and is for the app, not for a person.
	const preview = $derived(dataJSON(flowchartDocument.snapshot()));
</script>

<div class="@container flex flex-col h-full gap-2 py-4">
	<div class="grow">
		<CodeOverflow>
			<Code.Root hideLines code={preview}>
				<Code.CopyButton />
			</Code.Root>
		</CodeOverflow>
	</div>

	<ExportBar />
</div>
