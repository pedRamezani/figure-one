<script lang="ts">
	import { useSvelteFlow, useNodes, useEdges } from '@xyflow/svelte';
	import { convertFlowchartToTypstFlowchartData, parseTypstFlowchartJSON } from './convert.ts';

	import { createProfile, parseProfileJSON } from '../../index.ts';
	import { styleConfig } from '../style/style-config.svelte.ts';

	import * as ButtonGroup from '@/components/ui/button-group/index.js';
	import Button from '@/components/ui/button/button.svelte';
	import * as Code from '@/components/ui/code';

	import SimpleField from '../style/SimpleField.svelte';

	import { DownloadIcon } from '@lucide/svelte';
	import { ImportIcon } from '@lucide/svelte';

	import { downloadBlob } from '../../index.ts';
	import { getLayoutedElements } from '../flow/layout.ts';

	const { toObject, fitView } = useSvelteFlow();

	import { PersistedState } from 'runed';

	let fileName = new PersistedState<string>('project-name', '', {
		serializer: {
			serialize: (value) => value,
			deserialize: (value) => value
		}
	});
	const fullFileName = $derived.by<string>(() => {
		if (!fileName.current) {
			return 'flowchart.json';
		}

		if (fileName.current.endsWith('.json')) {
			return fileName.current;
		}

		return `${fileName.current}.json`;
	});

	// Import / Export JSON
	const nodes = useNodes();
	const edges = useEdges();
	function importJSON(): void {
		const fileInput = document.createElement('input');
		fileInput.type = 'file';
		fileInput.onchange = (event) => {
			const target = event.target as HTMLInputElement | null;
			if (target === null) return;

			const file = target.files ? target.files[0] : null;
			if (file === null) return;
			if (file.type !== 'application/json') return;

			new Response(file).json().then((json) => {
				const profile = parseProfileJSON(json);
				if (profile === null) return;
				styleConfig.current = profile.config;
				const parsed = parseTypstFlowchartJSON(profile.data);
				nodes.set(parsed.nodes);
				edges.set(parsed.edges);

				setTimeout(function () {
					const layouted = getLayoutedElements(nodes.current, edges.current);
					nodes.set(layouted.nodes);
					edges.set(layouted.edges);
					fitView();
				}, 500);
			});
		};
		fileInput.click();
	}

	function exportJSON(): void {
		downloadBlob(profileStringified, 'application/json', fullFileName);
	}

	// JSON encode
	const profileStringified = $derived.by<string>(() => {
		const raw = toObject();
		const data = convertFlowchartToTypstFlowchartData(raw);
		const profile = createProfile(data, styleConfig.current);
		return JSON.stringify(profile, null, 2);
	});

	// Keyboard shortcuts
	function handleKeydown(event: KeyboardEvent): void {
		if (event.key && event.key === 's' && (event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			exportJSON();
		}
	}
</script>

<svelte:document onkeydown={handleKeydown} />

<div class="@container flex flex-col h-full gap-2 py-4">
	<div class="grow">
		<Code.Overflow>
			<Code.Root hideLines code={profileStringified}>
				<Code.CopyButton />
			</Code.Root>
		</Code.Overflow>
	</div>
	<div class="flex flex-col @sm:flex-row sm:flex-row justify-between gap-2">
		<SimpleField
			title="File name"
			name="page-title"
			bind:value={fileName.current}
			placeholder="flowchart"
		/>
		<ButtonGroup.Root class="self-end" title="Download options" aria-label="Download options">
			<Button variant="outline" onclick={importJSON}><ImportIcon />Import</Button>
			<Button variant="outline" onclick={exportJSON}><DownloadIcon />Export</Button>
		</ButtonGroup.Root>
	</div>
</div>
