import type { Node, Edge, Viewport } from '@xyflow/svelte';

import { getId } from '../flow/Flow.svelte';

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

export type TypstSteps = {
	main: TypstStep[];
	splits: (TypstStep | null)[][];
};

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
		return { steps: { main: [], splits: [] }, groups: {} };
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

	const typeSteps: TypstSteps = {
		main: mainSteps,
		splits: mapToRectangular2DArray(splitSteps)
	};

	const typeGroups: TypstGroups = [
		...mainGroups,
		...splitGroups
			.entries()
			.toArray()
			.sort(([row1, name1], [row2, name2]) => row1 - row2)
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
		);

	return { steps: typeSteps, groups: typeGroups };
}

export function parseTypstFlowchartJSON(json: TypstFlowchartData): {
	nodes: Node[];
	edges: Edge[];
} {
	const { main, splits } = json.steps;
	const groups = json.groups ?? {};

	const nodes: Node[] = [];
	const edges: Edge[] = [];

	const logicalMap: Map<number, [string, string]> = new Map(); // index → nodeId
	let logicalIndex = 0;

	const mainNodeIds: string[] = [];

	// ========================
	// 1. MAIN FLOW
	// ========================

	main.forEach((step, i) => {
		const id = getId();

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
				id: `${mainNodeIds[i - 1]}-${id}`,
				source: mainNodeIds[i - 1],
				target: id,
				sourceHandle: i == 1 ? startSourceOutput.handleId : stepSourceOutput.handleId,
				targetHandle: stepTargetInput.handleId
			});
		}

		mainNodeIds.push(id);
		logicalMap.set(logicalIndex++, [i == 0 ? 'START' : 'STEP', id]);

		// substeps
		step.delta?.substeps?.forEach((sub) => {
			const subId = getId();

			nodes.push({
				id: subId,
				type: substepTarget.nodeType,
				data: { label: sub.label, delta: sub.value, row: null },
				position: { x: 0, y: 0 }
			});

			edges.push({
				id: `${id}-${subId}`,
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
		let splitId = getId();

		nodes.push({
			id: splitId,
			type: splitSourceOutput.nodeType,
			data: {},
			position: { x: 0, y: 0 }
		});

		edges.push({
			id: `${mainNodeIds.at(-1) ?? ''}-${splitId}`,
			source: mainNodeIds.at(-1) ?? '',
			target: splitId,
			sourceHandle: stepSourceOutput.handleId,
			targetHandle: splitTargetInput.handleId
		});

		const columnMap: string[][] = [];

		splits.forEach((row, rowIndex) => {
			const rowId = getId();

			nodes.push({
				id: rowId,
				type: rowTargetGroup.nodeType,
				data: {},
				position: { x: 0, y: 0 }
			});

			row.forEach((cell, colIndex) => {
				if (!cell) {
					logicalIndex++;
					return;
				}

				const id = getId();

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

				logicalMap.set(logicalIndex++, ['ROW', rowId]);

				if (!columnMap[colIndex]) columnMap[colIndex] = [];
				columnMap[colIndex][rowIndex] = id;

				if (rowIndex === 0) {
					edges.push({
						id: `${splitId}-${id}`,
						source: splitId,
						target: id,
						sourceHandle: splitSourceOutput.handleId,
						targetHandle: splitstartTargetInput.handleId
					});
				}

				if (rowIndex > 0 && columnMap[colIndex][rowIndex - 1]) {
					edges.push({
						id: `${columnMap[colIndex][rowIndex - 1]}-${id}`,
						source: columnMap[colIndex][rowIndex - 1],
						target: id,
						sourceHandle:
							rowIndex == 1 ? splitstartSourceOutput.handleId : stepSourceOutput.handleId,
						targetHandle: stepTargetInput.handleId
					});
				}

				cell.delta?.substeps?.forEach((sub) => {
					const subId = getId();

					nodes.push({
						id: subId,
						type: substepTarget.nodeType,
						parentId: rowId,
						data: { label: sub.label, delta: sub.value, row: rowIndex },
						position: { x: 0, y: 0 }
					});

					edges.push({
						id: `${id}-${subId}`,
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
		const groupId = getId();

		nodes.push({
			id: groupId,
			type: groupSource.nodeType,
			data: { group: groupName },
			position: { x: -500, y: 300 }
		});

		indices.forEach((index) => {
			const [nodeType, targetId] = logicalMap.get(index) ?? ['STEP', ''];
			if (!targetId) return;

			edges.push({
				id: `${groupId}-${targetId}`,
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
