import type { TypstFlowchartData, TypstStep, TypstFlowchartDataLegacyV1 } from './convert';

import { isNumber, isObject } from '@/utils';

export function isTypstFlowchartData(value: unknown): value is TypstFlowchartData {
	if (!isObject(value)) return false;

	const maybe = value as any;

	// ---- groups ----
	if (!isObject(maybe.groups)) return false;

	for (const key of Object.keys(maybe.groups)) {
		const groupValue = maybe.groups[key];
		if (!Array.isArray(groupValue)) return false;

		for (const num of groupValue) {
			if (!isNumber(num)) return false;
		}
	}

	// ---- steps ----
	if (!isObject(maybe.steps)) return false;

	const steps = maybe.steps;

	// main: TypstStep[]
	if (!Array.isArray(steps.main)) return false;
	for (const step of steps.main) {
		if (!isTypstStep(step)) return false;
	}

	// splits: (TypstStep | null)[][]
	if (!Array.isArray(steps.splits)) return false;
	for (const row of steps.splits) {
		if (!Array.isArray(row)) return false;

		for (const entry of row) {
			if (entry === null) continue;
			if (!isTypstStep(entry)) return false;
		}
	}

	return true;
}

function isTypstStep(value: unknown): value is TypstStep {
	if (!isObject(value)) return false;

	const maybe = value as any;

	if (typeof maybe.label !== "string") return false;
	if (!isNumber(maybe.value)) return false;

	if (maybe.delta === null) return true;

	if (!isObject(maybe.delta)) return false;

	const delta = maybe.delta as any;

	if (typeof delta.label !== "string") return false;
	if (!isNumber(delta.value)) return false;

	if (!Array.isArray(delta.substeps)) return false;

	for (const sub of delta.substeps) {
		if (!isObject(sub)) return false;
		if (typeof (sub as any).label !== "string") return false;
		if (!isNumber((sub as any).value)) return false;
	}

	return true;
}

export function isTypstFlowchartDataV1(value: unknown): value is TypstFlowchartDataLegacyV1 {
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
