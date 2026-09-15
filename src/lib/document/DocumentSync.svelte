<script lang="ts">
	import { onMount } from 'svelte';

	import { flowchartDocument } from './store.svelte.ts';

	// Everything to do with persistence lives here: one load, one debounced save,
	// and the window listeners. Renders nothing.
	//
	// The save effect reads reactive state and writes only to `localStorage`. It
	// never writes back into reactive state, which is what the previous sync
	// effects did and why they had to be reverted twice.

	const SAVE_DELAY_MS = 200;

	let saveTimer: ReturnType<typeof setTimeout> | undefined;

	onMount(() => {
		flowchartDocument.attach(localStorage);

		return () => {
			clearTimeout(saveTimer);
			flowchartDocument.save();
			flowchartDocument.detach();
		};
	});

	$effect(() => {
		// Track every part of the document. Nodes and edges are `$state.raw`, so
		// any change reassigns the array and is seen here. The config is a deep
		// proxy, so it is stringified to subscribe to its nested fields.
		void flowchartDocument.nodes;
		void flowchartDocument.edges;
		void flowchartDocument.name;
		void JSON.stringify(flowchartDocument.config);

		saveTimer = setTimeout(() => flowchartDocument.save(), SAVE_DELAY_MS);

		return () => clearTimeout(saveTimer);
	});

	/** Writes immediately, for when the page is about to go away. */
	function flush() {
		clearTimeout(saveTimer);
		flowchartDocument.save();
	}

	function onstorage(event: StorageEvent) {
		flowchartDocument.receiveStorageEvent(event);
	}

	function onvisibilitychange() {
		if (document.visibilityState === 'hidden') {
			flush();
		} else {
			// A `storage` event can be missed while the tab is hidden and throttled.
			flowchartDocument.syncFromStorage();
		}
	}
</script>

<svelte:window
	{onstorage}
	onpagehide={flush}
	onblur={flush}
	onfocus={() => flowchartDocument.syncFromStorage()}
/>

<svelte:document {onvisibilitychange} />
