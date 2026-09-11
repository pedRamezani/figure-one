import { z } from 'zod';

import type {
	TypstFlowchartData,
	TypstGroups,
	TypstStep,
	TypstSteps
} from '@/preview/json/convert';

import { CURRENT_DATA_VERSION, DATA_KIND } from './kinds.ts';

// The data document: the semantic form of a flowchart, with no styling.
//
// Version one is the original flat array of steps. Version two is the current
// steps and groups shape. Version three adds the kind marker and drops styling.
//
// Styling is deliberately not part of this chain. A version one or two file on
// disk does carry a `config`, but that is read separately as a sidecar so that
// a version three export can be styling-free without a legacy import losing the
// user's configuration. See `readConfigSidecar` in `read.ts`.

// -------------------------------------------------------------
// Version 1: a flat array of steps, one group name per step
// -------------------------------------------------------------
const dataV1Schema = z
	.array(
		z.object({
			stepLabel: z.string(),
			droppedLabel: z.string().default(''),
			group: z.string().default(''),
			value: z.number(),
			delta: z.number().default(0),
			substepDeltas: z
				.array(
					z.object({
						label: z.string(),
						delta: z.number()
					})
				)
				.default([])
		})
	)
	.min(1);

export type DataV1 = z.infer<typeof dataV1Schema>;

// -------------------------------------------------------------
// Version 2 and 3: steps, splits and groups
// -------------------------------------------------------------
const substepSchema = z.object({
	label: z.string(),
	value: z.number()
});

const stepSchema: z.ZodType<TypstStep> = z.object({
	label: z.string(),
	value: z.number(),
	delta: z
		.object({
			label: z.string(),
			value: z.number(),
			substeps: z.array(substepSchema).default([])
		})
		.nullable()
		.default(null)
});

const stepsSchema: z.ZodType<TypstSteps> = z.object({
	main: z.array(stepSchema).default([]),
	splits: z.array(z.array(stepSchema.nullable())).default([])
});

const groupsSchema: z.ZodType<TypstGroups> = z.record(
	z.string(),
	z.array(z.number().int().nonnegative())
);

export const flowchartDataSchema: z.ZodType<TypstFlowchartData> = z.object({
	steps: stepsSchema,
	groups: groupsSchema.prefault({})
});

// -------------------------------------------------------------
// Migration chain
// -------------------------------------------------------------

/**
 * Version one stored one group name per step. Groups become indices into the
 * flat step sequence, and the first step has no delta because nothing has been
 * excluded before it.
 */
function migrateV1ToV2(legacy: DataV1): TypstFlowchartData {
	const main: TypstStep[] = [];
	const groups: TypstGroups = {};

	legacy.forEach((entry, index) => {
		main.push({
			label: entry.stepLabel,
			value: entry.value,
			delta:
				index === 0
					? null
					: {
							label: entry.droppedLabel,
							value: entry.delta,
							substeps: entry.substepDeltas.map((substep) => ({
								label: substep.label,
								value: substep.delta
							}))
						}
		});

		if (entry.group.length > 0) {
			(groups[entry.group] ??= []).push(index);
		}
	});

	return { steps: { main, splits: [] }, groups };
}

export type DataReadResult =
	| { ok: true; data: TypstFlowchartData; fromVersion: number }
	| { ok: false; error: string };

/**
 * Runs a data document up to the current version.
 *
 * Dispatch is on the declared version, not on the shape. A document whose
 * version and shape disagree is an error rather than something to guess at.
 */
export function readDataDocument(value: unknown, declaredVersion: number): DataReadResult {
	if (!Number.isInteger(declaredVersion) || declaredVersion < 1) {
		return { ok: false, error: `Unknown data document version: ${String(declaredVersion)}` };
	}

	if (declaredVersion > CURRENT_DATA_VERSION) {
		return {
			ok: false,
			error: `This file was written by a newer version of the app (data version ${declaredVersion}, this build understands up to ${CURRENT_DATA_VERSION}).`
		};
	}

	if (declaredVersion === 1) {
		const parsed = dataV1Schema.safeParse(value);
		if (!parsed.success) {
			return { ok: false, error: describeIssues('data version 1', parsed.error) };
		}
		return { ok: true, data: migrateV1ToV2(parsed.data), fromVersion: 1 };
	}

	// Versions 2 and 3 share a payload shape; 3 only adds the envelope marker.
	const parsed = flowchartDataSchema.safeParse(value);
	if (!parsed.success) {
		return {
			ok: false,
			error: describeIssues(`data version ${declaredVersion}`, parsed.error)
		};
	}

	return { ok: true, data: parsed.data, fromVersion: declaredVersion };
}

export function describeIssues(label: string, error: z.ZodError): string {
	const first = error.issues.slice(0, 3).map((issue) => {
		const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
		return `${path}: ${issue.message}`;
	});

	const more =
		error.issues.length > first.length ? ` (and ${error.issues.length - first.length} more)` : '';

	return `Could not read ${label}. ${first.join('; ')}${more}`;
}

/** The envelope written by the data export. Styling is deliberately absent. */
export function createDataDocument(data: TypstFlowchartData) {
	return {
		$kind: DATA_KIND,
		$version: CURRENT_DATA_VERSION,
		data
	};
}
