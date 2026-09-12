// Pure configuration types, option lists and defaults.
//
// Deliberately free of runes and of any browser API, so that schemas and tests
// can import it from plain Node. The reactive store lives in
// `style-config.svelte.ts`, which re-exports everything here.

// -------------------------------------------------------------
// Tint Mapping Keys (Typst tint-mapping)
// -------------------------------------------------------------
export const tintOptions = [
	'black',
	'gray',
	'silver',
	'white',
	'navy',
	'blue',
	'aqua',
	'teal',
	'eastern',
	'purple',
	'fuchsia',
	'maroon',
	'red',
	'orange',
	'yellow',
	'olive',
	'green',
	'lime'
] as const;
export type Hex = `#${string}`;
export type Swatch = (typeof tintOptions)[number];
export type Tint = Swatch | Hex;

// -------------------------------------------------------------
// Arrow Body + Head Definitions
// -------------------------------------------------------------
export const arrowBodies = ['-', '=', '==', '--', '..'] as const;
export type ArrowBody = (typeof arrowBodies)[number];

export const arrowHeads = [
	'>',
	'>>',
	'>>>',
	'o',
	'O',
	'|>',
	'}>',
	'x',
	'X',
	'*',
	'@',
	'[]',
	'<>'
] as const;
export type ArrowHead = (typeof arrowHeads)[number];

// Combined arrow form, such as "-|>" or "==X"
export type Arrow = `${ArrowBody}${ArrowHead}`;

/** Every legal `${body}${head}` combination, built once. */
export const arrowOptions: readonly Arrow[] = arrowBodies.flatMap((body) =>
	arrowHeads.map((head) => `${body}${head}` as Arrow)
);

// -------------------------------------------------------------
// Alignment Mapping Keys (Typst alignment-mapping)
// -------------------------------------------------------------
export const aligmentOptions = ['left', 'center', 'right'] as const;
export type Alignment = (typeof aligmentOptions)[number];

export const textAligmentOptions = ['text-left', 'text-right'] as const;
export type TextAlignment = (typeof textAligmentOptions)[number];

export type ValueAligment = Alignment | TextAlignment;

export const valueAligmentOptions = [...aligmentOptions, ...textAligmentOptions] as const;

// -------------------------------------------------------------
// Numbering Mapping Keys (Typst alignment-mapping)
// -------------------------------------------------------------
export const numberingBodyOptions = [
	null,
	'1',
	'a',
	'A',
	'i',
	'I',
	// 'α', // Works, but disable for now
	// 'Α', // Works, but disable for now
	// '一',
	// '壹',
	// 'あ',
	// 'い',
	// 'ア',
	// 'イ',
	// 'א',
	// '가',
	// 'ㄱ',
	// '*',
	// '١', // Works, but disable for now
	// '۱', // Works, but disable for now
	// '१', // Works, but disable for now
	// '১',
	// 'ক',
	'①',
	'⓵'
] as const;
export type NumberingBody = (typeof numberingBodyOptions)[number];

export const numberingFormattingOptions = [
	null,
	'dot',
	'single parentheses',
	'double parentheses'
] as const;
export type NumberingFormatting = (typeof numberingFormattingOptions)[number];

export type Numbering =
	| `${string}${NumberingBody extends null ? '1' : NumberingBody}${string}`
	| null;

// -------------------------------------------------------------
// Sub-objects of the configuration file
// -------------------------------------------------------------
export interface PageConfig {
	title: string;
	titleAlign: Alignment;
	tint: Tint;
	margin: number; // mm
	/** Leaves the page unfilled, so exports composite onto whatever is behind. */
	transparent: boolean;
}

export interface NodeConfig {
	cornerRadius: number; // pt
	stroke: number; // pt
	inset: number; // pt
	outset: number; // pt
}

export interface EdgesConfig {
	stroke: number; // pt
	cornerRadius: number; // pt
}

export interface MarkConfig {
	arrow: Arrow;
	markScale: number; // 0–100
}

export interface DiagramConfig {
	spacing: number; // pt
	cellWidth: number; // mm
	cellHeight: number; // mm
}

export interface MainBoxConfig {
	tint: Tint;
	width: number | 'auto'; // mm or auto
	textAlign: Alignment;
	valueAlign: ValueAligment;
	valuePrefix: string;
	valueSuffix: string;
}

export interface StepBoxConfig {
	tint: Tint;
	width: number | 'auto'; // mm or auto
	deltaAlign: TextAlignment;
	deltaPrefix: string;
	deltaSuffix: string;
	subDeltaAlign: TextAlignment;
	subDeltaPrefix: string;
	subDeltaSuffix: string;
	subDeltaIndent: number; // spaces
	subDeltaNumbering: Numbering;
}

export interface GroupBoxConfig {
	tint: Tint;
}

// -------------------------------------------------------------
// Full Flowchart Configuration Schema
// -------------------------------------------------------------
export interface TypstFlowchartConfig {
	page: PageConfig;
	node: NodeConfig;
	edge: EdgesConfig;
	mark: MarkConfig;
	diagram: DiagramConfig;
	mainBox: MainBoxConfig;
	stepBox: StepBoxConfig;
	groupBox: GroupBoxConfig;
}

// -------------------------------------------------------------
// Default Values
// -------------------------------------------------------------
export const defaultConfig: TypstFlowchartConfig = {
	page: {
		title: 'Figure 1',
		titleAlign: 'left',
		tint: 'white',
		margin: 5,
		transparent: false
	},
	node: {
		cornerRadius: 5,
		stroke: 1,
		inset: 6,
		outset: 0
	},
	edge: {
		stroke: 1,
		cornerRadius: 5
	},
	mark: {
		arrow: '-|>',
		markScale: 70
	},
	diagram: {
		spacing: 8,
		cellWidth: 8,
		cellHeight: 8
	},
	mainBox: {
		tint: 'white',
		width: 80,
		textAlign: 'left',
		valueAlign: 'left',
		valuePrefix: '',
		valueSuffix: ''
	},
	stepBox: {
		tint: 'white',
		width: 80,
		deltaAlign: 'text-left',
		deltaPrefix: '',
		deltaSuffix: '',
		subDeltaAlign: 'text-left',
		subDeltaPrefix: '',
		subDeltaSuffix: '',
		subDeltaIndent: 3,
		subDeltaNumbering: null
	},
	groupBox: {
		tint: 'green'
	}
};

// -------------------------------------------------------------
// Filling in the gaps
// -------------------------------------------------------------

/** A configuration with any section, and any field of a section, left out. */
export type PartialFlowchartConfig = {
	[K in keyof TypstFlowchartConfig]?: Partial<TypstFlowchartConfig[K]>;
};

/**
 * Fills every gap in a partial configuration from the defaults.
 *
 * Missing fields are the normal case, not an error: a document written by an
 * older build simply has fewer of them.
 */
export function mergeFlowchartConfig(
	partial: PartialFlowchartConfig | undefined,
	defaults: TypstFlowchartConfig = defaultConfig
): TypstFlowchartConfig {
	const p = partial ?? {};

	return {
		page: { ...defaults.page, ...p.page },
		node: { ...defaults.node, ...p.node },
		edge: { ...defaults.edge, ...p.edge },
		mark: { ...defaults.mark, ...p.mark },
		diagram: { ...defaults.diagram, ...p.diagram },
		mainBox: { ...defaults.mainBox, ...p.mainBox },
		stepBox: { ...defaults.stepBox, ...p.stepBox },
		groupBox: { ...defaults.groupBox, ...p.groupBox }
	};
}
