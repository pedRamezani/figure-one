/**
 * Two document kinds, each with its own version line.
 *
 * - A **project** document is the graph, plus config and name. It is what
 *   localStorage holds, what Import and Export read and write, and what a
 *   shared link will reconstruct. Version one stored each node's split row;
 *   version two drops it, because rows are derived from the graph.
 * - A **data** document is the semantic form: steps, splits and groups, with no
 *   styling. It is a machine-readable export. Every file this app wrote before
 *   the project document existed is a data document, which is why its version
 *   line starts at one and the current version is three.
 *
 * A file with no `$kind` predates the marker and is therefore a data document.
 */

export const PROJECT_KIND = 'flowchart-project';
export const DATA_KIND = 'flowchart-data';

export const CURRENT_PROJECT_VERSION = 2;
export const CURRENT_DATA_VERSION = 3;

export type DocumentKind = typeof PROJECT_KIND | typeof DATA_KIND;
