import { describe, expect, it } from 'vitest';

import { readDocument } from './read.ts';
import { createProjectDocument, emptyProjectDocument } from './project.ts';
import { createDataDocument } from './data.ts';
import { convertFlowchartToTypstFlowchartData } from '@/preview/json/convert';
import { hydrateGraph } from './graph-schema.ts';
import { defaultConfig } from '@/preview/style/config';
import { createIdAllocator } from '@/nodes/ids';

import dataV1 from './fixtures/data-v1-legacy.json' with { type: 'json' };
import dataV2Linear from './fixtures/data-v2-linear.json' with { type: 'json' };
import dataV2Splits from './fixtures/data-v2-splits.json' with { type: 'json' };

const corpus = {
	'data v1 legacy': dataV1,
	'data v2 linear': dataV2Linear,
	'data v2 splits': dataV2Splits
};

describe('the frozen corpus', () => {
	for (const [name, fixture] of Object.entries(corpus)) {
		it(`reads ${name}`, () => {
			const result = readDocument(fixture, createIdAllocator());

			expect(result.ok, result.ok ? '' : result.error).toBe(true);
			if (!result.ok) return;

			expect(result.source).toBe('data');
			expect(result.needsLayout).toBe(true);
			expect(result.document.graph.nodes.length).toBeGreaterThan(0);
		});

		it(`fills the config for ${name}`, () => {
			const result = readDocument(fixture, createIdAllocator());
			if (!result.ok) throw new Error(result.error);

			// Every section is present even when the file only carried some.
			expect(Object.keys(result.document.config).sort()).toEqual(Object.keys(defaultConfig).sort());
			expect(result.document.config.node.inset).toBe(defaultConfig.node.inset);
		});
	}

	it('carries a legacy config through rather than discarding it', () => {
		const result = readDocument(dataV1, createIdAllocator());
		if (!result.ok) throw new Error(result.error);

		expect(result.document.config.page.title).toBe('Figure 1');
		expect(result.document.config.stepBox.subDeltaIndent).toBe(
			defaultConfig.stepBox.subDeltaIndent
		);
	});

	it('preserves the semantics of a v2 file through the graph', () => {
		const result = readDocument(dataV2Splits, createIdAllocator());
		if (!result.ok) throw new Error(result.error);

		const recovered = convertFlowchartToTypstFlowchartData(hydrateGraph(result.document.graph));
		expect(recovered).toEqual(dataV2Splits.data);
	});

	it('turns a v1 file into the same semantics as its v2 equivalent', () => {
		const result = readDocument(dataV1, createIdAllocator());
		if (!result.ok) throw new Error(result.error);

		const recovered = convertFlowchartToTypstFlowchartData(hydrateGraph(result.document.graph));
		expect(recovered).toEqual(dataV2Linear.data);
	});
});

describe('the config allowlist regression', () => {
	it('imports a full config that the old validator rejected', () => {
		// `inset`, `outset`, `textAlign` and every stepBox field beyond tint and
		// width were absent from the old allowlist, so the app silently refused
		// every file it had itself exported.
		const result = readDocument(dataV2Splits, createIdAllocator());

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.document.config.node.outset).toBe(0);
		expect(result.document.config.mainBox.textAlign).toBe('left');
		expect(result.document.config.stepBox.deltaAlign).toBe('text-left');
	});

	it('keeps the rest of a config when one field is unreadable', () => {
		const broken = structuredClone(dataV2Linear);
		broken.config.page.tint = 'not-a-colour';

		const result = readDocument(broken, createIdAllocator());
		if (!result.ok) throw new Error(result.error);

		// The bad section falls back to defaults; the good ones survive.
		expect(result.document.config.page.tint).toBe(defaultConfig.page.tint);
		expect(result.document.config.mark.markScale).toBe(70);
	});

	it('ignores fields written by a newer build instead of refusing the file', () => {
		const future = structuredClone(dataV2Linear);
		(future.config.page as Record<string, unknown>).somethingNew = 'from the future';

		const result = readDocument(future, createIdAllocator());

		expect(result.ok).toBe(true);
	});
});

describe('project documents', () => {
	it('round trips an empty project', () => {
		const document = emptyProjectDocument();
		const result = readDocument(createProjectDocument(document));

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.source).toBe('project');
		expect(result.needsLayout).toBe(false);
		expect(result.document).toEqual(document);
	});

	it('preserves node ids and positions', () => {
		const document = emptyProjectDocument();
		document.graph.nodes.push({
			id: '7',
			type: 'step',
			position: { x: 120, y: -40 },
			data: {
				stepLabel: 'Enrolled',
				droppedLabel: 'Excluded',
				value: 420,
				delta: 80
			}
		});

		const result = readDocument(createProjectDocument(document));
		if (!result.ok) throw new Error(result.error);

		const step = result.document.graph.nodes.find((n) => n.id === '7');
		expect(step?.position).toEqual({ x: 120, y: -40 });
	});

	it('keeps an unconnected node that the semantic form cannot express', () => {
		const document = emptyProjectDocument();
		document.graph.nodes.push({
			id: '99',
			type: 'step',
			position: { x: 500, y: 500 },
			data: {
				stepLabel: 'Dragged but not wired up yet',
				droppedLabel: '',
				value: null,
				delta: 0
			}
		});

		const result = readDocument(createProjectDocument(document));
		if (!result.ok) throw new Error(result.error);

		expect(result.document.graph.nodes.map((n) => n.id)).toContain('99');
	});

	it('restores the project name', () => {
		const document = { ...emptyProjectDocument(), name: 'trial-2026' };
		const result = readDocument(createProjectDocument(document));
		if (!result.ok) throw new Error(result.error);

		expect(result.document.name).toBe('trial-2026');
	});
});

describe('rejections', () => {
	it('explains a file that is not an object', () => {
		const result = readDocument([1, 2, 3]);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toMatch(/JSON object/);
	});

	it('explains a file with no version', () => {
		const result = readDocument({ data: {} });
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toMatch(/no version/);
	});

	it('explains a file from a newer build', () => {
		const result = readDocument({ $kind: 'flowchart-data', $version: 99, data: {} });
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toMatch(/newer version/);
	});

	it('explains an unknown kind', () => {
		const result = readDocument({ $kind: 'something-else', $version: 1 });
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toMatch(/Unknown document kind/);
	});

	it('rejects a node whose type has no component', () => {
		const document = createProjectDocument(emptyProjectDocument());
		const nodes = document.graph.nodes as unknown as Record<string, unknown>[];
		nodes.push({
			id: '5',
			type: 'not-a-real-node-type',
			position: { x: 0, y: 0 },
			data: {}
		});

		const result = readDocument(document);
		expect(result.ok).toBe(false);
	});
});

describe('the data export', () => {
	it('carries no styling', () => {
		const exported = createDataDocument(dataV2Linear.data as never) as Record<string, unknown>;
		expect(exported.config).toBeUndefined();
		expect(exported.$kind).toBe('flowchart-data');
		expect(exported.$version).toBe(3);
	});

	it('can be read back in', () => {
		const exported = createDataDocument(dataV2Linear.data as never);
		const result = readDocument(exported, createIdAllocator());

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.source).toBe('data');
	});
});
