import type { Node, Edge, Viewport } from '@xyflow/svelte';

import {
	groupSource,
	rowTargetGroup,
	startSourceOutput,
	startTargetGroup,
	stepSourceSubsteps,
	stepSourceOutput,
	stepTargetGroup,
	stepTargetInput,
	substepTarget
} from '@/nodes/types';

export type TypstFlowchartDataLegacyV1 = {
	stepLabel: string;
	droppedLabel: string;
	group: string;
	value: number;
	delta: number;
	substepDeltas: {
		label: string;
		delta: number;
	}[];
}[];

export type TypstRow = {
	// Removing row, col and switching to id, next will
	// allow to correctly draw edges from node to split nodes below
	// it is needed if multiple splits are allowed to know where the
	// split is coming from. => Is this really needed for a CONSORT flowchart?
	// Using id, next has 2 disatvantages:
	// 1. Groups are row based. I want to pass the group info seperatly later like:
	// {"label": "groupname", rows: [1, 2, 3]}
	// 2. After a split we may want to align similiar steps accros the splits on the same row
	// A
	// |
	// B
	// |  \
	// C1 C2
	// |  |
	// D1 skipped
	// |  |
	// E1 E2
	// id: string;
	// next: string[];
	row: number;
	col: number;

	group: string;

	label: string;
	value: number;

	delta: {
		label: string;
		value: number;
		substeps: {
			label: string;
			value: number;
		}[];
	} | null;
};

export type TypstFlowchartData = TypstRow[];

export function convertFlowchartToTypstFlowchartData(raw: {
	nodes: Node[];
	edges: Edge[];
	viewport: Viewport;
}): TypstFlowchartData {
	const nodeById = Object.fromEntries(raw.nodes.map((n) => [n.id, n]));

	// adjacency
	const children: Record<string, string[]> = {};
	const parents: Record<string, string[]> = {};

	for (const e of raw.edges) {
		if (e.targetHandle === rowTargetGroup.handleId) {
			// special case for row node (not connected, but parentId of other nodes)
			const targets = raw.nodes.filter(n => n.parentId === e.target).map(n => n.id)
			for (const t of targets) {
				children[e.source] ??= [];
				children[e.source].push(t);
		
				parents[t] ??= [];
				parents[t].push(e.source);
			}
		} else {
			// regular case
			children[e.source] ??= [];
			children[e.source].push(e.target);
	
			parents[e.target] ??= [];
			parents[e.target].push(e.source);
		}
	}

	// helpers
	const getGroup = (id: string): string => {
		const g = parents[id]?.find((pid) => nodeById[pid].type === 'groups');
		return g ? (nodeById[g].data.group as string) : '';
	};

	const getSubsteps = (stepId: string) =>
		(children[stepId] ?? [])
			.map((id) => nodeById[id])
			.filter((n) => n.type === 'substep')
			.map((n) => ({
				label: n.data.label as string,
				value: n.data.delta as number
			}));

	const rows: TypstFlowchartData = [];

	let currentRow = 0;

	// column allocation per split
	let nextFreeCol = 0;
	const colByNode = new Map<string, number>();

	const start = raw.nodes.find((n) => n.type === 'start');
	if (!start) {
		return [];
	}

	colByNode.set(start.id, 0);

	function emitNode(nodeId: string, row: number) {
		const node = nodeById[nodeId];
		const col = colByNode.get(nodeId) ?? 0;

		const newRow: TypstRow = {
			// id: nodeId,
			row,
			col,

			group: getGroup(nodeId),

			label: (node.data.stepLabel as string) ?? (node.data.label as string) ?? '',
			value: (node.data.value as number) ?? 0,

			delta:
				node.type === 'step'
					? {
							label: (node.data.droppedLabel as string) ?? '',
							value: (node.data.delta as number) ?? 0,
							substeps: getSubsteps(nodeId)
						}
					: null
		};

		rows.push(newRow);
	}

	// main traversal queue
	const queue: Array<{ id: string; row: number }> = [{ id: start.id, row: currentRow }];

	while (queue.length > 0) {
		const { id, row } = queue.shift()!;
		currentRow = Math.max(currentRow, row);

		emitNode(id, row);

		const node = nodeById[id];

		// STEP → next step or split
		if (node.type === 'step' || node.type === 'start' || node.type === 'splitstart') {
			const nextStep = (children[id] ?? []).find((cid) => nodeById[cid].type === 'step');

			const split = (children[id] ?? []).find((cid) => nodeById[cid].type === 'split');

			if (nextStep) {
				colByNode.set(nextStep, colByNode.get(id)!);
				queue.push({ id: nextStep, row: row + 1 });
				continue;
			}

			if (split) {
				const splitStarts = (children[split] ?? []).filter(
					(cid) => nodeById[cid].type === 'splitstart'
				);

				for (const ss of splitStarts) {
					colByNode.set(ss, nextFreeCol++);
					queue.push({ id: ss, row: row + 1 });
				}
			}
		}
	}

	return rows;
}

export function parseTypstFlowchartJSON(json: TypstFlowchartData): {
	nodes: Node[];
	edges: Edge[];
} {
	const nodes: Node[] = [];
	const edges: Edge[] = [];

	if (!Array.isArray(json) || json.length === 0) return { nodes, edges };

	// Create start node (use deterministic id)
	const startEntry = json[0];
	const startId = 'start';
	nodes.push({
		id: startId,
		type: 'start',
		data: {
			label: startEntry.label,
			value: startEntry.value
		},
		position: { x: 0, y: 0 },
		deletable: false
	} as Node);

	// Steps begin at index 1
	const stepIds: string[] = [];

	for (let i = 1; i < json.length; i++) {
		const entry = json[i];
		const stepId = `step-${i}`;
		stepIds.push(stepId);

		nodes.push({
			id: stepId,
			type: 'step',
			data: {
				stepLabel: entry.label,
				droppedLabel: entry.delta?.label ?? '',
				value: entry.value,
				delta: entry.delta?.value ?? 0,
				row: null
			},
			position: { x: 0, y: 0 }
		} as Node);

		// substeps
		for (let j = 0; j < (entry.delta?.substeps.length ?? 0); j++) {
			const s = entry.delta?.substeps[j];
			const subId = `substep-${i}-${j}`;
			nodes.push({
				id: subId,
				type: 'substep',
				data: { label: s?.label ?? '', delta: s?.value ?? 0 },
				position: { x: 0, y: 0 },
				origin: [0, 0.5],
				row: null
			} as Node);
			const edgeId = `${stepId}-${subId}`;
			edges.push({
				id: edgeId,
				source: stepId,
				sourceHandle: stepSourceSubsteps.handleId,
				target: subId,
				targetHandle: substepTarget.handleId
			} as Edge);
		}
	}

	// connect start -> first step (if exists)
	if (stepIds.length > 0) {
		const edgeId = `${startId}-${stepIds[0]}`;
		edges.push({
			id: edgeId,
			source: startId,
			sourceHandle: startSourceOutput.handleId,
			target: stepIds[0],
			targetHandle: stepTargetInput.handleId
		} as Edge);
	}

	// connect steps sequentially
	for (let k = 0; k < stepIds.length - 1; k++) {
		const edgeId = `${stepIds[k]}-${stepIds[k + 1]}`;
		edges.push({
			id: edgeId,
			source: stepIds[k],
			sourceHandle: stepSourceOutput.handleId,
			target: stepIds[k + 1],
			targetHandle: stepTargetInput.handleId
		} as Edge);
	}

	// Create unique group nodes and connect them to their start/step nodes
	const groupMap = new Map<string, string>();
	let gi = 0;
	function ensureGroup(name: string) {
		if (name !== '' && !groupMap.has(name)) {
			const gid = `group-${gi++}`;
			groupMap.set(name, gid);
			nodes.push({
				id: gid,
				type: 'groups',
				data: { group: name },
				position: { x: 0, y: 0 },
				origin: [1, 0.5]
			} as Node);
		}
		return groupMap.get(name)!;
	}

	// start
	if (startEntry.group) {
		const gid = ensureGroup(startEntry.group);
		const edgeId = `${gid}-${startId}`;
		edges.push({
			id: edgeId,
			source: gid,
			sourceHandle: groupSource.handleId,
			target: startId,
			targetHandle: startTargetGroup.handleId
		} as Edge);
	}

	// steps
	for (let i = 1; i < json.length; i++) {
		const entry = json[i];
		const stepId = stepIds[i - 1];
		if (entry.group) {
			const gid = ensureGroup(entry.group);
			const edgeId = `${gid}-${stepId}`;
			edges.push({
				id: edgeId,
				source: gid,
				sourceHandle: groupSource.handleId,
				target: stepId,
				targetHandle: stepTargetGroup.handleId
			} as Edge);
		}
	}

	return { nodes, edges };
}
