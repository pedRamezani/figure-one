import type { Node, Edge, Viewport } from '@xyflow/svelte';

import { stepTargetGroup } from '@/nodes/types';

export type TypstFlowchartData = {
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

export function convertFlowchartToTypstFlowchartData(raw: {
	nodes: Node[];
	edges: Edge[];
	viewport: Viewport;
}): TypstFlowchartData {
	const nodeById = Object.fromEntries(raw.nodes.map((n) => [n.id, n]));
	const edges = raw.edges;

	const sourceChildren: { [id: string]: Array<string> } = {};
	const targetChildren: { [id: string]: Array<string> } = {};

	for (const { source, target } of edges) {
		if (!sourceChildren[source]) sourceChildren[source] = [];
		sourceChildren[source].push(target);
		if (!targetChildren[target]) targetChildren[target] = [];
		targetChildren[target].push(source);
	}

	const start = raw.nodes.find((n) => n.type === 'start');

	function traverseSteps(startId: string) {
		let order = [];
		let current = startId;

		while (sourceChildren[current] && sourceChildren[current].length > 0) {
			// Find next step (ignore substeps here)
			const nextStep = sourceChildren[current].find((id) => nodeById[id].type === 'step');
			if (!nextStep) break;
			order.push(nextStep);
			current = nextStep;
		}
		return order;
	}

	const stepOrder = start !== undefined ? traverseSteps(start.id) : [];

	function getGroup(nodeId: string): string | undefined {
		if (!targetChildren[nodeId]) return undefined;
		return targetChildren[nodeId].find((id) => nodeById[id].type === 'group');
	}

	function getSubsteps(stepId: string): string[] {
		if (!sourceChildren[stepId]) return [];
		return sourceChildren[stepId].filter((id) => nodeById[id].type === 'substep');
	}

	const output: TypstFlowchartData = [];

	// 1. Start node value
	output.push({
		stepLabel: (start?.data.label as string) ?? '',
		droppedLabel: '',
		group: getGroup(start?.id ?? '')
			? ((nodeById[getGroup(start?.id ?? '')!].data.group as string) ?? '')
			: '',
		value: (start?.data.value as number) ?? 0,
		delta: 0,
		substepDeltas: []
	});

	// 2. Each step
	for (const stepId of stepOrder) {
		const step = nodeById[stepId];

		const stepLabel = (step.data.stepLabel as string) ?? '';
		const droppedLabel = (step.data.droppedLabel as string) ?? '';
		const stepGroup = getGroup(stepId)
			? ((nodeById[getGroup(stepId)!].data.group as string) ?? '')
			: '';
		const stepValue = (step.data.value as number) ?? 0;
		const stepDelta = (step.data.delta as number) ?? 0;

		const substepsDeltas = getSubsteps(stepId).map((id) => {
			const n = nodeById[id];
			return {
				label: (n.data.label as string) ?? '',
				delta: (n.data.delta as number) ?? 0
			};
		});

		output.push({
			stepLabel: stepLabel,
			droppedLabel: droppedLabel,
			group: stepGroup,
			value: stepValue,
			delta: stepDelta,
			substepDeltas: substepsDeltas
		});
	}

	return output;
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
			label: startEntry.stepLabel,
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
				stepLabel: entry.stepLabel,
				droppedLabel: entry.droppedLabel,
				value: entry.value,
				delta: entry.delta
			},
			position: { x: 0, y: 0 }
		} as Node);

		// substeps
		for (let j = 0; j < entry.substepDeltas.length; j++) {
			const s = entry.substepDeltas[j];
			const subId = `substep-${i}-${j}`;
			nodes.push({
				id: subId,
				type: 'substep',
				data: { label: s.label, delta: s.delta },
				position: { x: 0, y: 0 }
			} as Node);
			const edgeId = `${stepId}-${subId}`;
			edges.push({
				id: edgeId,
				source: stepId,
				sourceHandle: 'step-substeps',
				target: subId
			} as Edge);
		}
	}

	// connect start -> first step (if exists)
	if (stepIds.length > 0) {
		const edgeId = `${startId}-${stepIds[0]}`;
		edges.push({
			id: edgeId,
			source: startId,
			target: stepIds[0]
		} as Edge);
	}

	// connect steps sequentially
	for (let k = 0; k < stepIds.length - 1; k++) {
		const edgeId = `${stepIds[k]}-${stepIds[k + 1]}`;
		edges.push({
			id: edgeId,
			source: stepIds[k],
			sourceHandle: 'step-output',
			target: stepIds[k + 1]
		} as Edge);
	}

	// Create unique group nodes and connect them to their start/step nodes
	const groupMap = new Map<string, string>();
	let gi = 0;
	function ensureGroup(name: string) {
		if (name !== "" && !groupMap.has(name)) {
			const gid = `group-${gi++}`;
			groupMap.set(name, gid);
			nodes.push({
				id: gid,
				type: 'group',
				data: { group: name },
				position: { x: 0, y: 0 }
			} as Node);
		}
		return groupMap.get(name)!;
	}

	// start
	if (startEntry.group) {
		const gid = ensureGroup(startEntry.group);
		const edgeId = `${gid}-${startId}`;
		edges.push({ id: edgeId, source: gid, target: startId } as Edge);
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
				target: stepId,
				targetHandle: stepTargetGroup.handleId
			} as Edge);
		}
	}

	return { nodes, edges };
}
