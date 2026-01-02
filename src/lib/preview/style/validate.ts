import type { TypstFlowchartConfig } from "./style-config.svelte";
import { tintOptions, aligmentOptions, arrowBodies, arrowHeads } from "./style-config.svelte";

function isObject(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null;
}

function isNumber(n: unknown): n is number {
    return typeof n === 'number' && Number.isFinite(n);
}

export function isFlowchartConfig(value: unknown): value is TypstFlowchartConfig {
    if (!isObject(value)) return false;

    const v = value as any;

    // page
    if (!isObject(v.page)) return false;
    if (typeof v.page.title !== 'string') return false;
    if (typeof v.page.titleAlign !== 'string' || !aligmentOptions.includes(v.page.titleAlign as any)) return false;
    if (typeof v.page.tint !== 'string' || !tintOptions.includes(v.page.tint as any)) return false;
    if (!isNumber(v.page.margin)) return false;

    // node
    if (!isObject(v.node)) return false;
    if (!isNumber(v.node.cornerRadius)) return false;
    if (!isNumber(v.node.stroke)) return false;

    // edge
    if (!isObject(v.edge)) return false;
    if (!isNumber(v.edge.stroke)) return false;
    if (!isNumber(v.edge.cornerRadius)) return false;

    // mark
    if (!isObject(v.mark)) return false;
    if (typeof v.mark.arrow !== 'string') return false;
    // build allowed arrows
    const allowedArrows = new Set<string>();
    for (const b of arrowBodies) for (const h of arrowHeads) allowedArrows.add(`${b}${h}`);
    if (!allowedArrows.has(v.mark.arrow)) return false;
    if (!isNumber(v.mark.markScale)) return false;
    if (v.mark.markScale < 0 || v.mark.markScale > 100) return false;

    // diagram
    if (!isObject(v.diagram)) return false;
    if (!isNumber(v.diagram.spacing)) return false;
    if (!isNumber(v.diagram.cellWidth)) return false;
    if (!isNumber(v.diagram.cellHeight)) return false;

    // mainBox & stepBox
    for (const boxKey of ['mainBox', 'stepBox'] as const) {
        if (!isObject(v[boxKey])) return false;
        const box = v[boxKey];
        if (!isObject(box)) return false;
        if (typeof box.tint !== 'string' || !tintOptions.includes(box.tint as any)) return false;
        const w = box.width;
        if (!(w === 'auto' || isNumber(w))) return false;
    }

    // groupBox
    if (!isObject(v.groupBox)) return false;
    if (typeof v.groupBox.tint !== 'string' || !tintOptions.includes(v.groupBox.tint as any)) return false;

    return true;
}