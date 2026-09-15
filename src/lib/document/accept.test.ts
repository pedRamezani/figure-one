import { describe, expect, it } from 'vitest';

import { MAX_FILE_SIZE, displaySize, rejectionReason, type Candidate } from './accept.ts';

function candidate(overrides: Partial<Candidate> = {}): Candidate {
	return { name: 'trial.json', size: 4_200, type: 'application/json', ...overrides };
}

describe('rejectionReason', () => {
	it('accepts a project file', () => {
		expect(rejectionReason(candidate())).toBeNull();
	});

	it('accepts a .json file whose type the browser could not work out', () => {
		// A file copied off a USB stick or served by something that guesses badly
		// arrives with no type, and is still a flowchart.
		expect(rejectionReason(candidate({ type: '' }))).toBeNull();
		expect(rejectionReason(candidate({ type: 'application/octet-stream' }))).toBeNull();
	});

	it('accepts a JSON type even when the name does not say so', () => {
		expect(rejectionReason(candidate({ name: 'trial' }))).toBeNull();
	});

	it('is not case sensitive about the extension', () => {
		expect(rejectionReason(candidate({ name: 'TRIAL.JSON', type: '' }))).toBeNull();
	});

	it('rejects a file that is not JSON', () => {
		expect(rejectionReason(candidate({ name: 'figure.png', type: 'image/png' }))).toBe(
			'figure.png is not a JSON file.'
		);
	});

	it('rejects a file too large to be a flowchart', () => {
		// Without this, `file.text()` reads the whole thing into memory and the
		// tab stops responding with nothing shown.
		const reason = rejectionReason(candidate({ size: MAX_FILE_SIZE + 1 }));

		expect(reason).toContain('too large');
		expect(reason).toContain('8 MB');
	});

	it('allows a file exactly at the limit', () => {
		expect(rejectionReason(candidate({ size: MAX_FILE_SIZE }))).toBeNull();
	});

	it('checks the type before the size, so the clearer reason wins', () => {
		const reason = rejectionReason(
			candidate({ name: 'clip.mp4', type: 'video/mp4', size: 900_000_000 })
		);

		expect(reason).toBe('clip.mp4 is not a JSON file.');
	});
});

describe('displaySize', () => {
	it('scales to the unit a person would use', () => {
		expect(displaySize(0)).toBe('0 B');
		expect(displaySize(999)).toBe('999 B');
		expect(displaySize(1_000)).toBe('1 kB');
		expect(displaySize(4_200)).toBe('4 kB');
		expect(displaySize(8_000_000)).toBe('8 MB');
		expect(displaySize(2_400_000_000)).toBe('2.4 GB');
	});
});
