import { describe, it, expect } from 'vitest';
import { globSync, readFileSync } from 'node:fs';

/**
 * Every link that starts an OAuth flow has to leave the app.
 *
 * These endpoints are the API's, and in development — and in any deployment
 * that leaves `PUBLIC_API_ORIGIN` empty — they are reached by a relative
 * path. A relative path is same-origin, so SvelteKit's client router treats
 * the anchor as an internal navigation, looks for a page at
 * `/api/auth/github/start`, finds none, and throws:
 *
 *     Error: Not found: /api/auth/github/start
 *       at navigate / _start_router
 *
 * `data-sveltekit-reload` is the documented opt-out. It costs nothing on an
 * absolute URL the router would already ignore, which is why it is
 * unconditional: a guard that only matters in one environment is a guard
 * nobody exercises.
 *
 * Source-level rather than rendered, because the failure is an attribute
 * being absent from markup, and that is exactly what this reads.
 */

/** Every `.svelte` file under `src`, keyed by POSIX path. */
function sources(): Map<string, string> {
	const files = globSync('src/**/*.svelte') as string[];
	return new Map(files.map((f) => [f.split('\\').join('/'), readFileSync(f, 'utf8')]));
}

/** How a link to an OAuth start is written, in any of its spellings. */
const OAUTH_HREF =
	/href=\{?[^}\n]*(githubLinkUrl\(|linkUrl\(|connectHref|retryUrl|oauthHref\(|\/api\/auth\/)/;

describe('a link that starts an OAuth flow leaves the app', () => {
	it('every anchor that points at one opts out of the router', () => {
		const offenders: string[] = [];

		for (const [file, src] of sources()) {
			const lines = src.split('\n');
			lines.forEach((line, i) => {
				if (!OAUTH_HREF.test(line)) return;
				// The attribute may sit on a later line of a wrapped tag, so
				// a window around the match is read rather than the line.
				const tag = lines.slice(Math.max(0, i - 6), i + 8).join('\n');
				if (tag.includes('data-sveltekit-reload')) return;
				// `SsoButton` renders the anchor itself and carries the
				// opt-out there, so its callers hand it an href and nothing
				// else. The assertion below holds it to that.
				if (/<SsoButton\b/.test(tag)) return;
				offenders.push(`${file}:${i + 1}  ${line.trim().slice(0, 70)}`);
			});
		}

		expect(offenders, `links the router would swallow:\n${offenders.join('\n')}`).toEqual([]);
	});

	it('the component that owns its own anchor carries the opt-out', () => {
		// Exempted above, so it is checked here rather than trusted.
		const sso = readFileSync('src/lib/components/ui/SsoButton.svelte', 'utf8');
		expect(sso).toMatch(/<a \{href\}[^>]*data-sveltekit-reload/);
	});

	it('finds the links it is meant to be guarding', () => {
		// A pattern that matched nothing would pass the test above for ever.
		let found = 0;
		for (const [, src] of sources()) {
			for (const line of src.split('\n')) if (OAUTH_HREF.test(line)) found += 1;
		}
		expect(found).toBeGreaterThanOrEqual(6);
	});

	it('the button component passes the attribute through to the anchor', () => {
		// The opt-out is handed to `Button`, which renders the anchor. If it
		// dropped unknown attributes, the markup above would be inert.
		const button = readFileSync('src/lib/components/ui/Button.svelte', 'utf8');
		expect(button).toContain('{...(rest as HTMLAnchorAttributes)}');
	});
});
