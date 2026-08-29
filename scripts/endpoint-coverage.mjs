#!/usr/bin/env node
/**
 * Which backend endpoints this front calls, and which it does not.
 *
 * The number this prints is the only honest answer to "are we done". It was
 * written after three rounds of claiming completion on a scope narrower than
 * the question — the fix for that is a measurement anybody can rerun, not a
 * more careful claim.
 *
 *   node scripts/endpoint-coverage.mjs            summary by module
 *   node scripts/endpoint-coverage.mjs --list     every uncalled path
 *   node scripts/endpoint-coverage.mjs --module q quality's detail
 *
 * ## How it matches
 *
 * Backend side: every `.route("…")` under `src/routes/**` on the backend's
 * current branch, with `{id}`-style parameters collapsed to `{}`.
 *
 * Front side: every quoted path literal anywhere in `src/**`, with `${…}`
 * collapsed the same way. The collapse is brace-balanced on purpose —
 * `${encodeURIComponent(x)}` contains parentheses, and a character class that
 * forgets them truncates the path and reports a consumed endpoint as missing.
 * That bug cost a whole round of false findings; the balanced walk is why this
 * is a script rather than a one-liner.
 *
 * ## What it deliberately does not claim
 *
 * It does not prove an endpoint is dead. A path built by joining segments, or
 * named only in a generated client, reads as uncalled here. Treat a miss as a
 * question, not a verdict — every one of them still has to be opened and read.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';

const FRONT = resolve(process.cwd(), 'src');
const BACK = resolve(process.cwd(), '..', 'skilluv-backend', 'src', 'routes');

/** Paths that belong to another repo or are not called by a browser. */
/**
 * Paths no browser client can call, and why.
 *
 * OAuth callbacks are navigated to by the identity provider, not fetched: the
 * server reads the code, sets a cookie and redirects. A client calling one
 * would be handing itself a code it did not receive.
 *
 * `/guild-invitations/{id}` is the older spelling of a route that also exists
 * as `/guilds/{id}/invitations/{invitation_id}`, which is the one the front
 * calls — SKI-289 kept both.
 */
const UNREACHABLE = [
	'/auth/github/callback',
	'/auth/github/login/callback',
	'/auth/google/callback',
	'/auth/linkedin/callback',
	'/guild-invitations/{}'
];

const SKIP = [
	'/admin', '/enterprise', '/webhooks', '/public/v1', '/v1/', '/scim',
	'/health', '/metrics', '/.well-known', '/security.txt', '/manifest',
	'/stripe/', '/dev/', '/email/', '/i18n/', '/oauth'
];

function walk(dir, exts, out = []) {
	if (!existsSync(dir)) return out;
	for (const entry of readdirSync(dir)) {
		const p = join(dir, entry);
		if (statSync(p).isDirectory()) walk(p, exts, out);
		else if (exts.some((e) => entry.endsWith(e))) out.push(p);
	}
	return out;
}

/** Collapse `${…}` with balanced braces, then `{id}` — both become `{}`. */
function collapse(s) {
	let out = '';
	for (let i = 0; i < s.length; ) {
		if (s.startsWith('${', i)) {
			let depth = 1;
			let j = i + 2;
			while (j < s.length && depth > 0) {
				if (s[j] === '{') depth++;
				else if (s[j] === '}') depth--;
				j++;
			}
			out += '{}';
			i = j;
		} else {
			out += s[i++];
		}
	}
	return out.replace(/\{[a-zA-Z_]*\}/g, '{}');
}

const routes = new Map();
for (const file of walk(BACK, ['.rs'])) {
	const mod = basename(file, '.rs');
	const src = readFileSync(file, 'utf8');
	for (const m of src.matchAll(/\.route\(\s*"(\/[^"]*)"/g)) {
		const p = m[1].replace(/\{[a-zA-Z_]*\}/g, '{}');
		if (!routes.has(p)) routes.set(p, mod);
		// A handful of routes carry `/api` in their own registration while the
		// client adds it for everyone else. Record the bare form too, or a
		// consumed endpoint reads as missing.
		if (p.startsWith('/api/') && !routes.has(p.slice(4))) routes.set(p.slice(4), mod);
	}
}

const called = new Set();
for (const file of walk(FRONT, ['.ts', '.svelte', '.js'])) {
	const src = readFileSync(file, 'utf8');
	for (const m of src.matchAll(/'(\/[^'\n]*)'|"(\/[^"\n]*)"|`(\/[^`]*)`/g)) {
		const raw = m[1] ?? m[2] ?? m[3];
		const p = collapse(raw);
		called.add(p);
		// A direct fetch carries the /api prefix the client adds for everyone else.
		if (p.startsWith('/api/')) called.add(p.slice(4));
	}
	// A URL built from a base — `${baseUrl}/users/${u}/badge.svg` — has no
	// leading slash, so the pass above never sees it. Read those separately and
	// keep only the tail, which is the path the backend registered.
	for (const m of src.matchAll(/`\$\{[^}]*\}(\/[^`]*)`/g)) {
		called.add(collapse(m[1]).replace(/\{\}/g, '{}'));
	}
	// A path with an interpolated *segment* — `/users/${u}/${domain}-profile` —
	// collapses to `/users/{}/{}-profile`, which matches no registered route.
	// Widen those into every route they could be, rather than reporting a
	// consumed endpoint as missing.
	for (const p of [...called]) {
		if (!p.includes('{}-')) continue;
		for (const route of routes.keys()) {
			const rx = new RegExp('^' + p.replace(/\{\}/g, '[^/]*').replace(/[.]/g, '\.') + '$');
			if (rx.test(route)) called.add(route);
		}
	}
}

const byModule = new Map();
for (const [path, mod] of [...routes].sort()) {
	if (SKIP.some((s) => path.startsWith(s))) continue;
	if (UNREACHABLE.includes(path)) continue;
	// Counted under its bare form, which the loop above also recorded.
	if (path.startsWith('/api/') && routes.has(path.slice(4))) continue;
	if (!byModule.has(mod)) byModule.set(mod, { total: 0, done: 0, missing: [] });
	const row = byModule.get(mod);
	row.total++;
	if (called.has(path)) row.done++;
	else row.missing.push(path);
}

const args = process.argv.slice(2);
const only = args.includes('--module') ? args[args.indexOf('--module') + 1] : null;
const list = args.includes('--list');

let total = 0;
let done = 0;
for (const row of byModule.values()) {
	total += row.total;
	done += row.done;
}

if (only) {
	const row = byModule.get(only);
	if (!row) {
		console.log(`no module "${only}"`);
		process.exit(1);
	}
	console.log(`${only}: ${row.done}/${row.total}`);
	for (const p of row.missing) console.log('  ', p);
	process.exit(0);
}

console.log(
	`endpoints ${done}/${total} consumed — ${total - done} left (${Math.round((100 * done) / total)}%)\n`
);
const rows = [...byModule.entries()]
	.filter(([, r]) => r.total > r.done)
	.sort((a, b) => b[1].missing.length - a[1].missing.length || a[0].localeCompare(b[0]));

for (const [mod, r] of rows) {
	console.log(`${mod.padEnd(26)} ${String(r.done).padStart(3)}/${String(r.total).padEnd(3)} missing ${r.missing.length}`);
	if (list) for (const p of r.missing) console.log('   ', p);
}
if (rows.length === 0) console.log('nothing left.');
