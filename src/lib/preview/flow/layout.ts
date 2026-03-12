import Dagre from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/svelte';

import { substepTarget, groupSource, rowTargetGroup, type RegisteredNodeType } from '@/nodes/types';

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
	// Also exclude row nodes
	const excludedNodeTypes = new Set([
		substepTarget.nodeType,
		groupSource.nodeType,
		rowTargetGroup.nodeType
	]);

	edges
		.filter(
			(edge) =>
				edge.targetHandle !== substepTarget.handleId &&
				edge.sourceHandle !== groupSource.handleId &&
				edge.targetHandle != rowTargetGroup.handleId
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
			// Theoretically we also have to adjust this to be relative coordinates for child nodes
			// We can mitigate this simply by setting the position of the parent node to the (0,0).
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

	const rawRowNodes = nodes.filter((n) => n.type === rowTargetGroup.nodeType);

	// Manually layout group nodes to the left of their connected start/step nodes.
	const groupNodes = nodes
		.filter((n) => n.type === groupSource.nodeType)
		.map((gNode) => {
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
			const x = minLeft - gap * (tbTargetNodes.length <= 1 ? 1 : 3) - (connectedToRow ? 20 : 0);
			const y = centerY;

			return { ...gNode, position: { x, y }, origin: [1, 0.5] } as Node;
		});

	// Add back row nodes for now
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
