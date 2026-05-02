<script lang="ts">
	import { useSvelteFlow, useNodes, useEdges } from '@xyflow/svelte';
	import { convertFlowchartToTypstFlowchartData, parseTypstFlowchartJSON } from './convert.ts';

	import { createProfile, parseProfileJSON, type Profile } from '../../index.ts';
	import { styleConfig } from '../style/style-config.svelte.ts';

	import * as ButtonGroup from '@/components/ui/button-group/index.js';
	import Button from '@/components/ui/button/button.svelte';
	import * as Code from '@/components/ui/code';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';

	import { UseClipboard } from '$lib/hooks/use-clipboard.svelte';

	import SimpleField from '../style/SimpleField.svelte';

	import { CheckIcon, CopyIcon, DownloadIcon } from '@lucide/svelte';
	import { ImportIcon } from '@lucide/svelte';
	import { ShareIcon } from '@lucide/svelte';

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

	// Simplified logic for encryption
	async function encryptProfile(profile: Profile) {
		const key = await window.crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
			'encrypt',
			'decrypt'
		]);

		const iv = window.crypto.getRandomValues(new Uint8Array(12));
		const encoded = new TextEncoder().encode(JSON.stringify(profile));

		const ciphertext = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

		// Export key to shareable format (base64/hex)
		const exportedKey = await window.crypto.subtle.exportKey('raw', key);

		// Return the data to send to server + the key for the URL
		return {
			uploadPayload:
				btoa(String.fromCharCode(...new Uint8Array(iv))) +
				'.' +
				btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
			urlKey: btoa(String.fromCharCode(...new Uint8Array(exportedKey)))
		};
	}

	const clipboard = new UseClipboard();
	let shareableUrl = $state<string>('');

	async function shareJSON() {
		const { uploadPayload, urlKey } = await encryptProfile(profile);

		const response = await fetch('/api/share', {
			method: 'POST',
			body: JSON.stringify({ payload: uploadPayload })
		});

		if (response.ok) {
			const { id } = (await response.json()) as { id: string };
			shareableUrl = `${window.location.origin}/?id=${id}#${urlKey}`;
			// shareableUrl = `${window.location.origin}/share/${id}#${urlKey}`;
		}
	}

	// JSON encode
	const profile = $derived.by<Profile>(() => {
		const raw = toObject();
		const data = convertFlowchartToTypstFlowchartData(raw);
		const profile = createProfile(data, styleConfig.current);
		return profile;
	});
	const profileStringified = $derived(JSON.stringify(profile, null, 2));

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
	<div class="flex flex-col max-lg:flex-row @lg:flex-row justify-between gap-2">
		<SimpleField
			title="File name"
			name="page-title"
			bind:value={fileName.current}
			placeholder="flowchart"
		/>

		<div class="flex flex-col gap-2 items-end self-end">
			{#if shareableUrl}
				<InputGroup.Root>
					<InputGroup.Input placeholder={shareableUrl} readonly />
					<InputGroup.Addon align="inline-end">
						<InputGroup.Button
							aria-label="Copy"
							title="Copy"
							size="icon-xs"
							onclick={() => clipboard.copy(shareableUrl)}
						>
							{#if clipboard.copied}
								<CheckIcon />
							{:else}
								<CopyIcon />
							{/if}
						</InputGroup.Button>
					</InputGroup.Addon>
				</InputGroup.Root>
			{/if}
			<div class="flex gap-2 items-end">
				<Button variant="outline" onclick={shareJSON}><ShareIcon />Share</Button>
				<ButtonGroup.Root title="Download options" aria-label="Download options">
					<Button variant="outline" onclick={importJSON}><ImportIcon />Import</Button>
					<Button variant="outline" onclick={exportJSON}><DownloadIcon />Export</Button>
				</ButtonGroup.Root>
			</div>
		</div>
	</div>
</div>
