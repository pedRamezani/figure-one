import { convertFlowchartToTypstFlowchartData } from '@/preview/json/convert';

import { createDataDocument } from './data.ts';
import { hydrateGraph } from './graph-schema.ts';
import { createProjectDocument, type ProjectDocument } from './project.ts';

// The two JSON artifacts, as pure functions of a document snapshot.
//
// The project file is the graph and is what Import reads back. The data file is
// the semantic form, derived here rather than stored, and carries no styling.

export function projectJSON(document: ProjectDocument): string {
	return JSON.stringify(createProjectDocument(document), null, 2);
}

export function dataJSON(document: ProjectDocument): string {
	const graph = hydrateGraph(document.graph);
	return JSON.stringify(createDataDocument(convertFlowchartToTypstFlowchartData(graph)), null, 2);
}
