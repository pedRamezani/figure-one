import { z } from 'zod';

import {
	aligmentOptions,
	arrowOptions,
	textAligmentOptions,
	tintOptions,
	valueAligmentOptions,
	type Arrow,
	type Hex,
	type Numbering,
	type PartialFlowchartConfig
} from '@/preview/style/config';

// Every field is optional and unknown keys are stripped rather than rejected.
//
// That is deliberate in both directions. A document written by an older build
// is missing fields, and one written by a newer build carries extra ones;
// neither should be refused. The hand-rolled predicate this replaces rejected
// both, which is why the app could not re-import its own exports.

const hexSchema = z.custom<Hex>(
	(value) => typeof value === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(value),
	{ message: 'Expected a hex colour such as #1a2b3c' }
);

const tintSchema = z.union([z.enum(tintOptions), hexSchema]);

const arrowSet = new Set<string>(arrowOptions);
const arrowSchema = z.custom<Arrow>((value) => typeof value === 'string' && arrowSet.has(value), {
	message: 'Expected an arrow such as -|> built from a known body and head'
});

const widthSchema = z.union([z.number(), z.literal('auto')]);

// `Numbering` is a template literal type, so a plain string schema does not
// satisfy it. The runtime check is the same; only the inferred type differs.
const numberingSchema = z.custom<Numbering>(
	(value) => value === null || typeof value === 'string',
	{ message: 'Expected a numbering pattern or null' }
);

const alignmentSchema = z.enum(aligmentOptions);
const textAlignmentSchema = z.enum(textAligmentOptions);
const valueAlignmentSchema = z.enum(valueAligmentOptions);

export const partialFlowchartConfigSchema = z
	.object({
		page: z
			.object({
				title: z.string(),
				titleAlign: alignmentSchema,
				tint: tintSchema,
				margin: z.number(),
				transparent: z.boolean()
			})
			.partial(),
		node: z
			.object({
				cornerRadius: z.number(),
				stroke: z.number(),
				inset: z.number(),
				outset: z.number()
			})
			.partial(),
		edge: z
			.object({
				stroke: z.number(),
				cornerRadius: z.number()
			})
			.partial(),
		mark: z
			.object({
				arrow: arrowSchema,
				markScale: z.number().min(0).max(100)
			})
			.partial(),
		diagram: z
			.object({
				spacing: z.number(),
				cellWidth: z.number(),
				cellHeight: z.number()
			})
			.partial(),
		mainBox: z
			.object({
				tint: tintSchema,
				width: widthSchema,
				textAlign: alignmentSchema,
				valueAlign: valueAlignmentSchema,
				valuePrefix: z.string(),
				valueSuffix: z.string()
			})
			.partial(),
		stepBox: z
			.object({
				tint: tintSchema,
				width: widthSchema,
				deltaAlign: textAlignmentSchema,
				deltaPrefix: z.string(),
				deltaSuffix: z.string(),
				subDeltaAlign: textAlignmentSchema,
				subDeltaPrefix: z.string(),
				subDeltaSuffix: z.string(),
				subDeltaIndent: z.number(),
				subDeltaNumbering: numberingSchema
			})
			.partial(),
		groupBox: z
			.object({
				tint: tintSchema
			})
			.partial()
	})
	.partial();

export type PartialFlowchartConfigInput = z.infer<typeof partialFlowchartConfigSchema>;

/**
 * Reads a configuration leniently.
 *
 * A section that fails validation is dropped and the defaults fill in for it,
 * rather than the whole document being refused over one bad colour.
 */
export function readPartialConfig(value: unknown): PartialFlowchartConfig {
	const parsed = partialFlowchartConfigSchema.safeParse(value);
	if (parsed.success) {
		return parsed.data as PartialFlowchartConfig;
	}

	if (typeof value !== 'object' || value === null) {
		return {};
	}

	const salvaged: Record<string, unknown> = {};
	const shape = partialFlowchartConfigSchema.shape;

	for (const [section, sectionSchema] of Object.entries(shape)) {
		const candidate = (value as Record<string, unknown>)[section];
		if (candidate === undefined) continue;

		const result = sectionSchema.safeParse(candidate);
		if (result.success) {
			salvaged[section] = result.data;
		}
	}

	return salvaged as PartialFlowchartConfig;
}
