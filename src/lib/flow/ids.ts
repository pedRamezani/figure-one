/**
 * Node and edge id allocation.
 *
 * Ids are short incremental strings and are part of the persisted document, so
 * they have to survive a save and load unchanged. An allocator is therefore
 * seeded from the highest id already present rather than reset to zero.
 *
 * This lives in its own module so that pure data code such as `convert.ts` can
 * mint ids without importing from a Svelte component.
 */

export type IdAllocator = () => string;

export interface Identified {
	id: string;
}

/** Creates an independent allocator. Pass one in tests for deterministic ids. */
export function createIdAllocator(start: number = 1): IdAllocator {
	let next = start;
	return () => `${next++}`;
}

/**
 * The highest numeric id in a set of nodes, plus one.
 *
 * Non-numeric ids are ignored rather than treated as zero, so a document
 * containing ids this app did not mint cannot drag the counter backwards.
 * Edge ids are deliberately not consulted: they are derived from node ids and
 * parsing them back out is what the old counter recovery got wrong.
 */
export function nextIdAfter(nodes: readonly Identified[]): number {
	let highest = 0;

	for (const node of nodes) {
		const parsed = Number(node.id);
		if (Number.isInteger(parsed) && parsed > highest) {
			highest = parsed;
		}
	}

	return highest + 1;
}

/** Canonical edge id for a connection. Must match everywhere edges are built. */
export function edgeId(source: string, target: string): string {
	return `${source}--${target}`;
}
