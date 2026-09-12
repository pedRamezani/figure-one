import type { Edge, Node } from '@xyflow/svelte';

import { rowSpanOf } from './edges/edge-types.ts';
import { ROW_PADDING } from './geometry.ts';
import { splitstartTargetInput, stepTargetInput, substepTarget } from './handles/handle-types.ts';

/**
 * Which split row each node sits in.
 *
 * A row is a stage of the diagram, shared across every arm of a split. It is a
 * pure function of the graph, not something a node carries: a `splitstart` is
 * row zero, each step downstream advances by the span of the edge that reaches
 * it, a substep inherits its step's row, and anything not reachable from a
 * `splitstart` is on the main spine and has no row at all.
 *
 * This used to be stored on each node and maintained by four separate effects,
 * every one of them guarded by a hand-written equality check to stop it looping.
 */

export type RowMap = ReadonlyMap<string, number | null>;

export function computeRows(
	nodes: readonly Node[],
	edges: readonly Edge[]
): Map<string, number | null> {
	const rows = new Map<string, number | null>();
	const typeById = new Map<string, string | undefined>();

	for (const node of nodes) {
		rows.set(node.id, null);
		typeById.set(node.id, node.type);
	}

	const incoming = new Map<string, Edge[]>();
	const outgoing = new Map<string, Edge[]>();

	for (const edge of edges) {
		if (!rows.has(edge.source) || !rows.has(edge.target)) continue;

		let into = incoming.get(edge.target);
		if (!into) incoming.set(edge.target, (into = []));
		into.push(edge);

		let from = outgoing.get(edge.source);
		if (!from) outgoing.set(edge.source, (from = []));
		from.push(edge);
	}

	// Row zero is every connected split start. A split start with nothing
	// feeding it is not part of a split yet and stays on the main spine.
	const queue: string[] = [];

	for (const node of nodes) {
		if (node.type !== 'splitstart') continue;

		const connected = (incoming.get(node.id) ?? []).some(
			(edge) => edge.targetHandle === splitstartTargetInput.handleId
		);
		if (!connected) continue;

		rows.set(node.id, 0);
		queue.push(node.id);
	}

	// Breadth first so the shortest path to a node wins, and visited so a cycle
	// introduced by hand-drawn edges cannot hang the walk.
	const visited = new Set<string>();

	while (queue.length > 0) {
		const id = queue.shift()!;
		if (visited.has(id)) continue;
		visited.add(id);

		const row = rows.get(id);
		if (row === null || row === undefined) continue;

		for (const edge of outgoing.get(id) ?? []) {
			const targetType = typeById.get(edge.target);

			if (edge.targetHandle === stepTargetInput.handleId && targetType === 'step') {
				rows.set(edge.target, row + rowSpanOf(edge));
				queue.push(edge.target);
				continue;
			}

			if (edge.targetHandle === substepTarget.handleId && targetType === 'substep') {
				// A substep belongs to the same stage as the step it hangs off.
				rows.set(edge.target, row);
				queue.push(edge.target);
			}
		}
	}

	return rows;
}

/**
 * Makes the row containers on the canvas match the derived rows.
 *
 * Returns a new node array, or null when nothing needs changing. Pure and
 * total, so the caller applies it in one assignment and never observes a half
 * reconciled canvas. Idempotent, so running it on its own output is a no-op.
 *
 * It does three jobs at once because they are one job: a node that gained a row
 * needs a container, a node that lost its row needs releasing, and a container
 * nobody is in needs removing.
 */
export function reconcileRowContainers(
	nodes: readonly Node[],
	rows: RowMap,
	allocateId: () => string
): Node[] | null {
	const containerById = new Map<string, Node>();
	for (const node of nodes) {
		if (node.type === 'row') containerById.set(node.id, node);
	}

	// The container already serving each row, judged by what is parented to it.
	const containerForRow = new Map<number, Node>();
	for (const node of nodes) {
		const row = rows.get(node.id);
		if (row === null || row === undefined) continue;
		if (node.parentId === undefined) continue;

		const container = containerById.get(node.parentId);
		if (container && !containerForRow.has(row)) containerForRow.set(row, container);
	}

	let changed = false;
	const created: Node[] = [];
	const kept: Node[] = [];

	for (const node of nodes) {
		if (node.type === 'row') {
			kept.push(node);
			continue;
		}

		const row = rows.get(node.id) ?? null;
		const currentParent =
			node.parentId === undefined ? undefined : containerById.get(node.parentId);

		// Absolute position, whichever container it is currently inside.
		const absolute = currentParent
			? {
					x: currentParent.position.x + node.position.x,
					y: currentParent.position.y + node.position.y
				}
			: node.position;

		if (row === null) {
			if (currentParent === undefined) {
				kept.push(node);
			} else {
				kept.push({ ...node, parentId: undefined, position: absolute });
				changed = true;
			}
			continue;
		}

		let container = containerForRow.get(row);

		if (container === undefined) {
			container = {
				id: allocateId(),
				type: 'row',
				data: {},
				origin: [0, 0],
				position: { x: absolute.x - ROW_PADDING, y: absolute.y - ROW_PADDING }
			} satisfies Node;

			containerForRow.set(row, container);
			containerById.set(container.id, container);
			created.push(container);
			changed = true;
		}

		if (node.parentId === container.id) {
			kept.push(node);
			continue;
		}

		kept.push({
			...node,
			parentId: container.id,
			position: {
				x: absolute.x - container.position.x,
				y: absolute.y - container.position.y
			}
		});
		changed = true;
	}

	// A container nobody is parented to has served its purpose.
	const occupied = new Set<string>();
	for (const node of kept) {
		if (node.parentId !== undefined) occupied.add(node.parentId);
	}

	const survivors = [...created, ...kept].filter(
		(node) => node.type !== 'row' || occupied.has(node.id)
	);

	if (survivors.length !== created.length + kept.length) changed = true;

	if (!changed) return null;

	// xyflow requires a parent to appear before its children.
	return [
		...survivors.filter((node) => node.type === 'row'),
		...survivors.filter((node) => node.type !== 'row')
	];
}
