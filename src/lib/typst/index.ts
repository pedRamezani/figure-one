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

export function downloadBlob(data: BlobPart, mimeType: string, fileName: string) {
	const blob = new Blob([data], { type: mimeType });

	// Creates element with <a> tag
	const link = document.createElement('a');

	// Sets file content in the object URL
	link.href = URL.createObjectURL(blob);

	// Sets file name
	link.download = fileName;

	// Triggers a click event to <a> tag to save file.
	// document.body.appendChild(link);
	link.click();
	// document.body.removeChild(link);
	URL.revokeObjectURL(link.href);
}
