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

export type TypstStep = {
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

export type TypstSteps = (TypstStep | (TypstStep | null)[])[];

export type TypstGroups = Record<string, number[]>;

export type TypstFlowchartData = {
	steps: TypstSteps;
	groups: TypstGroups;
};

function mapToRectangular2DArray<T>(map: Map<[number, number], T>): (T | null)[][] {
	let maxRow = -1;
	let maxCol = -1;

	for (const [[row, col]] of map) {
		maxRow = Math.max(maxRow, row);
		maxCol = Math.max(maxCol, col);
	}

	const result: (T | null)[][] = Array.from({ length: maxRow + 1 }, () =>
		Array(maxCol + 1).fill(null)
	);

	for (const [[row, col], value] of map) {
		result[row][col] = value;
	}

	return result;
}

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
			const targets = raw.nodes.filter((n) => n.parentId === e.target).map((n) => n.id);
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

	const start = raw.nodes.find((n) => n.type === 'start');
	if (!start) {
		return { steps: [], groups: {} };
	}

	const colByNode = new Map<string, number>();
	colByNode.set(start.id, 0);

	function createStep(node: Node): TypstStep {
		const newStep: TypstStep = {
			label: (node.data.stepLabel as string) ?? (node.data.label as string) ?? '',
			value: (node.data.value as number) ?? 0,

			delta:
				node.type === 'step'
					? {
							label: (node.data.droppedLabel as string) ?? '',
							value: (node.data.delta as number) ?? 0,
							substeps: getSubsteps(node.id)
						}
					: null
		};

		return newStep;
	}

	// steps
	const mainSteps: TypstStep[] = [];
	const splitSteps: Map<[number, number], TypstStep> = new Map();

	// groups
	const mainGroups: string[] = [];
	const splitGroups: Map<number, string> = new Map();

	// column allocation per split
	let nextFreeCol = 0;

	// main traversal queue
	const queue: string[] = [start.id];
	while (queue.length > 0) {
		const id = queue.shift()!;

		const node = nodeById[id];
		const step = createStep(node);

		if ('row' in node.data && node.data.row !== null) {
			// Steps
			const row = node.data.row as number;
			const col = colByNode.get(id) ?? 0;
			splitSteps.set([row, col], step);

			// Groups
			const group = getGroup(node.id);
			if (!splitGroups.has(row)) {
				splitGroups.set(row, group);
			}
		} else {
			// Steps
			mainSteps.push(step);

			// Groups
			const group = getGroup(node.id);
			mainGroups.push(group);
		}

		// STEP → next step or split
		if (node.type === 'step' || node.type === 'start' || node.type === 'splitstart') {
			const nextStep = (children[id] ?? []).find((cid) => nodeById[cid].type === 'step');

			const nextSplit = (children[id] ?? []).find((cid) => nodeById[cid].type === 'split');

			if (nextStep) {
				colByNode.set(nextStep, colByNode.get(id)!);
				queue.push(nextStep);
				continue;
			}

			if (nextSplit) {
				const splitStarts = (children[nextSplit] ?? []).filter(
					(cid) => nodeById[cid].type === 'splitstart'
				);

				for (const ss of splitStarts) {
					colByNode.set(ss, nextFreeCol++);
					queue.push(ss);
				}
			}
		}
	}

	const typeSteps: TypstSteps = [...mainSteps, ...mapToRectangular2DArray(splitSteps)];

	const typeGroups: TypstGroups = (
		[
			...mainGroups,
			...splitGroups
				.entries()
				.toArray()
				.sort(([row, name]) => row)
				.map(([row, name]) => name)
		]
			.entries()
			.reduce(
				(acc, [row, name]) => {
					if (name.length > 0) {
						(acc[name] ??= []).push(row);
					}
					return acc;
				},
				{} as { [key: string]: number[] }
			)
	);

	return { steps: typeSteps, groups: typeGroups };
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
