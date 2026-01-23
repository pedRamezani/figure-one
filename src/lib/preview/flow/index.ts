import Dagre from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/svelte';

import { substepTarget } from '@/nodes/types';

export function getLayoutedElements(
	nodes: Node[],
	edges: Edge[]
): {
	nodes: Node[];
	edges: Edge[];
} {
	const gap = 50;
	const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
	g.setGraph({ rankdir: 'TB', nodesep: gap, ranksep: gap });

	edges
		.filter((edge) => edge.targetHandle !== substepTarget.handleId)
		.forEach((edge) => g.setEdge(edge.source, edge.target));
	nodes
		.filter((node) => node.type !== substepTarget.nodeType)
		.forEach((node) =>
			g.setNode(node.id, {
				...node,
				width: node.measured?.width ?? 0,
				height: node.measured?.height ?? 0
			})
		);

	Dagre.layout(g);
	const tbNodes = nodes
		.filter((node) => node.type !== substepTarget.nodeType)
		.map((node) => {
			const position = g.node(node.id);
			const [anchorX, anchorY] = node.origin ?? [0, 0];
			// We are shifting the dagre node position (anchor=center center) to the anchor
			// so it matches the Svelte Flow node anchor point (default: top left).
			const x = position.x + (anchorX - 0.5) * (node.measured?.width ?? 0);
			const y = position.y + (anchorY - 0.5) * (node.measured?.height ?? 0);

			return {
				...node,
				position: { x, y }
			};
		});

	const counts: {
		[key: string]: {
			x: number;
			y: number;
		};
	} = {};
	const lrNodes = nodes
		.filter((node) => node.type === substepTarget.nodeType)
		.map((node) => {
			const source = edges.find((edge) => edge.target == node.id)?.source ?? '-1';
			if (!(source in counts)) {
				const sourceNode = tbNodes.find((node) => node.id == source);
				const [sourceAnchorX, sourceAnchorY] = sourceNode?.origin ?? [0, 0];
				const sourceNodeWidth = sourceNode?.measured?.width ?? 0;
				const sourceNodeHeight = sourceNode?.measured?.height ?? 0;
				const sourceNodeX = (sourceNode?.position.x ?? 0) - sourceAnchorX * sourceNodeWidth;
				const sourceNodeY = (sourceNode?.position.y ?? 0) - sourceAnchorY * sourceNodeHeight;
				counts[source] = {
					x: sourceNodeX + sourceNodeWidth + gap,
					y: sourceNodeY
				};
			} else {
				const nodeWidth = node?.measured?.width ?? 0;
				counts[source] = {
					...counts[source],
					x: counts[source].x + nodeWidth + gap
				};
			}

			const [anchorX, anchorY] = node.origin ?? [0, 0];
			// We are shifting the node position (anchor=top left) to the anchor
			// so it matches the Svelte Flow node anchor point (default: top left).
			const x = counts[source].x + anchorX * (node.measured?.width ?? 0);
			const y = counts[source].y + anchorY * (node.measured?.height ?? 0);

			return {
				...node,
				position: { x, y }
			};
		});

	return {
		nodes: [...tbNodes, ...lrNodes],
		edges
	};
}
