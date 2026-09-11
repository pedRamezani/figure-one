// The project name is stored as a bare base name with no extension, and each
// exporter appends its own. One field therefore governs four filenames.
//
// The old behaviour returned the typed value unchanged when it already ended in
// `.json`, which was fine for the JSON export and would have produced
// `study.json.pdf` once the name reached the PDF export.

export const DEFAULT_BASE_NAME = 'flowchart';

const KNOWN_SUFFIXES = ['.data.json', '.json', '.pdf', '.svg'] as const;

/**
 * Normalises whatever the user typed into a base name.
 *
 * A trailing extension this app produces is stripped, so pasting an exported
 * filename back into the field does the expected thing. An unfamiliar extension
 * is left alone, because `study.v2` is a name, not a mistake.
 */
export function toBaseName(value: string): string {
	const trimmed = value.trim();

	for (const suffix of KNOWN_SUFFIXES) {
		if (trimmed.length > suffix.length && trimmed.toLowerCase().endsWith(suffix)) {
			return trimmed.slice(0, -suffix.length).trim();
		}
	}

	return trimmed;
}

/** The filename for one export. An empty base name falls back to `flowchart`. */
export function fileNameFor(baseName: string, suffix: (typeof KNOWN_SUFFIXES)[number]): string {
	const base = toBaseName(baseName) || DEFAULT_BASE_NAME;
	return `${base}${suffix}`;
}

export const projectFileName = (baseName: string) => fileNameFor(baseName, '.json');
export const dataFileName = (baseName: string) => fileNameFor(baseName, '.data.json');
export const pdfFileName = (baseName: string) => fileNameFor(baseName, '.pdf');
export const svgFileName = (baseName: string) => fileNameFor(baseName, '.svg');
