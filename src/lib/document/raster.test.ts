import { describe, expect, it } from 'vitest';

import { measureSvg, pixelSizeAt, svgDataUrl } from './raster.ts';

describe('measureSvg', () => {
	it('reads plain pixel dimensions', () => {
		expect(measureSvg('<svg width="400" height="300"></svg>')).toEqual({
			width: 400,
			height: 300
		});
	});

	it('converts points, which is what Typst declares', () => {
		// 72pt is an inch, and an inch is 96 CSS pixels.
		expect(measureSvg('<svg width="72pt" height="144pt"></svg>')).toEqual({
			width: 96,
			height: 192
		});
	});

	it('converts physical units', () => {
		expect(measureSvg('<svg width="1in" height="2.54cm"></svg>')).toEqual({
			width: 96,
			height: 96
		});
		expect(measureSvg('<svg width="25.4mm" height="25.4mm"></svg>')).toEqual({
			width: 96,
			height: 96
		});
	});

	it('falls back to the viewBox', () => {
		expect(measureSvg('<svg viewBox="0 0 210 297"></svg>')).toEqual({
			width: 210,
			height: 297
		});
	});

	it('prefers declared dimensions over the viewBox', () => {
		expect(measureSvg('<svg width="400" height="300" viewBox="0 0 40 30"></svg>')).toEqual({
			width: 400,
			height: 300
		});
	});

	it('falls back to the viewBox when the dimensions are percentages', () => {
		// The preview overrides width to 100%, so this shape is reachable.
		expect(measureSvg('<svg width="100%" height="auto" viewBox="0 0 200 100"></svg>')).toEqual({
			width: 200,
			height: 100
		});
	});

	it('accepts a comma separated viewBox', () => {
		expect(measureSvg('<svg viewBox="0,0,50,25"></svg>')).toEqual({ width: 50, height: 25 });
	});

	it('returns null when there is nothing to measure', () => {
		expect(measureSvg('<svg></svg>')).toBeNull();
		expect(measureSvg('<svg width="0" height="0"></svg>')).toBeNull();
		expect(measureSvg('not an svg at all')).toBeNull();
	});

	it('is not confused by attributes on inner elements', () => {
		const svg = '<svg width="400" height="300"><rect width="10" height="10"/></svg>';
		expect(measureSvg(svg)).toEqual({ width: 400, height: 300 });
	});
});

describe('pixelSizeAt', () => {
	const page = '<svg width="360pt" height="720pt"></svg>';

	it('matches the CSS size at 96 dpi', () => {
		expect(pixelSizeAt(page, 96)).toEqual({ width: 480, height: 960 });
	});

	it('scales for print', () => {
		expect(pixelSizeAt(page, 300)).toEqual({ width: 1500, height: 3000 });
		expect(pixelSizeAt(page, 600)).toEqual({ width: 3000, height: 6000 });
	});

	it('rounds to whole pixels', () => {
		const size = pixelSizeAt('<svg width="101" height="101"></svg>', 150);
		expect(Number.isInteger(size!.width)).toBe(true);
		expect(Number.isInteger(size!.height)).toBe(true);
	});

	it('never produces a zero dimension', () => {
		const size = pixelSizeAt('<svg width="1" height="1"></svg>', 1);
		expect(size!.width).toBeGreaterThanOrEqual(1);
		expect(size!.height).toBeGreaterThanOrEqual(1);
	});

	it('returns null when the figure cannot be measured', () => {
		expect(pixelSizeAt('<svg></svg>', 300)).toBeNull();
	});
});

describe('svgDataUrl', () => {
	it('survives characters that base64 would have thrown on', () => {
		// `btoa` rejects anything above U+00FF, so an en dash or a CJK label
		// would break the base64 form of this recipe.
		const svg = '<svg width="10" height="10"><text>Ausschluss – 名前</text></svg>';

		expect(() => svgDataUrl(svg)).not.toThrow();
		expect(decodeURIComponent(svgDataUrl(svg).split(',')[1])).toBe(svg);
	});

	it('declares the right media type and charset', () => {
		expect(svgDataUrl('<svg/>')).toMatch(/^data:image\/svg\+xml;charset=utf-8,/);
	});

	it('escapes characters that would end the attribute or the url', () => {
		const url = svgDataUrl('<svg width="10"/>');
		expect(url).not.toContain('"');
		expect(url).not.toContain('#');
	});
});
