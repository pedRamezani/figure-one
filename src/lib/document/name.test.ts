import { describe, expect, it } from 'vitest';

import {
	dataFileName,
	pdfFileName,
	pngFileName,
	projectFileName,
	svgFileName,
	toBaseName
} from './name.ts';

describe('toBaseName', () => {
	it('leaves a plain name alone', () => {
		expect(toBaseName('trial-2026')).toBe('trial-2026');
	});

	it('trims surrounding whitespace', () => {
		expect(toBaseName('  trial  ')).toBe('trial');
	});

	it('strips an extension this app produces', () => {
		expect(toBaseName('trial.json')).toBe('trial');
		expect(toBaseName('trial.pdf')).toBe('trial');
		expect(toBaseName('trial.svg')).toBe('trial');
		expect(toBaseName('trial.png')).toBe('trial');
		expect(toBaseName('trial.data.json')).toBe('trial');
	});

	it('is case insensitive about the extension', () => {
		expect(toBaseName('trial.JSON')).toBe('trial');
	});

	it('leaves an unfamiliar extension alone', () => {
		expect(toBaseName('study.v2')).toBe('study.v2');
	});

	it('does not eat a name that is only an extension', () => {
		expect(toBaseName('.json')).toBe('.json');
	});

	it('is idempotent', () => {
		expect(toBaseName(toBaseName('trial.data.json'))).toBe('trial');
	});
});

describe('filenames', () => {
	it('gives one base name five consistent filenames', () => {
		expect(projectFileName('trial')).toBe('trial.json');
		expect(dataFileName('trial')).toBe('trial.data.json');
		expect(pdfFileName('trial')).toBe('trial.pdf');
		expect(svgFileName('trial')).toBe('trial.svg');
		expect(pngFileName('trial')).toBe('trial.png');
	});

	it('falls back when no name is set', () => {
		expect(projectFileName('')).toBe('flowchart.json');
		expect(pdfFileName('   ')).toBe('flowchart.pdf');
	});

	it('does not double up an extension the user typed', () => {
		// The old logic returned `study.json` unchanged, which would have produced
		// `study.json.pdf` once the name reached the PDF export.
		expect(pdfFileName('study.json')).toBe('study.pdf');
		expect(projectFileName('study.json')).toBe('study.json');
	});
});
