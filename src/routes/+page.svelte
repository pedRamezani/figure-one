<script lang="ts">
	import { onMount } from 'svelte';

	import type { PageProps } from './$types';

	import App from '@/App.svelte';
	import type { Profile } from '@/index';

	let { data }: PageProps = $props();

	let appData: Profile | null = $state(null);
	let isDecrypting = $state(false);
	let error: string | null = $state(null);

	async function decryptState(combinedPayload: string, b64Key: string): Promise<Profile> {
		const [ivB64, cipherB64] = combinedPayload.split('.');

		// Convert Base64 strings to Uint8Arrays
		const iv = Uint8Array.from(atob(ivB64), (c) => c.charCodeAt(0));
		const ciphertext = Uint8Array.from(atob(cipherB64), (c) => c.charCodeAt(0));
		const keyBuffer = Uint8Array.from(atob(b64Key), (c) => c.charCodeAt(0));

		const key = await crypto.subtle.importKey('raw', keyBuffer, 'AES-GCM', false, ['decrypt']);

		const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);

		return JSON.parse(new TextDecoder().decode(decrypted)) as Profile;
	}

	onMount(async () => {
		if (data.sharedState) {
			isDecrypting = true;

			// 1. Grab key from fragment (#...)
			const urlKey = window.location.hash.substring(1);

			if (!urlKey) {
				error = 'Link is missing the decryption key (after the #).';
				isDecrypting = false;
				return;
			}

			try {
				// 2. Decrypt the data
				// (Assuming you have your decryptState function imported)
				appData = await decryptState(data.sharedState, urlKey);

				// 3. TODO: Initialize your app with appData
				console.log('State Restored:', appData);
			} catch (e) {
				console.error(e);
				error = 'Decryption failed. The key might be wrong.';
			} finally {
				isDecrypting = false;
			}
		}
	});

	let height = $state<number | null>(null);
	let width = $state<number | null>(null);
</script>

<main class="flex w-auto h-dvh" bind:clientHeight={height} bind:clientWidth={width}>
	{#if data.sharedState}
		{#if isDecrypting}
			<p>Unlocking your data...</p>
		{:else if error}
			<p style="color: red;">{error}</p>
		{:else}
			<!-- Your main app UI here -->
			<App {height} {width} />
		{/if}
	{:else}
		<!-- Standard App Entry (No ID in URL) -->
		<App {height} {width} />
	{/if}
</main>
