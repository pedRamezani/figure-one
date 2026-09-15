<script lang="ts">
	import FileJsonIcon from '@lucide/svelte/icons/file-json';

	import { documentImporter } from './importer.svelte.ts';

	// Dropping a flowchart anywhere on the page opens it.
	//
	// Listens on the window rather than on a target area, so there is nothing to
	// aim at. The flow canvas has its own drop handler for adding nodes, which
	// this must not disturb: a drag carrying files is ours, anything else is not.

	let dragging = $state(false);

	// `dragenter` and `dragleave` fire for every element the pointer crosses, so
	// a plain boolean would flicker off the moment the pointer entered a child.
	let depth = 0;

	function carriesFiles(event: DragEvent): boolean {
		return Array.from(event.dataTransfer?.types ?? []).includes('Files');
	}

	function ondragenter(event: DragEvent) {
		if (!carriesFiles(event)) return;

		depth += 1;
		dragging = true;
	}

	function ondragover(event: DragEvent) {
		if (!carriesFiles(event)) return;

		// Without this the browser navigates to the dropped file.
		event.preventDefault();
		if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
	}

	function ondragleave(event: DragEvent) {
		if (!carriesFiles(event)) return;

		depth = Math.max(0, depth - 1);
		if (depth === 0) dragging = false;
	}

	function reset() {
		depth = 0;
		dragging = false;
	}

	function ondrop(event: DragEvent) {
		if (!carriesFiles(event)) return;

		event.preventDefault();
		reset();

		const file = event.dataTransfer?.files?.[0];
		if (file) documentImporter.importFile(file);
	}
</script>

<svelte:window {ondragenter} {ondragover} {ondragleave} {ondrop} ondragend={reset} onblur={reset} />

{#if dragging}
	<div
		class="bg-background/80 animate-in fade-in-0 pointer-events-none fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm duration-100"
		role="presentation"
	>
		<div
			class="border-primary bg-card text-card-foreground flex flex-col items-center gap-3 rounded-xl border-2 border-dashed px-10 py-8 shadow-lg"
		>
			<FileJsonIcon class="text-primary size-10" />
			<p class="text-base font-medium">Drop to open this flowchart</p>
			<p class="text-muted-foreground text-sm">
				A project file, a data export, or a flowchart from an older version.
			</p>
		</div>
	</div>
{/if}
