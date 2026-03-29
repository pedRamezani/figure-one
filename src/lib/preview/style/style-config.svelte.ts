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

// -------------------------------------------------------------
// Alignment Mapping Keys (Typst alignment-mapping)
// -------------------------------------------------------------
export const aligmentOptions = ['left', 'center', 'right'] as const;
export type Alignment = (typeof aligmentOptions)[number];

export const textAligmentOptions = ['text-left', 'text-right'] as const;
export type TextAlignment = (typeof textAligmentOptions)[number];

export type ValueAligment = Alignment | TextAlignment;

// -------------------------------------------------------------
// Sub-objects of the configuration file
// -------------------------------------------------------------
export interface PageConfig {
	title: string;
	titleAlign: Alignment;
	tint: Tint;
	margin: number; // mm
}

export interface NodeConfig {
	cornerRadius: number; // pt
	stroke: number; // pt
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
		margin: 5
	},
	node: {
		cornerRadius: 5,
		stroke: 1
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
		subDeltaIndent: 3
	},
	groupBox: {
		tint: 'green'
	}
};

let config: TypstFlowchartConfig = $state({ ...defaultConfig });

export const styleConfig = {
	get current() {
		return config;
	},
	set current(value) {
		config = value;
	},
	reset() {
		config = defaultConfig;
	}
};
