import Dagre from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/svelte';

import { substepTarget, groupSource, type RegisteredNodeType } from '@/nodes/types';

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

	// Exclude substep and group nodes/edges from Dagre so we can layout them manually
	const excludedNodeTypes = new Set([substepTarget.nodeType, groupSource.nodeType]);

	edges
		.filter(
			(edge) =>
				edge.targetHandle !== substepTarget.handleId && edge.sourceHandle !== groupSource.handleId
		)
		// .filter((edge) => {
		// 	const src = nodes.find((n) => n.id === edge.source);
		// 	const tgt = nodes.find((n) => n.id === edge.target);
		// 	if (!src || !tgt) return false;
		// 	return !excludedNodeTypes.has(src.type) && !excludedNodeTypes.has(tgt.type);
		// })
		.forEach((edge) => g.setEdge(edge.source, edge.target));

	nodes
		.filter((node) => !excludedNodeTypes.has(node.type as RegisteredNodeType))
		.forEach((node) =>
			g.setNode(node.id, {
				...node,
				width: node.measured?.width ?? 0,
				height: node.measured?.height ?? 0
			})
		);

	Dagre.layout(g);
	const tbNodes = nodes
		.filter((node) => !excludedNodeTypes.has(node.type as RegisteredNodeType))
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
	const substepNodes = nodes
		.filter((node) => node.type === substepTarget.nodeType)
		.map((ssNode) => {
			const source = edges.find((edge) => edge.target == ssNode.id)?.source;
			if (source === undefined) {
				return { ...ssNode, position: { x: 0, y: 0 } } as Node;
			}
			
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
				const nodeWidth = ssNode?.measured?.width ?? 0;
				counts[source] = {
					...counts[source],
					x: counts[source].x + nodeWidth + gap
				};
			}

			const [anchorX, anchorY] = ssNode.origin ?? [0, 0];
			// We are shifting the node position (anchor=top left) to the anchor
			// so it matches the Svelte Flow node anchor point (default: top left).
			const x = counts[source].x + anchorX * (ssNode.measured?.width ?? 0);
			const y = counts[source].y + anchorY * (ssNode.measured?.height ?? 0);

			return {
				...ssNode,
				position: { x, y }
			};
		});

	// Manually layout group nodes to the left of their connected start/step nodes.
	const groupNodes = nodes
		.filter((n) => n.type === groupSource.nodeType)
		.map((gNode) => {
			const connections = edges.filter((e) => e.source === gNode.id).map((e) => e.target);
			if (connections.length === 0) {
				return { ...gNode, position: { x: 0, y: 0 } } as Node;
			}

			// find target nodes in tbNodes (they were laid out by Dagre)
			const targetNodes = connections
				.map((tid) => tbNodes.find((n) => n.id === tid))
				.filter((n): n is Node => !!n);

			if (targetNodes.length === 0) return { ...gNode, position: { x: 0, y: 0 } } as Node;

			const topYs = targetNodes.map((t) => t.position.y);
			const bottomYs = targetNodes.map((t) => t.position.y + (t.measured?.height ?? 0));
			const minTop = Math.min(...topYs);
			const maxBottom = Math.max(...bottomYs);
			const centerY = (minTop + maxBottom) / 2;

			// This only works because the origin is at Position.Right
			// Not robust, but works for now.
			const minLeft = Math.min(...targetNodes.map((t) => t.position.x));

			// Use 3x gap
			const x = minLeft - gap * ((targetNodes.length <= 1) ? 1 : 3);
			const y = centerY;

			return { ...gNode, position: { x, y }, origin: gNode.origin } as Node;
		});

	return {
		nodes: [...tbNodes, ...groupNodes, ...substepNodes],
		edges
	};
}
