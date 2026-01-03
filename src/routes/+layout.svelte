<script lang="ts">
	import './layout.css';
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
</svelte:head>

{@render children()}
