<script lang="ts">
	import './layout.css';
	import { ModeWatcher } from 'mode-watcher';
	import favicon from '@/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Figure One</title>
	<meta
		name="description"
		content="Build CONSORT and PRISMA participant flow diagrams in a drag-and-drop editor, and export them as a print-ready PDF, SVG or PNG."
	/>

	<link rel="preconnect" href="https://rsms.me/" />
	<link rel="stylesheet" href="https://rsms.me/inter/inter.css" />

	<link rel="preconnect" href="https://cdn.jsdelivr.net/" />
</svelte:head>

<ModeWatcher />

{@render children()}
