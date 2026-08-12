import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Warms up the dev server before the `parcours/` specs run.
 *
 * Vite compiles routes on demand, so the first test to hit a given page pays
 * the compilation cost. Playwright's webServer only waits for the port to
 * answer, which happens long before any route is built, so the first tests to
 * touch a cold route routinely blew past their timeout — a different test on
 * every run.
 *
 * The route list is derived from the specs themselves rather than hand-written,
 * so it cannot drift as specs are added.
 */
const PARCOURS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../parcours');

function routesFromSpecs(): string[] {
	const routes = new Set<string>(['/']);
	for (const file of fs.readdirSync(PARCOURS_DIR)) {
		if (!file.endsWith('.spec.ts')) continue;
		const src = fs.readFileSync(path.join(PARCOURS_DIR, file), 'utf-8');
		// Only literal paths: templated ones carry ids resolved at run time.
		for (const m of src.matchAll(/goto\('(\/[^']*)'/g)) {
			routes.add(m[1].split('?')[0]);
		}
	}
	return [...routes];
}

export default async function globalSetup(): Promise<void> {
	if (!process.env.PUBLIC_API_BASE_URL) return;
	const base = process.env.PUBLIC_BASE_URL ?? 'http://localhost:5173';

	// Sequential on purpose: parallel requests against a cold Vite server queue
	// behind the same compilation anyway.
	for (const route of routesFromSpecs()) {
		try {
			await fetch(`${base}${route}`, { signal: AbortSignal.timeout(60_000) });
		} catch {
			// A route that fails to warm is not fatal; the test that needs it will
			// report the real error.
		}
	}
}
