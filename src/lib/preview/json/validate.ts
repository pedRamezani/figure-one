import type { TypstFlowchartData } from "./convert";

export function isFlowchartData(value: unknown): value is TypstFlowchartData {
    if (!Array.isArray(value) || value.length === 0) return false;

    function isNumber(n: unknown): n is number {
        return typeof n === 'number' && Number.isFinite(n);
    }

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