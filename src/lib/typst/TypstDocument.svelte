<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	import type * as typst from '@myriaddreamin/typst.ts';
	import { createGlobalRenderer } from '@myriaddreamin/typst.ts/dist/esm/contrib/global-renderer.mjs';
	import { createTypstRenderer } from '@myriaddreamin/typst.ts/dist/esm/renderer.mjs';
	import { withGlobalCompiler } from '@myriaddreamin/typst.ts/dist/esm/contrib/global-compiler.mjs';
	import { createTypstCompiler } from '@myriaddreamin/typst.ts/dist/esm/compiler.mjs';
	import { MemoryAccessModel } from '@myriaddreamin/typst.ts/dist/esm/fs/memory.mjs';
	import { FetchPackageRegistry } from '@myriaddreamin/typst.ts/dist/esm/fs/package.mjs';
	import {
		loadFonts,
		withAccessModel,
		withPackageRegistry
	} from '@myriaddreamin/typst.ts/dist/esm/options.init.mjs';
	import compilerWasm from '@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm?url';
	import rendererWasm from '@myriaddreamin/typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm?url';
	import './typst.css';

	/* ---------------- props ---------------- */
	let {
		// fill,
		source,
		artifact,
		compiler,
		renderer,
		onDiagnostics
	}: {
		// fill?: string;
		source?: string;
		artifact?: Uint8Array;
		compiler?: typst.TypstCompiler;
		renderer?: typst.TypstRenderer;
		onDiagnostics?: (diagnostics: unknown) => void;
	} = $props();

	if (source && artifact) {
		throw new Error('Cannot provide both source and artifact, please provide only one.');
	}

	const setDiag = $derived(onDiagnostics ?? console.error);

	/* ---------------- init options ---------------- */
	const accessModel = new MemoryAccessModel();
	const compilerInitOpts: typst.InitOptions = {
		beforeBuild: [
			loadFonts([]),
			withAccessModel(accessModel),
			withPackageRegistry(new FetchPackageRegistry(accessModel))
		],
		getModule: () => compilerWasm
	};

	const rendererInitOpts: typst.InitOptions = {
		beforeBuild: [],
		getModule: () => rendererWasm
	};

	/* ---------------- state ---------------- */
	let displayDiv: HTMLDivElement | null = $state<HTMLDivElement | null>(null);

	interface RendererResource {
		session: typst.RenderSession;
		renderer: typst.TypstRenderer;
	}

	let rHandler: RendererResource | undefined = $state<RendererResource | undefined>();
	let finalArtifact: Uint8Array | undefined = $state<Uint8Array | undefined>(artifact);

	/* ---------------- renderer lifecycle ---------------- */
	onMount(() => {
		let kill!: () => void;
		const killPromise = new Promise<void>((resolve) => (kill = resolve));

		(async () => {
			const r = renderer ?? (await createGlobalRenderer(createTypstRenderer, rendererInitOpts));
			await r.runWithSession(async (session) => {
				rHandler = { session, renderer: r };
				await killPromise;
			});
		})();

		onDestroy(() => {
			kill?.();
		});
	});

	/* ---------------- compile effect ---------------- */
	$effect(() => {
		if (!source) return;

		const doCompile = async (c: typst.TypstCompiler) => {
			compiler = c;
			if (!source) return;

			c.addSource('/main.typ', source);
			const result = await c.compile({ mainFilePath: '/main.typ' });

			if (result.diagnostics) {
				setDiag(result.diagnostics);
			} else {
				finalArtifact = result.result;
			}
		};

		if (compiler) {
			doCompile(compiler);
		} else {
			withGlobalCompiler(createTypstCompiler, compilerInitOpts, doCompile);
		}
	});

	/* ---------------- render effect ---------------- */
	$effect(() => {
		if (!displayDiv) return;

		if (!displayDiv.firstElementChild) {
			const wrapper = document.createElement('div');
			wrapper.className = 'display-layer-wrapper';
			displayDiv.appendChild(wrapper);

			const div = document.createElement('div');
			wrapper.appendChild(div);
		}

		const wrapElem = displayDiv.firstElementChild as HTMLDivElement;
		const divElem = wrapElem.firstElementChild as HTMLDivElement;

		if (!finalArtifact?.length) {
			divElem.innerHTML = '';
			return;
		}

		if (rHandler) {
			// #1 #2
			// rHandler.session.manipulateData({
			// 	action: 'merge',
			// 	data: finalArtifact
			// });

			// #3
			rHandler.session.manipulateData({
				action: 'reset',
				data: finalArtifact
			});

			const docWidth = rHandler.session.docWidth;
			if (docWidth && docWidth > 0) {
				const dw = `${docWidth * window.devicePixelRatio}`;
				if (wrapElem.dataset.width !== dw) {
					wrapElem.dataset.width = dw;
					wrapElem.style.width = `calc(min(${dw}px, 100%))`;
				}
			}

			// #1
			// rHandler.renderer.renderToCanvas({
			// 	renderSession: rHandler.session,
			// 	format: 'vector',
			// 	// backgroundColor: fill,
			// 	container: divElem,
			// 	pixelPerPt: 5
			// });

			// #2
			// const svg = rHandler.renderer.renderSvgDiff({
			// 	renderSession: rHandler.session
			// });
			// divElem.innerHTML = svg;

			// #3
			rHandler.renderer
				.renderSvg({
					renderSession: rHandler.session
				})
				.then((svg) => {
					divElem.innerHTML = svg;
				});
		}
	});
</script>

<!-- markup -->
<div class="typst-app" bind:this={displayDiv}></div>
