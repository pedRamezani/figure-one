<script lang="ts">
	import { useSvelteFlow, useNodes, useEdges } from '@xyflow/svelte';

	import { parseTypstFlowchartJSON } from './preview/json/convert.ts';
	import { styleConfig } from './preview/style/style-config.svelte.ts';
	import { getLayoutedElements } from './preview/flow/layout.ts';
	import type { Profile } from './index.ts';

	import { onMount } from 'svelte';

	const { fitView } = useSvelteFlow();

	let { profile }: { profile: Profile | null } = $props();

	// Import / Export JSON
	const nodes = useNodes();
	const edges = useEdges();
	onMount(() => {
		if (profile === null) return;
		styleConfig.current = profile.config;
		const parsed = parseTypstFlowchartJSON(profile.data);
		nodes.current = parsed.nodes;
		edges.current = parsed.edges;

		setTimeout(function () {
			const layouted = getLayoutedElements(nodes.current, edges.current);
			nodes.set(layouted.nodes);
			edges.set(layouted.edges);
			fitView();
		}, 500);
	});
</script>
