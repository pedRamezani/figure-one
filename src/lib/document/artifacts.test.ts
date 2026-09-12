import { describe, expect, it } from 'vitest';

import { dataJSON, projectJSON } from './artifacts.ts';
import { readDocument } from './read.ts';
import { emptyProjectDocument, type ProjectDocument } from './project.ts';
import { defaultConfig } from '@/preview/style/config';
import { createIdAllocator } from '@/flow/ids';

import dataV2Splits from './fixtures/data-v2-splits.json' with { type: 'json' };

/** A document with a split, groups and substeps, built the way an import builds one. */
function richDocument(): ProjectDocument {
	const read = readDocument(dataV2Splits, createIdAllocator());
	if (!read.ok) throw new Error(read.error);

	return {
		...read.document,
		name: 'trial-2026',
		config: { ...defaultConfig, page: { ...defaultConfig.page, title: 'Figure 3' } }
	};
}

describe('the project file', () => {
	it('can be read back into an identical document', () => {
		const document = richDocument();

		const reread = readDocument(JSON.parse(projectJSON(document)));
		expect(reread.ok, reread.ok ? '' : reread.error).toBe(true);
		if (!reread.ok) return;

		expect(reread.document).toEqual(document);
		expect(reread.needsLayout).toBe(false);
	});

	it('round trips an empty project', () => {
		const document = emptyProjectDocument();
		const reread = readDocument(JSON.parse(projectJSON(document)));

		if (!reread.ok) throw new Error(reread.error);
		expect(reread.document).toEqual(document);
	});

	it('keeps positions rather than needing a layout pass', () => {
		const document = richDocument();
		document.graph.nodes[1].position = { x: 321, y: 654 };

		const reread = readDocument(JSON.parse(projectJSON(document)));
		if (!reread.ok) throw new Error(reread.error);

		expect(reread.document.graph.nodes[1].position).toEqual({ x: 321, y: 654 });
	});

	it('is stable, so an unchanged document does not look changed', () => {
		const document = richDocument();
		expect(projectJSON(document)).toBe(projectJSON(document));
	});
});

describe('the data file', () => {
	it('carries the semantics and no styling', () => {
		const parsed = JSON.parse(dataJSON(richDocument()));

		expect(parsed.$kind).toBe('flowchart-data');
		expect(parsed.$version).toBe(3);
		expect(parsed.config).toBeUndefined();
		expect(parsed.name).toBeUndefined();
		expect(parsed.data).toEqual(dataV2Splits.data);
	});

	it('can be imported again, falling back to default styling', () => {
		const reread = readDocument(JSON.parse(dataJSON(richDocument())), createIdAllocator());
		if (!reread.ok) throw new Error(reread.error);

		expect(reread.source).toBe('data');
		expect(reread.needsLayout).toBe(true);
		expect(reread.document.config).toEqual(defaultConfig);
	});

	it('survives a project export, import, data export cycle', () => {
		const document = richDocument();

		const viaProject = readDocument(JSON.parse(projectJSON(document)));
		if (!viaProject.ok) throw new Error(viaProject.error);

		expect(JSON.parse(dataJSON(viaProject.document)).data).toEqual(dataV2Splits.data);
	});
});
