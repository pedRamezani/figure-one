// The profile format that lived here has been replaced by the document module.
//
// A project document is the graph plus config and name, and a data document is
// the semantic form. Both are read through `readDocument` in
// `./document/read.ts`, which dispatches on kind and runs the right version
// chain. `createProfile` and `parseProfileJSON` are gone; nothing should build
// a profile by hand any more.

export { readDocument, type ReadResult } from './document/read.ts';
export { createProjectDocument, emptyProjectDocument, type ProjectDocument } from './document/project.ts';
export { createDataDocument } from './document/data.ts';
export { projectJSON, dataJSON } from './document/artifacts.ts';
export { downloadBlob } from './document/download.ts';
export { flowchartDocument } from './document/store.svelte.ts';
