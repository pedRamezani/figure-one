import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	test: {
		// Node only. The document store is written to take an injected storage
		// object, so nothing here needs a DOM or a mounted component.
		environment: 'node',
		include: ['src/**/*.{test,spec}.ts', 'src/**/*.svelte.{test,spec}.ts']
	}
});
