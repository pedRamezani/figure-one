import {
	parseTypstFlowchartJSON,
	type TypstFlowchartData,
	type TypstSteps,
	type TypstStep,
	type TypstGroups
} from './preview/json/convert';
import { isTypstFlowchartData, isTypstFlowchartDataV1 } from './preview/json/validate';

import { styleConfig, type TypstFlowchartConfig } from './preview/style/style-config.svelte';
import { isPartialFlowchartConfig, mergePartialFlowchartConfig } from './preview/style/validate';

import { setEdges, setNodes } from './preview/flow/Flow.svelte';

import { isNumber, isObject } from './utils.ts';

export type Profile = {
	$version: number;
	data: TypstFlowchartData;
	config: TypstFlowchartConfig;
};

export function createProfile(data: TypstFlowchartData, config: TypstFlowchartConfig): Profile {
	return {
		$version: 2,
		data: data,
		config: config
	};
}

// export function isProfile(value: unknown): value is Profile {
// 	if (!isObject(value)) return false;

// 	const v = value as any;
// 	if (!isNumber(v.$version)) return false;
// 	if (!isFlowchartData(v.data)) return false;
// 	if (!isFlowchartConfig(v.config)) return false;

// 	return true;
// }

export function parseProfileJSON(value: unknown): Profile | null {
	if (!isObject(value)) return null;

	// Version
	if (!isNumber(value.$version)) return null;

	// Data
	let flowchartData: TypstFlowchartData;
	if (isTypstFlowchartData(value.data)) {
		flowchartData = value.data;
		console.info('JSONnewFD');
	} else if (isTypstFlowchartDataV1(value.data)) {
		const parsedMainSteps: TypstStep[] = [];
		const parsedGroups: TypstGroups = {};
		for (let i = 0; i <= value.data.length - 1; i++) {
			const entry = value.data[i];
			parsedMainSteps.push({
				label: entry.stepLabel,
				value: entry.value,
				delta:
					i == 0
						? null
						: {
								label: entry.droppedLabel,
								value: entry.delta,
								substeps: entry.substepDeltas.map((it) => ({
									label: it.label,
									value: it.delta
								}))
							}
			});

			if (entry.group.length > 0) {
				(parsedGroups[entry.group] ??= []).push(i);
			}
		}
		const parsedSteps: TypstSteps = {
			main: parsedMainSteps,
			splits: []
		};
		const parsedData: TypstFlowchartData = {
			steps: parsedSteps,
			groups: parsedGroups
		};
		flowchartData = parsedData;
		console.info('JSONlegacyFD');
	} else {
		console.error('JSONnotSupported');
		return null;
	}

	// Config
	if (!isPartialFlowchartConfig(value.config)) return null;

	return {
		$version: value.$version,
		data: flowchartData,
		config: mergePartialFlowchartConfig(value.config)
	};
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
