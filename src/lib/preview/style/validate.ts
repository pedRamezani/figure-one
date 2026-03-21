import type { TypstFlowchartConfig } from './style-config.svelte';
import {
	tintOptions,
	aligmentOptions,
	arrowBodies,
	arrowHeads,
	defaultConfig,
	type Hex,
	type Swatch,
	type Tint,
	type Alignment,
	type Arrow
} from './style-config.svelte';

function isObject(v: unknown): v is Record<string, unknown> {
	return typeof v === 'object' && v !== null;
}

function isNumber(n: unknown): n is number {
	return typeof n === 'number' && Number.isFinite(n);
}

function isHex(n: unknown): n is Hex {
	return typeof n === 'string' && n.at(0) === '#';
}

function isSwatch(n: unknown): n is Swatch {
	return typeof n === 'string' && tintOptions.includes(n as any);
}

function isTint(n: unknown): n is Tint {
	return isSwatch(n) || isHex(n);
}

function isAlignment(n: unknown): n is Alignment {
	return typeof n === 'string' && aligmentOptions.includes(n as any);
}

function isArrow(n: unknown): n is Arrow {
	if (typeof n !== 'string') return false;
	const allowedArrows = new Set<string>();
	for (const b of arrowBodies) for (const h of arrowHeads) allowedArrows.add(`${b}${h}`);
	return allowedArrows.has(n);
}

function hasOnlyKeys(obj: Record<string, unknown>, allowed: readonly string[]) {
	return Object.keys(obj).every((k) => allowed.includes(k));
}

// export function isFlowchartConfig(value: unknown): value is TypstFlowchartConfig {
//     if (!isObject(value)) return false;

//     const v = value as any;

//     // page
//     if (!isObject(v.page)) return false;
//     if (typeof v.page.title !== 'string') return false;
//     if (typeof v.page.titleAlign !== 'string' || !aligmentOptions.includes(v.page.titleAlign as any)) return false;
//     if (typeof v.page.tint !== 'string' || !tintOptions.includes(v.page.tint as any)) return false;
//     if (!isNumber(v.page.margin)) return false;

//     // node
//     if (!isObject(v.node)) return false;
//     if (!isNumber(v.node.cornerRadius)) return false;
//     if (!isNumber(v.node.stroke)) return false;

//     // edge
//     if (!isObject(v.edge)) return false;
//     if (!isNumber(v.edge.stroke)) return false;
//     if (!isNumber(v.edge.cornerRadius)) return false;

//     // mark
//     if (!isObject(v.mark)) return false;
//     if (typeof v.mark.arrow !== 'string') return false;
//     // build allowed arrows
//     const allowedArrows = new Set<string>();
//     for (const b of arrowBodies) for (const h of arrowHeads) allowedArrows.add(`${b}${h}`);
//     if (!allowedArrows.has(v.mark.arrow)) return false;
//     if (!isNumber(v.mark.markScale)) return false;
//     if (v.mark.markScale < 0 || v.mark.markScale > 100) return false;

//     // diagram
//     if (!isObject(v.diagram)) return false;
//     if (!isNumber(v.diagram.spacing)) return false;
//     if (!isNumber(v.diagram.cellWidth)) return false;
//     if (!isNumber(v.diagram.cellHeight)) return false;

//     // mainBox & stepBox
//     for (const boxKey of ['mainBox', 'stepBox'] as const) {
//         if (!isObject(v[boxKey])) return false;
//         const box = v[boxKey];
//         if (!isObject(box)) return false;
//         if (typeof box.tint !== 'string' || !tintOptions.includes(box.tint as any)) return false;
//         const w = box.width;
//         if (!(w === 'auto' || isNumber(w))) return false;
//     }

//     // groupBox
//     if (!isObject(v.groupBox)) return false;
//     if (typeof v.groupBox.tint !== 'string' || !tintOptions.includes(v.groupBox.tint as any)) return false;

//     return true;
// }

export function isPartialFlowchartConfig(value: unknown): value is Partial<TypstFlowchartConfig> {
	if (!isObject(value)) return false;

	const v = value as any;
	const allowedTop = [
		'page',
		'node',
		'edge',
		'mark',
		'diagram',
		'mainBox',
		'stepBox',
		'groupBox'
	] as const;
	if (!hasOnlyKeys(v, allowedTop as unknown as readonly string[])) return false;

	// page (all fields optional)
	if ('page' in v) {
		if (!isObject(v.page)) return false;
		const allowed = ['title', 'titleAlign', 'tint', 'margin'] as const;
		if (!hasOnlyKeys(v.page, allowed as unknown as readonly string[])) return false;
		if ('title' in v.page && typeof v.page.title !== 'string') return false;
		if ('titleAlign' in v.page && !isAlignment(v.page.titleAlign)) return false;
		if ('tint' in v.page && !isTint(v.page.tint)) return false;
		if ('margin' in v.page && !isNumber(v.page.margin)) return false;
	}

	// console.log('Pass 1');

	// node
	if ('node' in v) {
		if (!isObject(v.node)) return false;
		const allowed = ['cornerRadius', 'stroke'] as const;
		if (!hasOnlyKeys(v.node, allowed as unknown as readonly string[])) return false;
		if ('cornerRadius' in v.node && !isNumber(v.node.cornerRadius)) return false;
		if ('stroke' in v.node && !isNumber(v.node.stroke)) return false;
	}

	// console.log('Pass 2');

	// edge
	if ('edge' in v) {
		if (!isObject(v.edge)) return false;
		const allowed = ['stroke', 'cornerRadius'] as const;
		if (!hasOnlyKeys(v.edge, allowed as unknown as readonly string[])) return false;
		if ('stroke' in v.edge && !isNumber(v.edge.stroke)) return false;
		if ('cornerRadius' in v.edge && !isNumber(v.edge.cornerRadius)) return false;
	}

	// console.log('Pass 3');

	// mark
	if ('mark' in v) {
		if (!isObject(v.mark)) return false;
		const allowed = ['arrow', 'markScale'] as const;
		if (!hasOnlyKeys(v.mark, allowed as unknown as readonly string[])) return false;
		if ('arrow' in v.mark && !isArrow(v.mark.arrow)) return false;
		if ('markScale' in v.mark) {
			if (!isNumber(v.mark.markScale)) return false;
			if (v.mark.markScale < 0 || v.mark.markScale > 100) return false;
		}
	}

	// diagram
	if ('diagram' in v) {
		if (!isObject(v.diagram)) return false;
		const allowed = ['spacing', 'cellWidth', 'cellHeight'] as const;
		if (!hasOnlyKeys(v.diagram, allowed as unknown as readonly string[])) return false;
		if ('spacing' in v.diagram && !isNumber(v.diagram.spacing)) return false;
		if ('cellWidth' in v.diagram && !isNumber(v.diagram.cellWidth)) return false;
		if ('cellHeight' in v.diagram && !isNumber(v.diagram.cellHeight)) return false;
	}

	// console.log('Pass 4');

	// mainBox & stepBox
	if ('mainBox' in v) {
		if (!isObject(v.mainBox)) return false;
		const allowed = ['tint', 'width', 'valueAlign', 'valuePrefix', 'valueSuffix'] as const;
		if (!hasOnlyKeys(v.mainBox, allowed as unknown as readonly string[])) return false;
		if ('tint' in v.mainBox && !isTint(v.mainBox.tint)) return false;
		if ('width' in v.mainBox) {
			const w = v.mainBox.width;
			if (!(w === 'auto' || isNumber(w))) return false;
		}
		if ('valueAlign' in v.page && typeof v.page.valueAlign !== 'string') return false;
		if ('valuePrefix' in v.page && typeof v.page.valuePrefix !== 'string') return false;
		if ('valueSuffix' in v.page && typeof v.page.valueSuffix !== 'string') return false;
	}

	// console.log('Pass 5');

	if ('stepBox' in v) {
		if (!isObject(v.stepBox)) return false;
		const allowed = ['tint', 'width'] as const;
		if (!hasOnlyKeys(v.stepBox, allowed as unknown as readonly string[])) return false;
		if ('tint' in v.stepBox && !isTint(v.stepBox.tint)) return false;
		if ('width' in v.stepBox) {
			const w = v.stepBox.width;
			if (!(w === 'auto' || isNumber(w))) return false;
		}
	}

	// console.log('Pass 6');

	// groupBox
	if ('groupBox' in v) {
		if (!isObject(v.groupBox)) return false;
		const allowed = ['tint'] as const;
		if (!hasOnlyKeys(v.groupBox, allowed as unknown as readonly string[])) return false;
		if ('tint' in v.groupBox && !isTint(v.groupBox.tint)) return false;
	}

	// console.log('Pass 7');

	return true;
}

export function mergePartialFlowchartConfig(
	partial: Partial<TypstFlowchartConfig>,
	defaults: TypstFlowchartConfig = defaultConfig
): TypstFlowchartConfig {
	const p = partial ?? {};
	return {
		...defaults,
		page: {
			...defaults.page,
			...(p.page ?? {})
		},
		node: {
			...defaults.node,
			...(p.node ?? {})
		},
		edge: {
			...defaults.edge,
			...(p.edge ?? {})
		},
		mark: {
			...defaults.mark,
			...(p.mark ?? {})
		},
		diagram: {
			...defaults.diagram,
			...(p.diagram ?? {})
		},
		mainBox: {
			...defaults.mainBox,
			...(p.mainBox ?? {})
		},
		stepBox: {
			...defaults.stepBox,
			...(p.stepBox ?? {})
		},
		groupBox: {
			...defaults.groupBox,
			...(p.groupBox ?? {})
		}
	};
}
