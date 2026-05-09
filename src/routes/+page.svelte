<script lang="ts">
	import { onMount } from 'svelte';

	import type { PageProps } from './$types';

	import App from '@/App.svelte';
	import type { Profile } from '@/index';

	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { toast } from 'svelte-sonner';

	let { data }: PageProps = $props();

	let profile: Profile | null = $state(null);
	let isDecrypting = $state(false);

	async function decryptState(combinedPayload: string, b64Key: string): Promise<Profile | null> {
		const [ivB64, cipherB64] = combinedPayload.split('.');

		// Convert Base64 strings to Uint8Arrays
		const iv = Uint8Array.from(atob(ivB64), (c) => c.charCodeAt(0));
		const ciphertext = Uint8Array.from(atob(cipherB64), (c) => c.charCodeAt(0));
		const keyBuffer = Uint8Array.from(atob(b64Key), (c) => c.charCodeAt(0));

		const key = await crypto.subtle.importKey('raw', keyBuffer, 'AES-GCM', false, ['decrypt']);

		const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);

		return (JSON.parse(new TextDecoder().decode(decrypted)) as Profile | undefined) || null;
	}

	onMount(async () => {
		if (data.sharedState) {
			isDecrypting = true;

			// 1. Grab key from fragment (#...)
			const urlKey = window.location.hash.substring(1);

			if (!urlKey) {
				toast.error('Link is missing the decryption key (after the #).');
				isDecrypting = false;
				return;
			}

			try {
				// 2. Decrypt the data
				// (Assuming you have your decryptState function imported)
				profile = await decryptState(data.sharedState, urlKey);
			} catch (e) {
				console.error(e);
				toast.error('Decryption failed. The key might be wrong.');
			} finally {
				isDecrypting = false;
			}
		}

		if (data.error) {
			toast.error(data.error);
		}
	});

	let height = $state<number | null>(null);
	let width = $state<number | null>(null);
</script>

<main class="flex w-auto h-dvh" bind:clientHeight={height} bind:clientWidth={width}>
	{#if data.sharedState && isDecrypting}
		<div class="flex flex-col gap-4 w-full justify-center items-center">
			<p class="text-3xl font-semibold tracking-tight">Unlocking your data...</p>
			<Spinner class="size-8" />
		</div>
	{:else}
		<!-- Standard App Entry (No ID in URL) -->
		<App {profile} {height} {width} />
	{/if}
</main>
