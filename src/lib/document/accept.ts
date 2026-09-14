/**
 * What this app is willing to try to open.
 *
 * Pure, and separate from the importer, so both the drop and the Import button
 * are judged by the same rules and those rules can be tested without a DOM.
 */

/* The largest file worth reading. */
export const MAX_FILE_SIZE = 8_000_000;

/** Bytes in the units a person reads, decimal because storage sizes are quoted that way. */
export function displaySize(bytes: number): string {
	if (bytes < 1_000) return `${bytes} B`;
	if (bytes < 1_000_000) return `${Math.round(bytes / 1_000)} kB`;
	if (bytes < 1_000_000_000) return `${Math.round(bytes / 1_000_000)} MB`;

	return `${(bytes / 1_000_000_000).toFixed(1)} GB`;
}

/** The parts of a `File` that decide whether it can be opened. */
export type Candidate = Pick<File, 'name' | 'size' | 'type'>;

/**
 * Why a file cannot be opened, or null when it can be.
 *
 * The type check is deliberately lenient about the MIME type: a file that has
 * been renamed, copied off a USB stick or served by something that guesses
 * badly arrives as `application/octet-stream` or with no type at all, and it is
 * still a flowchart. The extension is the more reliable signal of the two.
 */
export function rejectionReason(file: Candidate): string | null {
	const isJson = file.type === 'application/json' || file.name.toLowerCase().endsWith('.json');
	if (!isJson) return `${file.name} is not a JSON file.`;

	if (file.size > MAX_FILE_SIZE) {
		return `${file.name} is ${displaySize(file.size)}, which is too large to be a flowchart (the limit is ${displaySize(MAX_FILE_SIZE)}).`;
	}

	return null;
}
