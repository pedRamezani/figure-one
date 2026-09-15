/**
 * Spacing shared across the canvas, in flow units.
 *
 * These were bare numbers repeated in files that have to agree with each other.
 * Disagreement showed up as a row container that visibly did not fit its
 * contents, or split arms placed at a different distance from the layout pass
 * than the one the layout would later give them.
 *
 * Only values that are shared, or whose meaning is not obvious where they are
 * used, belong here. A number used once under a well-named local constant is
 * clearer left where it is.
 */

/** Gap between a row container's edge and the nodes inside it. */
export const ROW_PADDING = 20;

/**
 * Space between two adjacent nodes.
 *
 * Used as dagre's separation in both directions, as the horizontal step when
 * placing substeps beside their step, and as the drop below a split where its
 * arms begin.
 */
export const NODE_GAP = 50;

/**
 * Horizontal distance between the arms of a split.
 *
 * Wide enough for a node plus `NODE_GAP` on either side, so freshly generated
 * arms do not overlap before the layout pass runs.
 */
export const SPLIT_COLUMN_GAP = 300;

/**
 * The grid a dragged node snaps to.
 *
 * Independent of `ROW_PADDING` despite currently sharing a value. Named so that
 * changing one does not read as needing to change the other.
 */
export const SNAP_GRID: [number, number] = [20, 20];
