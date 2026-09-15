/**
 * Fail if the git tag disagrees with the version in package.json.
 *
 * A tag that says one thing while the project says another produces a release
 * nobody can find. Unlike a package registry there is nothing here that refuses
 * a duplicate, so this check is the only thing standing between a typo and a
 * permanent Zenodo record carrying the wrong version.
 */

import { readFileSync } from 'node:fs';

const tagVersion = process.argv[2];
if (!tagVersion) {
	console.error('usage: check-tag.mjs <version>');
	process.exit(2);
}

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));

if (!version) {
	console.error('FAIL: package.json has no version');
	process.exit(1);
}

if (tagVersion !== version) {
	console.error(`FAIL: tag says "${tagVersion}", package.json says "${version}"`);
	process.exit(1);
}

console.log(`OK  tag and package.json agree on ${version}`);
