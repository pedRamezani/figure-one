import { describe, expect, it } from 'vitest';

import { rowSpanOf } from './edge-types.ts';

describe('rowSpanOf', () => {
	it('defaults to one', () => {
		expect(rowSpanOf({})).toBe(1);
		expect(rowSpanOf({ data: undefined })).toBe(1);
		expect(rowSpanOf({ data: {} })).toBe(1);
	});

	it('reads a whole number of stages', () => {
		expect(rowSpanOf({ data: { rowSpan: 3 } })).toBe(3);
	});

	it('ignores nonsense rather than propagating it', () => {
		expect(rowSpanOf({ data: { rowSpan: 0 } })).toBe(1);
		expect(rowSpanOf({ data: { rowSpan: -2 } })).toBe(1);
		expect(rowSpanOf({ data: { rowSpan: 1.5 } })).toBe(1);
		expect(rowSpanOf({ data: { rowSpan: 'two' } })).toBe(1);
	});
});
