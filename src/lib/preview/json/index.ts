import type { Node, Edge, Viewport } from '@xyflow/svelte';

export type typstFlowchartJSON = {
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

export function convertFlowchartToTypstJson(raw: {
	nodes: Node[];
	edges: Edge[];
	viewport: Viewport;
}): typstFlowchartJSON {
	const nodeById = Object.fromEntries(raw.nodes.map((n) => [n.id, n]));
	const edges = raw.edges;

	const children: { [id: string]: Array<string> } = {};

	for (const { source, target } of edges) {
		if (!children[source]) children[source] = [];
		children[source].push(target);
	}

	const start = raw.nodes.find((n) => n.type === 'start');

	function traverseSteps(startId: string) {
		let order = [];
		let current = startId;

		while (children[current] && children[current].length > 0) {
			// Find next step (ignore substeps here)
			const nextStep = children[current].find((id) => nodeById[id].type === 'step');
			if (!nextStep) break;
			order.push(nextStep);
			current = nextStep;
		}
		return order;
	}

	const stepOrder = start !== undefined ? traverseSteps(start.id) : [];

	function getSubsteps(stepId: string) {
		if (!children[stepId]) return [];
		return children[stepId].filter((id) => nodeById[id].type === 'substep');
	}

	const output: typstFlowchartJSON = [];

	// 1. Start node value
	output.push({
		stepLabel: (start?.data.label as string) ?? '',
		droppedLabel: '',
		group: (start?.data.group as string) ?? '',
		value: (start?.data.value as number) ?? 0,
		delta: 0,
		substepDeltas: []
	});

	// 2. Each step
	for (const stepId of stepOrder) {
		const step = nodeById[stepId];

		const stepLabel = (step.data.stepLabel as string) ?? '';
		const droppedLabel = (step.data.droppedLabel as string) ?? '';
		const stepGroup = (step.data.group as string) ?? '';
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

export function isTypstFlowchartJSON(value: unknown): value is typstFlowchartJSON {
	if (!Array.isArray(value) || value.length === 0) return false;

	function isNumber(n: unknown): n is number {
		return typeof n === 'number' && Number.isFinite(n);
	}

	for (const item of value) {
		if (typeof item !== 'object' || item === null) return false;

		const maybe = item as any;
		if (typeof maybe.stepLabel !== 'string') return false;
		if (typeof maybe.droppedLabel !== 'string') return false;
		if (typeof maybe.group !== 'string') return false;
		if (!isNumber(maybe.value)) return false;
		if (!isNumber(maybe.delta)) return false;

		if (!Array.isArray(maybe.substepDeltas)) return false;
		for (const sd of maybe.substepDeltas) {
			if (typeof sd !== 'object' || sd === null) return false;
			if (typeof (sd as any).label !== 'string') return false;
			if (!isNumber((sd as any).delta)) return false;
		}
	}

	return true;
}

export function parseTypstFlowchartJSON(json: typstFlowchartJSON): {
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
			group: startEntry.group,
			value: startEntry.value
		},
		position: { x: 0, y: 0 },
		deletable: false
	} as unknown as Node);

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
				group: entry.group,
				value: entry.value,
				delta: entry.delta
			},
			position: { x: 0, y: 0 }
		} as unknown as Node);

		// substeps
		for (let j = 0; j < entry.substepDeltas.length; j++) {
			const s = entry.substepDeltas[j];
			const subId = `substep-${i}-${j}`;
			nodes.push({
				id: subId,
				type: 'substep',
				data: { label: s.label, delta: s.delta },
				position: { x: 0, y: 0 }
			} as unknown as Node);
			const edgeId = `${stepId}-${subId}`;
			edges.push({
				id: edgeId,
				source: stepId,
				sourceHandle: 'step-substeps',
				target: subId
			} as unknown as Edge);
		}
	}

	// connect start -> first step (if exists)
	if (stepIds.length > 0) {
		const edgeId = `${startId}-${stepIds[0]}`;
		edges.push({
			id: edgeId,
			source: startId,
			target: stepIds[0]
		} as unknown as Edge);
	}

	// connect steps sequentially
	for (let k = 0; k < stepIds.length - 1; k++) {
		const edgeId = `${stepIds[k]}-${stepIds[k + 1]}`;
		edges.push({
			id: edgeId,
			source: stepIds[k],
			sourceHandle: 'step-output',
			target: stepIds[k + 1]
		} as unknown as Edge);
	}

	return { nodes, edges };
}
