<script lang="ts">
	import './layout.css';
	import { ModeWatcher } from 'mode-watcher';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/favicon.ico" sizes="any" />
	<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
	<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
	<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
	<link rel="manifest" href="/site.webmanifest" />

	<title>Figure One</title>
	<meta
		name="description"
		content="Build CONSORT and PRISMA participant flow diagrams in a drag-and-drop editor, and export them as a print-ready PDF, SVG or PNG."
	/>

	<link rel="preconnect" href="https://rsms.me/" />
	<link rel="stylesheet" href="https://rsms.me/inter/inter.css" />

	<link rel="preconnect" href="https://cdn.jsdelivr.net/" />
</svelte:head>

<!--
	Tints the browser chrome to match the canvas, so a phone in dark mode does not
	put a white address bar above a near-black page. These are the light and dark
	`--background` tokens from `layout.css`.
-->
<ModeWatcher themeColors={{ light: '#ffffff', dark: '#171717' }} />

{@render children()}
