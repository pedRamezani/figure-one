/**
 * The node vocabulary: which node types exist, what data each carries, and how
 * many of each one chart may hold.
 *
 * Deliberately knows nothing about handles and nothing about components, so
 * that both can depend on it without depending on each other.
 */

// Use 'groups' instead of 'group' to avoid css name conflicts
export type RegisteredNodeType =
	| 'groups'
	| 'row'
	| 'split'
	| 'splitstart'
	| 'start'
	| 'step'
	| 'substep';

/**
 * How many of a node type one chart may contain. Absent means unlimited.
 *
 * A CONSORT diagram has one start and at most one split. More than one split
 * is not supported: rows are numbered per split, so two of them would fold
 * their stages together.
 */
export const nodeLimits: Partial<Record<RegisteredNodeType, number>> = {
	start: 1,
	split: 1
};

export const getNodeDataDefaults = (type: RegisteredNodeType): Record<string, unknown> => {
	switch (type) {
		case 'groups':
			return { group: '' };
		case 'splitstart':
			return { label: 'Split start population', value: 0 };
		case 'step':
			return {
				value: null,
				delta: 0,
				stepLabel: 'Step',
				droppedLabel: 'excluded'
			};
		case 'substep':
			return { delta: 0, label: 'Substep' };
		case 'start':
			return { label: 'Start population', value: 1000 };
		default:
			// split, row
			return {};
	}
};
