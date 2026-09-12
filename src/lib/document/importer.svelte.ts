import { confirmDelete } from '@/components/ui/confirm-delete-dialog';

import { readDocument } from './read.ts';
import { flowchartDocument } from './store.svelte.ts';

/**
 * Opening a file, from the Import button or from a drop anywhere on the page.
 *
 * Both routes have to read, validate, confirm and report identically, so the
 * logic lives here rather than in whichever component happens to own a button.
 */
class DocumentImporter {
	/** The last failure, shown next to the export controls. */
	error = $state<string | null>(null);

	clearError(): void {
		this.error = null;
	}

	/** True for the only thing this app can open. */
	accepts(file: File): boolean {
		return file.type === 'application/json' || file.name.toLowerCase().endsWith('.json');
	}

	async importFile(file: File): Promise<void> {
		this.error = null;

		if (!this.accepts(file)) {
			this.error = `${file.name} is not a JSON file.`;
			return;
		}

		let parsed: unknown;
		try {
			parsed = JSON.parse(await file.text());
		} catch {
			this.error = `${file.name} is not valid JSON.`;
			return;
		}

		const result = readDocument(parsed, flowchartDocument.allocateId);

		if (!result.ok) {
			// This used to fail silently, so picking a file appeared to do nothing.
			this.error = result.error;
			return;
		}

		const apply = async () => {
			flowchartDocument.replaceWith(result.document, { needsLayout: result.needsLayout });
		};

		// Nothing to lose on a first visit, so do not ask.
		if (flowchartDocument.isPristine) {
			await apply();
			return;
		}

		confirmDelete({
			title: 'Replace flowchart',
			description: `Loading ${file.name} will replace the flowchart you have open, including its styling and name. This cannot be undone.`,
			confirm: { text: 'Replace' },
			onConfirm: apply
		});
	}

	/** Opens the file picker. */
	pickFile(): void {
		this.error = null;

		const fileInput = document.createElement('input');
		fileInput.type = 'file';
		fileInput.accept = 'application/json,.json';

		fileInput.onchange = (event) => {
			const target = event.target as HTMLInputElement | null;
			const file = target?.files?.[0];
			if (file) this.importFile(file);
		};

		fileInput.click();
	}
}

export const documentImporter = new DocumentImporter();
