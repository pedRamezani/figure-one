import Dagre from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/svelte';

import {
	subPopulationTarget,
	substepTarget,
	groupSource,
	rowTargetGroup,
	stepTargetInput
} from './handles/handle-types.ts';
import type { RegisteredNodeType } from './nodes/node-types.ts';
import { computeRows } from './rows.ts';
import { NODE_GAP, ROW_PADDING } from './geometry.ts';

export function getLayoutedElements(
	nodes: Node[],
	edges: Edge[]
): {
	nodes: Node[];
	edges: Edge[];
} {
	// Rows are derived from the graph rather than read off the nodes, so this
	// agrees with the canvas and with the Typst conversion by construction.
	const rows = computeRows(nodes, edges);

	// Config
	const rowPadding = ROW_PADDING;
	const gap = NODE_GAP;
	const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
	g.setGraph({ rankdir: 'TB', nodesep: gap, ranksep: gap });

	// Exclude substep and group nodes/edges from Dagre so we can layout them manually
	// Also exclude row nodes
	const excludedNodeTypes = new Set([
		groupSource.nodeType,
		rowTargetGroup.nodeType,
		subPopulationTarget.nodeType,
		substepTarget.nodeType
	]);

	const rawGroupNodes = nodes.filter((n) => n.type === groupSource.nodeType);
	const rawRowNodes = nodes.filter((n) => n.type === rowTargetGroup.nodeType);
	const rawSubstepNodes = nodes.filter(
		(n) => n.type === substepTarget.nodeType || n.type === subPopulationTarget.nodeType
	);

	const includedNodes = nodes.filter(
		(node) => !excludedNodeTypes.has(node.type as RegisteredNodeType)
	);

	const includedEdges = edges.filter((edge) => {
		const src = nodes.find((n) => n.id === edge.source);
		const tgt = nodes.find((n) => n.id === edge.target);
		if (!src || !tgt) return false;
		return (
			!excludedNodeTypes.has(src.type as RegisteredNodeType) &&
			!excludedNodeTypes.has(tgt.type as RegisteredNodeType)
		);
	});

	// Layout included nodes & edges
	includedEdges.forEach((edge) => g.setEdge(edge.source, edge.target));
	includedNodes.forEach((node) =>
		g.setNode(node.id, {
			...node,
			width: node.measured?.width ?? 0,
			height: node.measured?.height ?? 0
		})
	);
	Dagre.layout(g);

	// Convert Dagre coordinates back to Svelte Flow coordinates
	const tbNodes = includedNodes.map((node) => {
		const position = g.node(node.id);
		const [anchorX, anchorY] = node.origin ?? [0, 0];
		// We are shifting the dagre node position (anchor=center center) to the anchor
		// so it matches the Svelte Flow node anchor point (default: top left).
		// Theoretically we also have to adjust this to be relative coordinates for child nodes
		// We can mitigate this simply by setting the position of the parent node to the (0,0).
		const x = position.x + (anchorX - 0.5) * (node.measured?.width ?? 0);
		const y = position.y + (anchorY - 0.5) * (node.measured?.height ?? 0);

		return {
			...node,
			position: { x, y }
		};
	});

	/**
	 * Where the next attachment for each anchor goes.
	 *
	 * `lastWidth` is the width of the node most recently placed against this
	 * anchor. The cursor has to advance by that, not by the width of the node
	 * about to be placed, which is what it used to do: the two only agree when
	 * every attachment happens to be the same width.
	 */
	const cursors: Record<string, { x: number; y: number; lastWidth: number }> = {};

	/** What a node actually measures, falling back to any width it declares. */
	const measuredWidth = (node: Node) => node.measured?.width ?? node.width ?? 0;
	const measuredHeight = (node: Node) => node.measured?.height ?? node.height ?? 0;
	// Sub-populations belong to the population box and substeps to the exclusion
	// box beside it, so grouping by type keeps the two lists from interleaving
	// on the canvas. Within a type, the existing order by anchor position is
	// what the Typst output already shows.
	const attachmentOrder: Record<string, number> = {
		[subPopulationTarget.nodeType]: 0,
		[substepTarget.nodeType]: 1
	};

	const anchorX = (node: Node) => {
		const source = edges.find((edge) => edge.target == node.id)?.source;
		return tbNodes.find((n) => n.id === source)?.position.x ?? 0;
	};

	const substepNodes = rawSubstepNodes
		.sort((n1, n2) => {
			const byAnchor = anchorX(n1) - anchorX(n2);
			if (byAnchor !== 0) return byAnchor;

			return (attachmentOrder[n1.type ?? ''] ?? 0) - (attachmentOrder[n2.type ?? ''] ?? 0);
		})
		.map((ssNode) => {
			const source = edges.find((edge) => edge.target == ssNode.id)?.source;
			if (source === undefined) {
				return { ...ssNode, position: { x: 0, y: 0 } } as Node;
			}

			let anchorNode = tbNodes.find((node) => node.id === source);
			if (rows.get(ssNode.id) !== null) {
				const stepNodes = tbNodes
					.filter((n) => n.parentId === ssNode.parentId && n.type === stepTargetInput.nodeType)
					.sort((n1, n2) => n2.position.x - n1.position.x);

				if (stepNodes.length !== 0) {
					anchorNode = stepNodes[0];
				}
			}

			if (anchorNode === undefined) {
				return { ...ssNode, position: { x: 0, y: 0 } } as Node;
			}

			const width = measuredWidth(ssNode);
			const cursor = cursors[anchorNode.id];

			if (cursor === undefined) {
				const [anchorOriginX, anchorOriginY] = anchorNode.origin ?? [0, 0];
				const anchorWidth = measuredWidth(anchorNode);
				const anchorHeight = measuredHeight(anchorNode);

				cursors[anchorNode.id] = {
					x: anchorNode.position.x - anchorOriginX * anchorWidth + anchorWidth + gap,
					y: anchorNode.position.y - anchorOriginY * anchorHeight,
					lastWidth: width
				};
			} else {
				cursor.x += cursor.lastWidth + gap;
				cursor.lastWidth = width;
			}

			const [originX, originY] = ssNode.origin ?? [0, 0];
			// We are shifting the node position (anchor=top left) to the anchor
			// so it matches the Svelte Flow node anchor point (default: top left).
			const x = cursors[anchorNode.id].x + originX * width;
			const y = cursors[anchorNode.id].y + originY * measuredHeight(ssNode);

			return {
				...ssNode,
				position: { x, y }
			};
		});

	// Manually layout group nodes to the left of their connected start/step nodes.
	const groupNodes = rawGroupNodes.map((gNode) => {
		const connections = edges.filter((e) => e.source === gNode.id).map((e) => e.target);
		if (connections.length === 0) {
			return { ...gNode, position: { x: 0, y: 0 } } as Node;
		}

		const rowTargetNodesIds = connections
			.map((tid) => rawRowNodes.find((n) => n.id === tid))
			.filter((n): n is Node => !!n)
			.map((n) => n.id);

		const connectedToRow = rowTargetNodesIds.length > 0;

		// find target nodes in tbNodes (they were laid out by Dagre)
		const tbTargetNodes = connections
			.map((tid) =>
				tbNodes.find((n) => n.id === tid || rowTargetNodesIds.includes(n.parentId ?? ''))
			)
			.filter((n): n is Node => !!n);

		if (tbTargetNodes.length === 0) return { ...gNode, position: { x: 0, y: 0 } } as Node;

		const topYs = tbTargetNodes.map((t) => t.position.y);
		const bottomYs = tbTargetNodes.map(
			(t) => t.position.y + (1 - (t.origin?.[1] ?? 0)) * (t.measured?.height ?? 0)
		);
		const minTop = Math.min(...topYs);
		const maxBottom = Math.max(...bottomYs);
		const centerY = (minTop + maxBottom) / 2;

		// This only works because the origin is at Position.Right
		// Not robust, but works for now.
		const minLeft = Math.min(
			...tbTargetNodes.map((t) => t.position.x - (t.origin?.[0] ?? 0) * (t.measured?.width ?? 0))
		);

		// Use 3x gap
		// TODO: Fix origin similar to above: anchorX * (ssNode.measured?.width ?? 0)
		// Then remove the hard coded origin override
		const x =
			minLeft - gap * (tbTargetNodes.length <= 1 ? 1 : 3) - (connectedToRow ? rowPadding : 0);
		const y = centerY;

		return { ...gNode, position: { x, y }, origin: [1, 0.5] } as Node;
	});

	// Add back row nodes with reset position for now
	const rowNodes = rawRowNodes.map((n) => ({
		...n,
		// This will be adjusted by the row nodes internal logic anyway,
		// which will be doing the final layouting for us.
		position: { x: 0, y: 0 }
	}));

	return {
		// Parent nodes have to come first
		nodes: [...rowNodes, ...tbNodes, ...groupNodes, ...substepNodes],
		edges
	};
}
