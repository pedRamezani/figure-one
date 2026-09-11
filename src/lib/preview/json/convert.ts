import type { Node, Edge } from '@xyflow/svelte';

import { createIdAllocator, edgeId, type IdAllocator } from '@/nodes/ids';

import {
	groupSource,
	rowTargetGroup,
	startSourceOutput,
	startTargetGroup,
	stepSourceSubsteps,
	stepSourceOutput,
	stepTargetGroup,
	stepTargetInput,
	substepTarget,
	splitSourceOutput,
	splitTargetInput,
	splitstartSourceOutput,
	splitstartTargetInput
} from '@/nodes/handles';

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

export type TypstSteps = {
	main: TypstStep[];
	splits: (TypstStep | null)[][];
};

export type TypstGroups = Record<string, number[]>;

export type TypstFlowchartData = {
	steps: TypstSteps;
	groups: TypstGroups;
};

/**
 * Group membership is expressed as indices into a single flat sequence:
 * every main step in order, followed by every split row in row order.
 *
 * Both directions of the conversion must agree on that sequence. They did not
 * before: `convert` emitted one entry per split row while `parse` consumed one
 * per split cell, so group assignment drifted as soon as a row had more than
 * one column.
 */
function splitRowIndex(mainStepCount: number, rowIndex: number): number {
	return mainStepCount + rowIndex;
}

function mapToRectangular2DArray<T>(map: Map<string, T>): (T | null)[][] {
	let maxRow = -1;
	let maxCol = -1;

	for (const key of map.keys()) {
		const [row, col] = key.split(':').map(Number);
		maxRow = Math.max(maxRow, row);
		maxCol = Math.max(maxCol, col);
	}

	const result: (T | null)[][] = Array.from({ length: maxRow + 1 }, () =>
		Array(maxCol + 1).fill(null)
	);

	for (const [key, value] of map) {
		const [row, col] = key.split(':').map(Number);
		result[row][col] = value;
	}

	return result;
}

export function convertFlowchartToTypstFlowchartData(raw: {
	nodes: Node[];
	edges: Edge[];
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
		const g = parents[id]?.find((pid) => nodeById[pid]?.type === 'groups');
		return g ? (nodeById[g].data.group as string) : '';
	};

	const getSubsteps = (stepId: string) =>
		(children[stepId] ?? [])
			.map((id) => nodeById[id])
			.filter((n) => n?.type === 'substep')
			.map((n) => ({
				label: n.data.label as string,
				value: n.data.delta as number
			}));

	const start = raw.nodes.find((n) => n?.type === 'start');
	if (!start) {
		return { steps: { main: [], splits: [] }, groups: {} };
	}

	const colByNode = new Map<string, number>();
	colByNode.set(start.id, 0);

	function createStep(node: Node): TypstStep {
		const newStep: TypstStep = {
			label: (node.data.stepLabel as string) ?? (node.data.label as string) ?? '',
			value: (node.data.value as number) ?? 0,

			delta:
				node?.type === 'step'
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
	const splitSteps: Map<string, TypstStep> = new Map();

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
			splitSteps.set(`${row}:${col}`, step);

			// Groups. The first column reached for a row names the whole row.
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
		if (node?.type === 'step' || node?.type === 'start' || node?.type === 'splitstart') {
			const nextStep = (children[id] ?? []).find((cid) => nodeById[cid]?.type === 'step');

			const nextSplit = (children[id] ?? []).find((cid) => nodeById[cid]?.type === 'split');

			if (nextStep) {
				colByNode.set(nextStep, colByNode.get(id)!);
				queue.push(nextStep);
				continue;
			}

			if (nextSplit) {
				const splitStarts = (children[nextSplit] ?? []).filter(
					(cid) => nodeById[cid]?.type === 'splitstart'
				);

				for (const ss of splitStarts) {
					colByNode.set(ss, nextFreeCol++);
					queue.push(ss);
				}
			}
		}
	}

	const typeSteps: TypstSteps = {
		main: mainSteps,
		splits: mapToRectangular2DArray(splitSteps)
	};

	const orderedRowGroups = [...splitGroups.entries()]
		.sort(([rowA], [rowB]) => rowA - rowB)
		.map(([, name]) => name);

	const typeGroups: TypstGroups = {};
	[...mainGroups, ...orderedRowGroups].forEach((name, index) => {
		if (name.length > 0) {
			(typeGroups[name] ??= []).push(index);
		}
	});

	return { steps: typeSteps, groups: typeGroups };
}

export function parseTypstFlowchartJSON(
	json: TypstFlowchartData,
	nextId: IdAllocator = createIdAllocator()
): {
	nodes: Node[];
	edges: Edge[];
} {
	const { main, splits } = json.steps;
	const groups = json.groups ?? {};

	const nodes: Node[] = [];
	const edges: Edge[] = [];

	// Flat group index → the node a group edge should attach to.
	const logicalMap: Map<number, ['START' | 'STEP' | 'ROW', string]> = new Map();

	const mainNodeIds: string[] = [];

	// ========================
	// 1. MAIN FLOW
	// ========================

	main.forEach((step, i) => {
		const id = nextId();

		if (i === 0) {
			nodes.push({
				id,
				type: startSourceOutput.nodeType,
				data: { label: step.label, value: step.value, row: null },
				position: { x: 0, y: 0 },
				deletable: false
			});
		} else {
			nodes.push({
				id,
				type: stepSourceOutput.nodeType,
				data: {
					stepLabel: step.label,
					value: step.value,
					delta: step.delta?.value ?? 0,
					droppedLabel: step.delta?.label ?? '',
					row: null
				},
				position: { x: 0, y: 0 }
			});

			edges.push({
				id: edgeId(mainNodeIds[i - 1], id),
				source: mainNodeIds[i - 1],
				target: id,
				sourceHandle: i == 1 ? startSourceOutput.handleId : stepSourceOutput.handleId,
				targetHandle: stepTargetInput.handleId
			});
		}

		mainNodeIds.push(id);
		logicalMap.set(i, [i == 0 ? 'START' : 'STEP', id]);

		// substeps
		step.delta?.substeps?.forEach((sub) => {
			const subId = nextId();

			nodes.push({
				id: subId,
				type: substepTarget.nodeType,
				data: { label: sub.label, delta: sub.value, row: null },
				position: { x: 0, y: 0 }
			});

			edges.push({
				id: edgeId(id, subId),
				source: id,
				target: subId,
				sourceHandle: stepSourceSubsteps.handleId,
				targetHandle: substepTarget.handleId
			});
		});
	});

	// ========================
	// 2. SPLIT
	// ========================
	if (splits?.length) {
		const splitId = nextId();

		nodes.push({
			id: splitId,
			type: splitSourceOutput.nodeType,
			data: {},
			position: { x: 0, y: 0 }
		});

		edges.push({
			id: edgeId(mainNodeIds.at(-1) ?? '', splitId),
			source: mainNodeIds.at(-1) ?? '',
			target: splitId,
			sourceHandle: stepSourceOutput.handleId,
			targetHandle: splitTargetInput.handleId
		});

		const columnMap: string[][] = [];

		splits.forEach((row, rowIndex) => {
			const rowId = nextId();

			nodes.push({
				id: rowId,
				type: rowTargetGroup.nodeType,
				data: {},
				position: { x: 0, y: 0 }
			});

			// One group index per row, matching what `convert` emits.
			logicalMap.set(splitRowIndex(main.length, rowIndex), ['ROW', rowId]);

			row.forEach((cell, colIndex) => {
				if (!cell) return;

				const id = nextId();

				if (rowIndex === 0) {
					nodes.push({
						id,
						type: splitstartSourceOutput.nodeType,
						parentId: rowId,
						data: {
							label: cell.label,
							value: cell.value,
							row: rowIndex
						},
						position: { x: 0, y: 0 }
					});
				} else {
					nodes.push({
						id,
						type: stepSourceOutput.nodeType,
						parentId: rowId,
						data: {
							stepLabel: cell.label,
							value: cell.value,
							delta: cell.delta?.value ?? 0,
							droppedLabel: cell.delta?.label ?? '',
							row: rowIndex
						},
						position: { x: 0, y: 0 }
					});
				}

				if (!columnMap[colIndex]) columnMap[colIndex] = [];
				columnMap[colIndex][rowIndex] = id;

				if (rowIndex === 0) {
					edges.push({
						id: edgeId(splitId, id),
						source: splitId,
						target: id,
						sourceHandle: splitSourceOutput.handleId,
						targetHandle: splitstartTargetInput.handleId
					});
				}

				if (rowIndex > 0 && columnMap[colIndex][rowIndex - 1]) {
					edges.push({
						id: edgeId(columnMap[colIndex][rowIndex - 1], id),
						source: columnMap[colIndex][rowIndex - 1],
						target: id,
						sourceHandle:
							rowIndex == 1 ? splitstartSourceOutput.handleId : stepSourceOutput.handleId,
						targetHandle: stepTargetInput.handleId
					});
				}

				cell.delta?.substeps?.forEach((sub) => {
					const subId = nextId();

					nodes.push({
						id: subId,
						type: substepTarget.nodeType,
						parentId: rowId,
						data: { label: sub.label, delta: sub.value, row: rowIndex },
						position: { x: 0, y: 0 }
					});

					edges.push({
						id: edgeId(id, subId),
						source: id,
						target: subId,
						sourceHandle: stepSourceSubsteps.handleId,
						targetHandle: substepTarget.handleId
					});
				});
			});
		});
	}

	// ========================
	// 3. GROUPS
	// ========================

	Object.entries(groups).forEach(([groupName, indices]) => {
		const groupId = nextId();

		nodes.push({
			id: groupId,
			type: groupSource.nodeType,
			data: { group: groupName },
			position: { x: -500, y: 300 }
		});

		indices.forEach((index) => {
			const entry = logicalMap.get(index);
			if (!entry) return;

			const [nodeType, targetId] = entry;
			if (!targetId) return;

			edges.push({
				id: edgeId(groupId, targetId),
				source: groupId,
				target: targetId,
				sourceHandle: groupSource.handleId,
				targetHandle:
					nodeType == 'START'
						? startTargetGroup.handleId
						: nodeType == 'STEP'
							? stepTargetGroup.handleId
							: rowTargetGroup.handleId
			});
		});
	});

	return { nodes, edges };
}
