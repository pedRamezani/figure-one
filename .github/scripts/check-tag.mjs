/**
 * Fail if the git tag disagrees with the version in package.json or
 * CITATION.cff.
 *
 * A tag that says one thing while the project says another produces a release
 * nobody can find. Unlike a package registry there is nothing here that refuses
 * a duplicate, so this check is the only thing standing between a typo and a
 * permanent Zenodo record carrying the wrong version.
 *
 * CITATION.cff is checked too because it is what people copy into their
 * reference manager: a stale version there cites the wrong release.
 */

import { readFileSync } from 'node:fs';

const tagVersion = process.argv[2];
if (!tagVersion) {
	console.error('usage: check-tag.mjs <version>');
	process.exit(2);
}

const { version: packageVersion } = JSON.parse(readFileSync('package.json', 'utf8'));

// A top-level `version:` line. Read with a pattern rather than a YAML parser so
// the script keeps running on a bare Node with no dependencies installed.
const citation = readFileSync('CITATION.cff', 'utf8');
const citationVersion = citation.match(/^version:\s*["']?([^"'\s#]+)/m)?.[1];

const failures = [];
if (packageVersion !== tagVersion) {
	failures.push(`package.json says "${packageVersion ?? '(none)'}"`);
}
if (citationVersion !== tagVersion) {
	failures.push(`CITATION.cff says "${citationVersion ?? '(none)'}"`);
}

if (failures.length > 0) {
	console.error(`FAIL: tag says "${tagVersion}", but ${failures.join(' and ')}`);
	process.exit(1);
}

console.log(`OK  tag, package.json and CITATION.cff agree on ${tagVersion}`);
