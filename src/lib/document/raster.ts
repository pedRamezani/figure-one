/**
 * Turning the rendered figure into a raster image.
 *
 * The SVG is self-contained, so it can be handed to an `Image` as a data URL
 * and drawn onto a canvas. Adapted from https://stackoverflow.com/a/74026755
 * (Teocci and contributors, CC BY-SA 4.0, retrieved 2026-09-12), with two
 * changes:
 *
 * - The data URL is percent-encoded rather than base64. `btoa` throws on any
 *   character above U+00FF, so a single umlaut or en dash in a label would
 *   break the export outright.
 * - The canvas is read back with `toBlob` rather than `toDataURL`, to avoid
 *   materialising a multi-megabyte base64 string for a large figure.
 */

/** CSS pixels are defined at 96 per inch. Everything scales from that. */
const CSS_PIXELS_PER_INCH = 96;

const UNITS_PER_INCH: Record<string, number> = {
	px: 96,
	pt: 72,
	pc: 6,
	mm: 25.4,
	cm: 2.54,
	in: 1
};

const LENGTH = /^([\d.]+)\s*(px|pt|pc|mm|cm|in)?$/i;

/** A length from an SVG attribute, in CSS pixels. Null when unreadable. */
function toCssPixels(value: string): number | null {
	const match = LENGTH.exec(value.trim());
	if (!match) return null;

	const amount = Number(match[1]);
	if (!Number.isFinite(amount) || amount <= 0) return null;

	const unit = (match[2] ?? 'px').toLowerCase();
	const perInch = UNITS_PER_INCH[unit];
	if (perInch === undefined) return null;

	return (amount / perInch) * CSS_PIXELS_PER_INCH;
}

function attribute(svg: string, name: string): string | undefined {
	return new RegExp(`<svg[^>]*?\\s${name}="([^"]*)"`, 'i').exec(svg)?.[1];
}

export interface SvgSize {
	width: number;
	height: number;
}

/**
 * The figure's size in CSS pixels.
 *
 * Prefers the declared width and height, since those carry the page's physical
 * size. Falls back to the viewBox, which is unitless and therefore already in
 * CSS pixels by definition.
 */
export function measureSvg(svg: string): SvgSize | null {
	const declaredWidth = attribute(svg, 'width');
	const declaredHeight = attribute(svg, 'height');

	if (declaredWidth !== undefined && declaredHeight !== undefined) {
		const width = toCssPixels(declaredWidth);
		const height = toCssPixels(declaredHeight);
		if (width !== null && height !== null) return { width, height };
	}

	const viewBox = attribute(svg, 'viewBox');
	if (viewBox !== undefined) {
		const parts = viewBox
			.trim()
			.split(/[\s,]+/)
			.map(Number);
		if (parts.length === 4 && parts.every(Number.isFinite)) {
			const [, , width, height] = parts;
			if (width > 0 && height > 0) return { width, height };
		}
	}

	return null;
}

/** Pixel dimensions the figure would have at a given resolution. */
export function pixelSizeAt(svg: string, dpi: number): SvgSize | null {
	const size = measureSvg(svg);
	if (!size) return null;

	const scale = dpi / CSS_PIXELS_PER_INCH;

	return {
		width: Math.max(1, Math.round(size.width * scale)),
		height: Math.max(1, Math.round(size.height * scale))
	};
}

/** The figure as a data URL an `Image` will load. */
export function svgDataUrl(svg: string): string {
	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function loadImage(url: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.onload = () => resolve(image);
		image.onerror = () => reject(new Error('The figure could not be read as an image.'));
		image.src = url;
	});
}

/**
 * Renders the figure to a PNG at the given resolution.
 *
 * The canvas is left transparent before drawing, so whatever the SVG paints is
 * what the PNG shows and it matches the PDF.
 */
export async function svgToPng(svg: string, dpi: number): Promise<Blob> {
	const size = pixelSizeAt(svg, dpi);
	if (!size) {
		throw new Error('The figure does not declare a size, so it cannot be rendered.');
	}

	const image = await loadImage(svgDataUrl(svg));

	const canvas = document.createElement('canvas');
	canvas.width = size.width;
	canvas.height = size.height;

	const context = canvas.getContext('2d');
	if (!context) {
		throw new Error('This browser would not provide a drawing canvas.');
	}

	context.drawImage(image, 0, 0, size.width, size.height);

	return new Promise((resolve, reject) => {
		canvas.toBlob((blob) => {
			if (blob) {
				resolve(blob);
			} else {
				reject(new Error('The figure could not be encoded as a PNG.'));
			}
		}, 'image/png');
	});
}
