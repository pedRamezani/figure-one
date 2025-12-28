// -------------------------------------------------------------
// Tint Mapping Keys (Typst tint-mapping)
// -------------------------------------------------------------
export type Tint =
  | "black" | "gray" | "silver" | "white"
  | "navy" | "blue" | "aqua" | "teal" | "eastern"
  | "purple" | "fuchsia" | "maroon"
  | "red" | "orange" | "yellow"
  | "olive" | "green" | "lime";

// -------------------------------------------------------------
// Arrow Body + Head Definitions
// -------------------------------------------------------------
export const arrowBodies = ["-", "=", "==", "--", ".."] as const;
export type ArrowBody = typeof arrowBodies[number];

export const arrowHeads = [
  ">", ">>", ">>>",
  "o", "0", "|>", "}>",
  "x", "X", "*", "@", "[]", "<>"
] as const;
export type ArrowHead = typeof arrowHeads[number];

// Combined arrow form, such as "-|>" or "==X"
export type Arrow = `${ArrowBody}${ArrowHead}`;

// -------------------------------------------------------------
// Sub-objects of the configuration file
// -------------------------------------------------------------
export interface BlobConfig {
  cornerRadius: number; // pt
  stroke: number;       // pt
}

export interface EdgesConfig {
  stroke: number;       // pt
  cornerRadius: number; // pt
  arrow: Arrow;
}

export interface DiagramConfig {
  spacing: number;      // pt
  cellWidth: number;    // mm
  cellHeight: number;   // mm
  markScale: number;    // 0–100
}

export interface BoxConfig {
  tint: Tint;
  width: number | "auto"; // mm or auto
}

export interface GroupBoxConfig {
  tint: Tint;
}

// -------------------------------------------------------------
// Full Flowchart Configuration Schema
// -------------------------------------------------------------
export interface FlowchartConfig {
  blob: BlobConfig;
  edges: EdgesConfig;
  diagram: DiagramConfig;
  mainBox: BoxConfig;
  stepBox: BoxConfig;
  groupBox: GroupBoxConfig;
}

// -------------------------------------------------------------
// Default Values
// -------------------------------------------------------------
export const defaultConfig: FlowchartConfig = {
  blob: {
    cornerRadius: 5,
    stroke: 1
  },
  edges: {
    stroke: 1,
    cornerRadius: 5,
    arrow: '-|>'
  },
  diagram: {
    spacing: 8,
    cellWidth: 8,
    cellHeight: 8,
    markScale: 70
  },
  mainBox: {
    tint: "white",
    width: 80
  },
  stepBox: {
    tint: "white",
    width: 80
  },
  groupBox: {
    tint: "green"
  }
};

let config: FlowchartConfig = $state({...defaultConfig});

export const styleConfig = {
  get current() { return config },
  set current(value) { config = value },
  reset() {config = defaultConfig}
}