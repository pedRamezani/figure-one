/**
 * The PDF and SVG renderers live inside the Typst preview, but the export menu
 * lives next to the project name in the other pane. This is the seam between
 * them: the preview registers what it can produce, and the menu offers whatever
 * is currently available.
 *
 * Both start as null, so the menu can disable an entry until the Typst
 * compiler has actually loaded rather than offering a button that does nothing.
 */
class ExportRegistry {
	compilePdf = $state<(() => Promise<Uint8Array | undefined>) | null>(null);
	svg = $state<string | null>(null);

	get canExportPdf(): boolean {
		return this.compilePdf !== null;
	}

	get canExportSvg(): boolean {
		return this.svg !== null && this.svg.length > 0;
	}
}

export const exporters = new ExportRegistry();
