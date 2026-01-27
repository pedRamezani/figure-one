import type { Node, Edge, Viewport } from '@xyflow/svelte';
export type TypstFlowNode =
	| {
			type: 'linear';
			nodes: TypstStep[];
	  }
	| {
			type: 'split';
			branches: TypstFlowNode[];
	  };

export type TypstStep = {
	stepLabel: string;
	droppedLabel: string;
	group: string;
	value: number;
	delta: number;
	substepDeltas: {
		label: string;
		delta: number;
	}[];
};

export type TypstFlowchartData = {
	root: TypstFlowNode;
};

export function convertFlowchartToTypstFlowchartData(raw: {
	nodes: Node[];
	edges: Edge[];
	viewport: Viewport;
}): TypstFlowchartData {
		const nodeById = Object.fromEntries(raw.nodes.map((n) => [n.id, n]));

	const children: Record<string, string[]> = {};
	const parents: Record<string, string[]> = {};

	for (const e of raw.edges) {
		children[e.source] ??= [];
		children[e.source].push(e.target);

		parents[e.target] ??= [];
		parents[e.target].push(e.source);
	}

	const getGroup = (id: string): string => {
		const g = parents[id]?.find((p) => nodeById[p].type === 'group');
		return g ? (nodeById[g].data.group as string) : '';
	};

	const getSubsteps = (stepId: string) =>
		(children[stepId] ?? [])
			.map((id) => nodeById[id])
			.filter((n) => n.type === 'substep')
			.map((n) => ({
				label: n.data.label as string,
				delta: n.data.delta as number
			}));

	function buildLinear(popNodeId: string) {
		const popNode = nodeById[popNodeId];

		const linear = {
			type: 'linear' as const,
			population: {
				label: popNode.data.label as string,
				value: popNode.data.value as number,
				group: getGroup(popNodeId)
			},
			steps: [] as any[],
			next: undefined as any
		};

		let current = popNodeId;

		while (true) {
			const stepId = (children[current] ?? []).find(
				(id) => nodeById[id].type === 'step'
			);
			if (!stepId) break;

			const step = nodeById[stepId];
			linear.steps.push({
				stepLabel: step.data.stepLabel as string,
				droppedLabel: step.data.droppedLabel as string,
				delta: step.data.delta as number,
				substepDeltas: getSubsteps(stepId)
			});

			const splitId = (children[stepId] ?? []).find(
				(id) => nodeById[id].type === 'split'
			);

			if (splitId) {
				linear.next = buildSplit(splitId);
				break;
			}

			current = stepId;
		}

		return linear;
	}

	function buildSplit(splitId: string) {
		const splitStarts = (children[splitId] ?? []).filter(
			(id) => nodeById[id].type === 'splitstart'
		);

		return {
			type: 'split' as const,
			populations: splitStarts.map((sid) => buildLinear(sid))
		};
	}

	const start = raw.nodes.find((n) => n.type === 'start');
	if (!start) throw new Error('No start node found');

	return {
		root: buildLinear(start.id)
	};
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
