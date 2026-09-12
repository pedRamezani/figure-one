<script lang="ts">
	import { confirmDelete } from '@/components/ui/confirm-delete-dialog';
	import * as ButtonGroup from '@/components/ui/button-group/index.js';
	import * as DropdownMenu from '@/components/ui/dropdown-menu/index.js';
	import { Button } from '@/components/ui/button/index.js';
	import { buttonVariants } from '@/components/ui/button/button.svelte';

	import { SimpleField } from '@/components/composed/simple-field';

	import { cn } from '@/utils';

	import DownloadIcon from '@lucide/svelte/icons/download';
	import ImportIcon from '@lucide/svelte/icons/import';
	import FileJsonIcon from '@lucide/svelte/icons/file-json';
	import FileDownIcon from '@lucide/svelte/icons/file-down';
	import ImageDownIcon from '@lucide/svelte/icons/image-down';
	import ImageIcon from '@lucide/svelte/icons/image';

	import { dataJSON, projectJSON } from './artifacts.ts';
	import { downloadBlob } from './download.ts';
	import { exporters } from './exporters.svelte.ts';
	import {
		dataFileName,
		pdfFileName,
		pngFileName,
		projectFileName,
		svgFileName,
		toBaseName
	} from './name.ts';
	import { pixelSizeAt, svgToPng } from './raster.ts';
	import { readDocument } from './read.ts';
	import { flowchartDocument } from './store.svelte.ts';

	// One name, one menu. The name is a bare base name held in the document, so
	// it governs every artifact rather than just the JSON as it used to.

	let error = $state<string | null>(null);

	/**
	 * Resolutions offered for the PNG.
	 *
	 * Expressed as dots per inch rather than a multiplier because that is what
	 * journals ask for, and because the figure declares a physical page size, so
	 * the conversion is exact rather than a guess.
	 */
	const RESOLUTIONS = [
		{ dpi: 96, label: 'Screen' },
		{ dpi: 150, label: 'Draft print' },
		{ dpi: 300, label: 'Print' },
		{ dpi: 600, label: 'High detail' }
	] as const;

	/** "1500 by 3000" for the menu, or null when the figure cannot be measured. */
	function dimensionsAt(dpi: number): string | null {
		const svg = exporters.svg;
		if (!svg) return null;

		const size = pixelSizeAt(svg, dpi);
		return size ? `${size.width} × ${size.height}` : null;
	}

	function exportProject() {
		error = null;
		const json = projectJSON(flowchartDocument.snapshot());
		downloadBlob(json, 'application/json', projectFileName(flowchartDocument.name));
	}

	function exportData() {
		error = null;
		const json = dataJSON(flowchartDocument.snapshot());
		downloadBlob(json, 'application/json', dataFileName(flowchartDocument.name));
	}

	async function exportPdf() {
		error = null;
		const compile = exporters.compilePdf;
		if (!compile) return;

		const pdf = await compile();
		if (!pdf) {
			error = 'The PDF could not be rendered.';
			return;
		}

		// Copy out of the WebAssembly memory before handing it to a Blob.
		const copy = new Uint8Array(pdf.length);
		copy.set(pdf);

		downloadBlob(copy, 'application/pdf', pdfFileName(flowchartDocument.name));
	}

	function exportSvg() {
		error = null;
		const svg = exporters.svg;
		if (!svg) return;

		downloadBlob(svg, 'image/svg+xml', svgFileName(flowchartDocument.name));
	}

	async function exportPng(dpi: number) {
		error = null;
		const svg = exporters.svg;
		if (!svg) return;

		try {
			const png = await svgToPng(svg, dpi);
			downloadBlob(png, 'image/png', pngFileName(flowchartDocument.name));
		} catch (cause) {
			error = cause instanceof Error ? cause.message : 'The figure could not be exported as a PNG.';
		}
	}

	// ---------------------------------------------------------------
	// Import
	// ---------------------------------------------------------------

	function importFile() {
		error = null;

		const fileInput = document.createElement('input');
		fileInput.type = 'file';
		fileInput.accept = 'application/json,.json';

		fileInput.onchange = async (event) => {
			const target = event.target as HTMLInputElement | null;
			const file = target?.files?.[0];
			if (!file) return;

			let parsed: unknown;
			try {
				parsed = JSON.parse(await file.text());
			} catch {
				error = `${file.name} is not valid JSON.`;
				return;
			}

			const result = readDocument(parsed, flowchartDocument.allocateId);

			if (!result.ok) {
				// This used to fail silently, so picking a file appeared to do nothing.
				error = result.error;
				return;
			}

			const apply = async () => {
				flowchartDocument.replaceWith(result.document, { needsLayout: result.needsLayout });
			};

			// Nothing to lose on a first visit, so do not ask.
			if (flowchartDocument.isPristine) {
				await apply();
				return;
			}

			confirmDelete({
				title: 'Replace flowchart',
				description: `Loading ${file.name} will replace the flowchart you have open, including its styling and name. This cannot be undone.`,
				confirm: { text: 'Replace' },
				onConfirm: apply
			});
		};

		fileInput.click();
	}

	// Keyboard shortcut: save the project file.
	function handleKeydown(event: KeyboardEvent): void {
		if (event.key === 's' && (event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			exportProject();
		}
	}
</script>

<svelte:document onkeydown={handleKeydown} />

<div class="flex flex-col gap-2">
	{#if error}
		<p class="text-destructive text-sm" role="alert">{error}</p>
	{/if}

	<div class="flex flex-col @sm:flex-row sm:flex-row justify-between gap-2">
		<!-- Normalised on blur rather than on input, so typing "trial.json" does
		     not lose its extension mid-keystroke. -->
		<SimpleField
			title="Project name"
			name="project-name"
			bind:value={flowchartDocument.name}
			onblur={() => (flowchartDocument.name = toBaseName(flowchartDocument.name))}
			placeholder="flowchart"
		/>

		<ButtonGroup.Root class="self-end">
			<Button variant="outline" onclick={importFile}><ImportIcon />Import</Button>

			<DropdownMenu.Root>
				<DropdownMenu.Trigger class={buttonVariants({ variant: 'outline' })}>
					<DownloadIcon />Export
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="end">
					<DropdownMenu.Group>
						<DropdownMenu.GroupHeading>Project</DropdownMenu.GroupHeading>
						<DropdownMenu.Item onSelect={exportProject}>
							<FileJsonIcon />
							{projectFileName(flowchartDocument.name)}
						</DropdownMenu.Item>
					</DropdownMenu.Group>

					<DropdownMenu.Separator />

					<DropdownMenu.Group>
						<DropdownMenu.GroupHeading>Figure</DropdownMenu.GroupHeading>
						<DropdownMenu.Item onSelect={exportPdf} disabled={!exporters.canExportPdf}>
							<FileDownIcon />
							{pdfFileName(flowchartDocument.name)}
						</DropdownMenu.Item>
						<DropdownMenu.Item onSelect={exportSvg} disabled={!exporters.canExportSvg}>
							<ImageDownIcon />
							{svgFileName(flowchartDocument.name)}
						</DropdownMenu.Item>
						<DropdownMenu.Sub>
							<DropdownMenu.SubTrigger disabled={!exporters.canExportSvg}>
								<ImageIcon />
								{pngFileName(flowchartDocument.name)}
							</DropdownMenu.SubTrigger>
							<DropdownMenu.SubContent>
								{#each RESOLUTIONS as resolution (resolution.dpi)}
									{@const dimensions = dimensionsAt(resolution.dpi)}
									<DropdownMenu.Item onSelect={() => exportPng(resolution.dpi)}>
										<span>{resolution.label}</span>
										{#if dimensions}
											<span class="text-muted-foreground ml-auto pl-4 text-xs tabular-nums">
												{dimensions}
											</span>
										{/if}
										<span
											class={cn(
												'bg-muted text-muted-foreground rounded-sm px-1.5 py-0.5 text-[0.65rem] font-medium tabular-nums',
												dimensions ? '' : 'ml-auto'
											)}
										>
											{resolution.dpi} dpi
										</span>
									</DropdownMenu.Item>
								{/each}
							</DropdownMenu.SubContent>
						</DropdownMenu.Sub>
					</DropdownMenu.Group>

					<DropdownMenu.Separator />

					<DropdownMenu.Group>
						<DropdownMenu.GroupHeading>Data</DropdownMenu.GroupHeading>
						<DropdownMenu.Item onSelect={exportData}>
							<FileJsonIcon />
							{dataFileName(flowchartDocument.name)}
						</DropdownMenu.Item>
					</DropdownMenu.Group>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</ButtonGroup.Root>
	</div>
</div>
