import { flowchartDocument } from '@/document/store.svelte';

import { mergeFlowchartConfig, type TypstFlowchartConfig } from './config.ts';

// The configuration vocabulary lives in `./config.ts` so that schemas and tests
// can import it without pulling in runes or `localStorage`. Re-exported here so
// existing `style-config.svelte` imports keep working.
export * from './config.ts';

// Styling is part of the project document rather than a store of its own. This
// is a thin view onto it, kept so that `StyleConfigurator` can go on binding to
// `styleConfig.current.page.title` and friends.
export const styleConfig = {
	get current(): TypstFlowchartConfig {
		return flowchartDocument.config;
	},
	set current(value: TypstFlowchartConfig) {
		flowchartDocument.config = value;
	},
	reset() {
		flowchartDocument.config = mergeFlowchartConfig({});
	}
};
