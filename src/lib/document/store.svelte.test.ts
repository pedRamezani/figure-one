import { beforeEach, describe, expect, it } from 'vitest';

import {
	DOCUMENT_KEY,
	FlowchartDocumentStore,
	LEGACY_KEYS,
	readLegacyStorage,
	type DocumentStorage
} from './store.svelte.ts';
import { defaultConfig } from '@/preview/style/config';

import dataV2Linear from './fixtures/data-v2-linear.json' with { type: 'json' };

class FakeStorage implements DocumentStorage {
	items = new Map<string, string>();
	writes = 0;

	getItem(key: string): string | null {
		return this.items.get(key) ?? null;
	}

	setItem(key: string, value: string): void {
		this.writes += 1;
		this.items.set(key, value);
	}

	removeItem(key: string): void {
		this.items.delete(key);
	}
}

let storage: FakeStorage;
let store: FlowchartDocumentStore;

beforeEach(() => {
	storage = new FakeStorage();
	store = new FlowchartDocumentStore();
});

describe('a fresh store', () => {
	it('starts with a single start node', () => {
		expect(store.nodes).toHaveLength(1);
		expect(store.nodes[0].type).toBe('start');
		expect(store.edges).toHaveLength(0);
	});

	it('is pristine', () => {
		expect(store.isPristine).toBe(true);
	});

	it('stops being pristine once a node is added', () => {
		store.addNode('step');
		expect(store.isPristine).toBe(false);
	});

	it('stops being pristine once the name is set', () => {
		store.name = 'trial';
		expect(store.isPristine).toBe(false);
	});

	it('stops being pristine once styling changes', () => {
		store.config = { ...defaultConfig, page: { ...defaultConfig.page, title: 'Figure 2' } };
		expect(store.isPristine).toBe(false);
	});
});

describe('saving', () => {
	it('writes exactly one key', () => {
		store.attach(storage);
		store.addNode('step');
		store.save();

		expect([...storage.items.keys()]).toEqual([DOCUMENT_KEY]);
	});

	it('does not rewrite an unchanged document', () => {
		store.attach(storage);
		store.addNode('step');
		store.save();

		const writesAfterFirstSave = storage.writes;
		store.save();
		store.save();

		expect(storage.writes).toBe(writesAfterFirstSave);
	});

	it('does nothing when no storage is attached', () => {
		store.addNode('step');
		expect(() => store.save()).not.toThrow();
	});
});

describe('loading', () => {
	it('restores nodes, edges, name and config', () => {
		store.attach(storage);
		store.name = 'trial-2026';
		store.config = { ...defaultConfig, page: { ...defaultConfig.page, title: 'Figure 4' } };
		const step = store.addNode('step', { x: 40, y: 80 });
		store.addEdge(store.nodes[0].id, step.id);
		store.save();

		const reopened = new FlowchartDocumentStore();
		reopened.attach(storage);

		expect(reopened.name).toBe('trial-2026');
		expect(reopened.config.page.title).toBe('Figure 4');
		expect(reopened.nodes).toHaveLength(2);
		expect(reopened.edges).toHaveLength(1);
		expect(reopened.nodes.find((n) => n.id === step.id)?.position).toEqual({ x: 40, y: 80 });
	});

	it('keeps ids stable across a reload', () => {
		store.attach(storage);
		const first = store.addNode('step');
		const second = store.addNode('substep');
		store.save();

		const reopened = new FlowchartDocumentStore();
		reopened.attach(storage);

		expect(reopened.nodes.map((n) => n.id)).toEqual(['0', first.id, second.id]);
	});

	it('continues ids after the highest one loaded rather than colliding', () => {
		store.attach(storage);
		store.addNode('step');
		store.addNode('step');
		store.save();

		const reopened = new FlowchartDocumentStore();
		reopened.attach(storage);
		const added = reopened.addNode('step');

		const ids = reopened.nodes.map((n) => n.id);
		expect(new Set(ids).size).toBe(ids.length);
		expect(Number(added.id)).toBeGreaterThan(2);
	});

	it('keeps an unconnected node across a reload', () => {
		store.attach(storage);
		const orphan = store.addNode('step', { x: 900, y: 900 });
		store.save();

		const reopened = new FlowchartDocumentStore();
		reopened.attach(storage);

		expect(reopened.nodes.map((n) => n.id)).toContain(orphan.id);
	});

	it('leaves the document alone when storage holds unreadable content', () => {
		storage.setItem(DOCUMENT_KEY, 'not json at all');

		store.attach(storage);

		expect(store.nodes).toHaveLength(1);
		expect(store.nodes[0].type).toBe('start');
	});
});

describe('adopting the old storage layout', () => {
	function seedLegacy() {
		storage.setItem(
			LEGACY_KEYS.nodes,
			JSON.stringify([
				{
					id: '0',
					type: 'start',
					position: { x: 0, y: 0 },
					data: { label: 'Screened', value: 500 }
				},
				{
					id: '1',
					type: 'step',
					position: { x: 0, y: 200 },
					data: {
						stepLabel: 'Enrolled',
						droppedLabel: 'Excluded',
						value: 420,
						delta: 80,
						row: null
					}
				}
			])
		);
		storage.setItem(LEGACY_KEYS.edges, JSON.stringify([{ id: '0--1', source: '0', target: '1' }]));
		storage.setItem(LEGACY_KEYS.config, JSON.stringify(dataV2Linear.config));
		storage.setItem(LEGACY_KEYS.name, 'my-trial.json');
		storage.setItem(LEGACY_KEYS.timestamp, '1700000000000');
	}

	it('reads the old keys into a document', () => {
		seedLegacy();

		const adopted = readLegacyStorage(storage);

		expect(adopted).not.toBeNull();
		expect(adopted?.graph.nodes).toHaveLength(2);
		expect(adopted?.graph.edges).toHaveLength(1);
	});

	it('strips the extension the old name field allowed', () => {
		seedLegacy();
		expect(readLegacyStorage(storage)?.name).toBe('my-trial');
	});

	it('adopts on load, then removes the old keys', () => {
		seedLegacy();

		store.attach(storage);

		expect(store.nodes).toHaveLength(2);
		expect(store.name).toBe('my-trial');
		expect(storage.getItem(DOCUMENT_KEY)).not.toBeNull();

		for (const key of Object.values(LEGACY_KEYS)) {
			expect(storage.getItem(key)).toBeNull();
		}
	});

	it('does not adopt when the new key already exists', () => {
		store.attach(storage);
		store.name = 'current';
		store.save();

		seedLegacy();

		const reopened = new FlowchartDocumentStore();
		reopened.attach(storage);

		expect(reopened.name).toBe('current');
		expect(storage.getItem(LEGACY_KEYS.nodes)).not.toBeNull();
	});

	it('returns null when there is nothing to adopt', () => {
		expect(readLegacyStorage(storage)).toBeNull();
	});
});

describe('cross-tab changes', () => {
	it('adopts a newer document written by another tab', () => {
		store.attach(storage);
		store.save();

		const other = new FlowchartDocumentStore();
		other.attach(storage);
		other.name = 'written-elsewhere';
		other.addNode('step');
		other.save();

		store.receiveStorageEvent({
			key: DOCUMENT_KEY,
			newValue: storage.getItem(DOCUMENT_KEY)
		});

		expect(store.name).toBe('written-elsewhere');
		expect(store.nodes).toHaveLength(2);
	});

	it('ignores its own write coming back', () => {
		store.attach(storage);
		store.name = 'mine';
		store.addNode('step');
		store.save();

		const ownValue = storage.getItem(DOCUMENT_KEY);
		store.name = 'edited since';

		store.receiveStorageEvent({ key: DOCUMENT_KEY, newValue: ownValue });

		expect(store.name).toBe('edited since');
	});

	it('ignores other keys', () => {
		store.attach(storage);
		store.name = 'mine';

		store.receiveStorageEvent({ key: 'something-else', newValue: '{}' });

		expect(store.name).toBe('mine');
	});

	it('picks up a change missed while hidden', () => {
		store.attach(storage);
		store.save();

		const other = new FlowchartDocumentStore();
		other.attach(storage);
		other.name = 'from-the-other-tab';
		other.save();

		store.syncFromStorage();

		expect(store.name).toBe('from-the-other-tab');
	});

	it('does not re-adopt unreadable content on every sync', () => {
		store.attach(storage);
		store.name = 'mine';
		store.save();

		storage.setItem(DOCUMENT_KEY, '{ broken');
		store.syncFromStorage();
		store.syncFromStorage();

		expect(store.name).toBe('mine');
	});
});

describe('replacing the document', () => {
	it('persists immediately', () => {
		store.attach(storage);

		store.replaceWith({
			name: 'imported',
			config: { ...defaultConfig },
			graph: {
				nodes: [
					{
						id: '3',
						type: 'start',
						position: { x: 0, y: 0 },
						data: { label: 'A', value: 1, row: null }
					}
				],
				edges: []
			}
		});

		const stored = JSON.parse(storage.getItem(DOCUMENT_KEY) ?? '{}');
		expect(stored.name).toBe('imported');
	});

	it('reseeds ids from the incoming document', () => {
		store.attach(storage);

		store.replaceWith({
			name: '',
			config: { ...defaultConfig },
			graph: {
				nodes: [
					{
						id: '42',
						type: 'start',
						position: { x: 0, y: 0 },
						data: { label: 'A', value: 1, row: null }
					}
				],
				edges: []
			}
		});

		expect(Number(store.addNode('step').id)).toBeGreaterThan(42);
	});

	it('resets back to an empty document', () => {
		store.attach(storage);
		store.name = 'something';
		store.addNode('step');

		store.reset();

		expect(store.isPristine).toBe(true);
		expect(store.nodes).toHaveLength(1);
	});
});
