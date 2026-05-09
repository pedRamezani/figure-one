<script lang="ts">
	import './layout.css';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
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
</svelte:head>

<ModeWatcher />
<Toaster />
{@render children()}
