import { z } from 'zod';

import {
	aligmentOptions,
	arrowOptions,
	fontOptions,
	titlePlacementOptions,
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
const valueAlignmentSchema = z.enum(valueAligmentOptions);

export const partialFlowchartConfigSchema = z
	.object({
		page: z
			.object({
				title: z.string(),
				titleAlign: alignmentSchema,
				tint: tintSchema,
				margin: z.number(),
				transparent: z.boolean(),
				showTitle: z.boolean(),
				caption: z.string(),
				titlePlacement: z.enum(titlePlacementOptions),
				font: z.enum(fontOptions)
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
				spacingX: z.number(),
				spacingY: z.number(),
				cellWidth: z.number(),
				cellHeight: z.number()
			})
			.partial(),
		mainBox: z
			.object({
				tint: tintSchema,
				labelBold: z.boolean(),
				valueBold: z.boolean(),
				showValue: z.boolean(),
				width: widthSchema,
				textAlign: alignmentSchema,
				valueAlign: valueAlignmentSchema,
				valuePrefix: z.string(),
				valueSuffix: z.string(),
				subPopulationLabelBold: z.boolean(),
				subPopulationValueBold: z.boolean(),
				showSubPopulationValue: z.boolean(),
				subPopulationTextAlign: alignmentSchema,
				subPopulationAlign: valueAlignmentSchema,
				subPopulationPrefix: z.string(),
				subPopulationSuffix: z.string(),
				subPopulationIndent: z.number(),
				subPopulationNumbering: numberingSchema,
				subPopulationMarker: z.string().nullable()
			})
			.partial(),
		stepBox: z
			.object({
				tint: tintSchema,
				width: widthSchema,
				deltaLabelBold: z.boolean(),
				deltaValueBold: z.boolean(),
				deltaTextAlign: alignmentSchema,
				deltaAlign: valueAlignmentSchema,
				deltaPrefix: z.string(),
				deltaSuffix: z.string(),
				subDeltaLabelBold: z.boolean(),
				subDeltaValueBold: z.boolean(),
				showSubDeltaValue: z.boolean(),
				subDeltaTextAlign: alignmentSchema,
				subDeltaAlign: valueAlignmentSchema,
				subDeltaPrefix: z.string(),
				subDeltaSuffix: z.string(),
				subDeltaIndent: z.number(),
				subDeltaNumbering: numberingSchema,
				subDeltaMarker: z.string().nullable()
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
function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Rewrites fields that have been renamed or split since a document was written.
 *
 * The configuration carries no version of its own, deliberately: it is read
 * leniently and any gap is filled from the defaults. That makes this the place
 * for its backwards compatibility, rather than the document version chain.
 *
 * Without this a renamed field is simply an unknown key, which the schema
 * strips, so the user's setting would silently revert to the default.
 */
function applyLegacyConfigShape(value: unknown): unknown {
	if (!isRecord(value)) return value;

	const diagram = value.diagram;
	if (!isRecord(diagram)) return value;

	// One `spacing` became separate horizontal and vertical gaps. A document
	// written before the split meant the same value for both.
	const legacySpacing = diagram.spacing;
	const alreadySplit = diagram.spacingX !== undefined || diagram.spacingY !== undefined;

	if (typeof legacySpacing !== 'number' || alreadySplit) return value;

	return {
		...value,
		diagram: { ...diagram, spacingX: legacySpacing, spacingY: legacySpacing }
	};
}

export function readPartialConfig(input: unknown): PartialFlowchartConfig {
	const value = applyLegacyConfigShape(input);
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
