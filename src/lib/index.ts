import { parseTypstFlowchartJSON, type TypstFlowchartData } from './preview/json/convert';
import { isFlowchartData } from './preview/json/validate';

import { styleConfig, type TypstFlowchartConfig } from './preview/style/style-config.svelte';
import { isFlowchartConfig } from './preview/style/validate';

import { setEdges, setNodes } from './preview/flow/Flow.svelte';

export type Profile = {
	$version: number;
	data: TypstFlowchartData;
	config: TypstFlowchartConfig;
};

export function createProfile(data: TypstFlowchartData, config: TypstFlowchartConfig): Profile {
	return {
		$version: 1,
		data: data,
		config: config
	};
}

function isObject(v: unknown): v is Record<string, unknown> {
	return typeof v === 'object' && v !== null;
}

function isNumber(n: unknown): n is number {
	return typeof n === 'number' && Number.isFinite(n);
}

export function isProfile(value: unknown): value is Profile {
	if (!isObject(value)) return false;

	const v = value as any;
	if (!isNumber(v.$version)) return false;
	if (!isFlowchartData(v.data)) return false;
	if (!isFlowchartConfig(v.config)) return false;

	return true;
}

export function setProfile(value: Profile): void {
	styleConfig.current = value.config;
	const parsed = parseTypstFlowchartJSON(value.data);
	setNodes(parsed.nodes);
	setEdges(parsed.edges);
}

export function downloadBlob(data: BlobPart, mimeType: string, fileName: string): void {
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
