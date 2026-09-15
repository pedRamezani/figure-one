/**
 * Print the CHANGELOG.md section for one version.
 *
 * Used to build the GitHub release body. Exits non-zero when the version has no
 * entry, which fails the release rather than publishing one with empty notes.
 * The notes are the first thing anyone reads, and a missing changelog entry is
 * easier to fix before the tag than after it — doubly so here, where the
 * release is what Zenodo archives, and a Zenodo record cannot be edited.
 */

import { readFileSync } from 'node:fs';

const version = process.argv[2];
if (!version) {
	console.error('usage: extract-changelog.mjs <version>');
	process.exit(2);
}

const lines = readFileSync('CHANGELOG.md', 'utf8').split('\n');

// Headings look like `## [0.1.0] - 2026-09-15`; match the version, not the date.
const escaped = version.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');
const heading = new RegExp(String.raw`^##\s+\[${escaped}\]`);

const start = lines.findIndex((line) => heading.test(line));
if (start === -1) {
	console.error(`FAIL: CHANGELOG.md has no entry for ${version}`);
	process.exit(1);
}

let end = lines.length;
for (let i = start + 1; i < lines.length; i += 1) {
	if (lines[i].startsWith('## ')) {
		end = i;
		break;
	}
}

const body = lines
	.slice(start + 1, end)
	.join('\n')
	.trim();
if (!body) {
	console.error(`FAIL: the CHANGELOG.md entry for ${version} is empty`);
	process.exit(1);
}

console.log(body);
