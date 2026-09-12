<script lang="ts">
	import { onMount } from 'svelte';

	import * as typst from '@myriaddreamin/typst.ts';
	import { createGlobalRenderer } from '@myriaddreamin/typst.ts/dist/esm/contrib/global-renderer.mjs';
	import { createTypstRenderer } from '@myriaddreamin/typst.ts/dist/esm/renderer.mjs';
	import { withGlobalCompiler } from '@myriaddreamin/typst.ts/dist/esm/contrib/global-compiler.mjs';
	import { createTypstCompiler } from '@myriaddreamin/typst.ts/dist/esm/compiler.mjs';
	import { MemoryAccessModel } from '@myriaddreamin/typst.ts/dist/esm/fs/memory.mjs';
	import { FetchPackageRegistry } from '@myriaddreamin/typst.ts/dist/esm/fs/package.mjs';
	import { CompileFormatEnum } from '@myriaddreamin/typst.ts/dist/esm/compiler.mjs';
	import {
		loadFonts,
		withAccessModel,
		withPackageRegistry
	} from '@myriaddreamin/typst.ts/dist/esm/options.init.mjs';
	import compilerWasm from '@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm?url';
	import rendererWasm from '@myriaddreamin/typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm?url';

	import { cn } from '@/utils';
	import './typst.css';
	import { SvgPanZoom } from '@/components/composed/svg-pan-zoom';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';

	/* ---------------- props ---------------- */
	let {
		// fill,
		source,
		sourceShadowMappings,
		artifact,
		compiler,
		renderer,
		onDiagnostics,
		onArtifactChange,
		onSvgChange,
		compilePdf = $bindable(),
		class: className
	}: {
		// fill?: string;
		source?: string;
		sourceShadowMappings?: { [key: string]: Uint8Array };
		artifact?: Uint8Array;
		compiler?: typst.TypstCompiler;
		renderer?: typst.TypstRenderer;
		onDiagnostics?: (diagnostics: unknown) => void;
		onArtifactChange?: (artifact: Uint8Array | undefined) => void;
		onSvgChange?: (svg: string) => void;
		compilePdf?: () => Promise<Uint8Array<ArrayBufferLike> | undefined>;
		class?: string;
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
	let svgHTML = $state<string | null>(null);

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

		return () => {
			kill?.();
		};
	});

	/* ---------------- compile effect ---------------- */
	$effect(() => {
		if (!source) return;

		const doCompile = async (c: typst.TypstCompiler) => {
			compiler = c;
			if (!source) return;

			c.addSource('/main.typ', source);
			if (sourceShadowMappings !== undefined) {
				for (const [key, value] of Object.entries(sourceShadowMappings)) {
					c.mapShadow(key, value);
				}
			}
			const result = await c.compile({ mainFilePath: '/main.typ' });

			if (result.diagnostics) {
				setDiag(result.diagnostics);
			} else {
				onArtifactChange?.(result.result);
				compilePdf = async () => {
					const pdfCompileResult = await c.compile({
						mainFilePath: '/main.typ',
						format: CompileFormatEnum.pdf
					});

					if (pdfCompileResult.diagnostics) {
						setDiag(pdfCompileResult.diagnostics);
					} else {
						return pdfCompileResult.result;
					}
				};
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
		if (!finalArtifact?.length) {
			svgHTML = null;
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

			// #1
			// const docWidth = rHandler.session.docWidth;
			// if (docWidth && docWidth > 0) {
			// 	const dw = `${docWidth * window.devicePixelRatio}`;
			// 	if (wrapElem.dataset.width !== dw) {
			// 		wrapElem.dataset.width = dw;
			// 		wrapElem.style.width = `calc(min(${dw}px, 100%))`;
			// 	}
			// }

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
					renderSession: rHandler.session,
					data_selection: {
						body: true,
						css: false,
						defs: true,
						js: false
					}
				})
				.then((svg) => {
					const processedSvg = svg.replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '');
					onSvgChange?.(processedSvg);
					svgHTML = processedSvg.replace('<svg ', '<svg style="width: 100%; height: auto"');
				});
		}
	});
</script>

<div class="h-full">
	{#if svgHTML}
		<SvgPanZoom class={cn('typst-app', className)}>
			{#snippet svg()}
				<!-- eslint-disable-next-line svelte/no-at-html-tags -- SVG produced by the Typst compiler in this page, not user input -->
				{@html svgHTML}
			{/snippet}
		</SvgPanZoom>
	{:else}
		<Skeleton class="w-full aspect-[3]" />
	{/if}
</div>
