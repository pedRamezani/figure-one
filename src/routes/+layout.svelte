<script lang="ts">
	import './layout.css';
	import { ModeWatcher } from 'mode-watcher';
	import favicon from '@/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Flowchart Generator</title>
	<meta
		name="description"
		content="Easily create your consort flowchart in this node editor by dragging and dropping."
	/>

	<link rel="preconnect" href="https://rsms.me/" />
	<link rel="stylesheet" href="https://rsms.me/inter/inter.css" />

	<link rel="preconnect" href="https://cdn.jsdelivr.net/" />

	<!-- Add inside <head> -->
	<script crossOrigin="anonymous" src="https://tweakcn.com/live-preview.min.js"></script>
</svelte:head>

<ModeWatcher />
{@render children()}
