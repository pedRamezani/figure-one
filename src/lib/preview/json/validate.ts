import type { TypstFlowchartData, TypstFlowchartDataLegacyV1 } from './convert';

import { isNumber, isObject } from '@/utils';

export type TypstRow = {
	row: number;
	col: number;
	group: string;
	label: string;
	value: number;
	delta: {
		label: string;
		value: number;
		substeps: {
			label: string;
			value: number;
		}[];
	} | null;
};

export function isFlowchartData(value: unknown): value is TypstFlowchartData {
	if (!Array.isArray(value) || value.length === 0) return false;

	for (const item of value) {
		if (!isObject(item)) return false;

		const maybe = item as any;
		if (!isNumber(maybe.row)) return false;
		if (!isNumber(maybe.col)) return false;
		if (typeof maybe.group !== 'string') return false;
		if (typeof maybe.label !== 'string') return false;
		if (!isNumber(maybe.value)) return false;

		if (maybe.delta === null) continue;
		if (!isObject(maybe.delta)) return false;

		const deltaMaybe = maybe.delta as any;
		if (typeof deltaMaybe.label !== 'string') return false;
		if (!isNumber(deltaMaybe.value)) return false;

		if (!Array.isArray(deltaMaybe.substeps)) return false;
		for (const sd of deltaMaybe.substeps) {
			if (!isObject(sd)) return false;

			if (typeof (sd as any).label !== 'string') return false;
			if (!isNumber((sd as any).value)) return false;
		}
	}

	return true;
}

export function isFlowchartDataV1(value: unknown): value is TypstFlowchartDataLegacyV1 {
	if (!Array.isArray(value) || value.length === 0) return false;

	for (const item of value) {
		if (typeof item !== 'object' || item === null) return false;

		const maybe = item as any;
		if (typeof maybe.stepLabel !== 'string') return false;
		if (typeof maybe.droppedLabel !== 'string') return false;
		if (typeof maybe.group !== 'string') return false;
		if (!isNumber(maybe.value)) return false;
		if (!isNumber(maybe.delta)) return false;

		if (!Array.isArray(maybe.substepDeltas)) return false;

		for (const sd of maybe.substepDeltas) {
			if (typeof sd !== 'object' || sd === null) return false;

			if (typeof (sd as any).label !== 'string') return false;
			if (!isNumber((sd as any).delta)) return false;
		}
	}

	return true;
}
