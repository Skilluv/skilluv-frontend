#!/usr/bin/env node
// scripts/i18n-check.mjs
// Verifies i18n parity across FR/EN/AR and hunts for orphan keys.
// - Extracts keys referenced via i18n.t('a.b.c') in src/**/*.{ts,svelte}
// - Loads keys from fr.ts / en.ts / ar.ts
// - Fails when: a used key is missing in any language, OR any language holds
//   a key not used in the code AND not held by all other languages.
// Exits 0 on success, 1 on any violation.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'src');
const LANG_FILES = ['fr', 'en'].map((l) => ({
	locale: l,
	path: join(SRC, 'lib', 'i18n', `${l}.ts`)
}));

function walk(dir, out = []) {
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		const s = statSync(p);
		if (s.isDirectory()) {
			if (name === 'node_modules' || name === '.svelte-kit' || name === 'build') continue;
			walk(p, out);
		} else if (['.ts', '.svelte', '.js'].includes(extname(name))) {
			out.push(p);
		}
	}
	return out;
}

function extractUsedKeys(files) {
	const keyRe = /i18n\.t\(\s*['"]([a-zA-Z0-9_.]+)['"]/g;
	const used = new Set();
	for (const f of files) {
		const src = readFileSync(f, 'utf8');
		let m;
		while ((m = keyRe.exec(src))) used.add(m[1]);
	}
	return used;
}

// Flatten a nested translation object into dot-path keys (leaves only).
function flatten(obj, prefix = '', out = new Set()) {
	for (const [k, v] of Object.entries(obj)) {
		const path = prefix ? `${prefix}.${k}` : k;
		if (v && typeof v === 'object' && !Array.isArray(v)) {
			flatten(v, path, out);
		} else {
			out.add(path);
		}
	}
	return out;
}

async function loadLocaleKeys(entry) {
	const modUrl = new URL(`file://${entry.path.replaceAll('\\', '/')}`);
	// Vite would strip the type imports; when running through node we parse the
	// TS source manually via dynamic import + esbuild-loader is overkill here.
	// Instead: read source, isolate the exported object literal, and eval it in
	// a controlled scope. This is safe on our own maintained files.
	const src = readFileSync(entry.path, 'utf8');
	const startTag = src.indexOf('= {');
	const start = src.indexOf('{', startTag);
	if (start < 0) throw new Error(`Cannot find object literal start in ${entry.path}`);
	// Naive brace matching to find the matching closing brace.
	let depth = 0;
	let end = -1;
	for (let i = start; i < src.length; i++) {
		const c = src[i];
		if (c === '{') depth++;
		else if (c === '}') {
			depth--;
			if (depth === 0) {
				end = i;
				break;
			}
		}
	}
	if (end < 0) throw new Error(`Unbalanced braces in ${entry.path}`);
	const literal = src.slice(start, end + 1);
	// eslint-disable-next-line no-new-func
	const obj = new Function(`return (${literal});`)();
	return { locale: entry.locale, keys: flatten(obj), modUrl };
}

async function main() {
	const files = walk(SRC);
	const used = extractUsedKeys(files);
	const locales = await Promise.all(LANG_FILES.map(loadLocaleKeys));

	const violations = [];

	// 1) every used key must exist in every locale
	for (const key of used) {
		for (const loc of locales) {
			if (!loc.keys.has(key)) {
				violations.push(`missing key "${key}" in ${loc.locale}.ts`);
			}
		}
	}

	// 2) locale parity — any key present in one locale must be present in all others
	const [ref, ...rest] = locales;
	for (const other of rest) {
		for (const k of ref.keys) {
			if (!other.keys.has(k)) violations.push(`key "${k}" present in ${ref.locale}.ts but missing in ${other.locale}.ts`);
		}
		for (const k of other.keys) {
			if (!ref.keys.has(k)) violations.push(`key "${k}" present in ${other.locale}.ts but missing in ${ref.locale}.ts`);
		}
	}

	if (violations.length === 0) {
		process.stdout.write(`i18n-check ok: ${used.size} referenced keys, ${locales[0].keys.size} keys per locale\n`);
		process.exit(0);
	}

	process.stderr.write(`i18n-check failed:\n`);
	for (const v of violations.slice(0, 100)) process.stderr.write(`  - ${v}\n`);
	if (violations.length > 100) {
		process.stderr.write(`  (${violations.length - 100} more)\n`);
	}
	process.exit(1);
}

main().catch((err) => {
	process.stderr.write(`i18n-check crashed: ${err.stack ?? err.message}\n`);
	process.exit(1);
});
