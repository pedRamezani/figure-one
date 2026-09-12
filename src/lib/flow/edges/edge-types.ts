/**
 * The edge vocabulary.
 *
 * Edges carry almost nothing today. The one thing they do carry is how many
 * stages of the diagram they cross, which is how a split arm says it has
 * nothing at a stage. See `docs/adr/0002-skipping-a-stage-in-a-split-arm.md`.
 */

/** An edge spans one stage unless it says otherwise. */
export const DEFAULT_ROW_SPAN = 1;

interface EdgeWithSpan {
	data?: Record<string, unknown> | undefined;
}

/**
 * How many stages an edge crosses.
 *
 * A span greater than one is how an arm says it has nothing at a stage. The
 * gap lives on the connection that spans it, so deleting a node and rewiring
 * resets it rather than stranding the number on a neighbour.
 *
 * Anything that is not a whole number of stages is read as one. This is the
 * only place that rule lives; do not repeat it at call sites.
 */
export function rowSpanOf(edge: EdgeWithSpan): number {
	const span = edge.data?.rowSpan;

	if (typeof span !== 'number' || !Number.isInteger(span) || span < 1) {
		return DEFAULT_ROW_SPAN;
	}

	return span;
}
