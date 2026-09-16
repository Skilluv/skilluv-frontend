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
				// Two components own their own anchor and carry the opt-out
				// there, so their callers hand them an href and nothing else.
				// The assertions below hold both to that.
				if (/<(SsoButton|OAuthStartLink)\b/.test(tag)) return;
				offenders.push(`${file}:${i + 1}  ${line.trim().slice(0, 70)}`);
			});
		}

		expect(offenders, `links the router would swallow:\n${offenders.join('\n')}`).toEqual([]);
	});

	it('the components that own their own anchor carry the opt-out', () => {
		// Exempted above, so they are checked here rather than trusted.
		const sso = readFileSync('src/lib/components/ui/SsoButton.svelte', 'utf8');
		expect(sso).toMatch(/<a \{href\}[^>]*data-sveltekit-reload/);

		const start = readFileSync('src/lib/components/settings/OAuthStartLink.svelte', 'utf8');
		expect(start).toContain('data-sveltekit-reload');
	});

	it('an authenticated flow renews the session before the browser leaves', () => {
		// An access token lasts fifteen minutes and these four routes are
		// authenticated. Every other call survives that — the API client
		// posts `/auth/refresh` on a 401 and replays — but a full-page
		// navigation cannot: the browser is gone before anything of ours
		// runs, and a stale cookie comes back as a bare 401.
		const start = readFileSync('src/lib/components/settings/OAuthStartLink.svelte', 'utf8');
		expect(start).toContain('authApi.refresh()');
		expect(start).toContain('event.preventDefault()');
		// The gestures that open elsewhere have no page to come back to, so
		// they are left to the browser rather than hijacked.
		expect(start).toMatch(/metaKey|ctrlKey/);
	});

	it('the authenticated starts all go through it', () => {
		// `/auth/*/start` for sign-in needs no session and is deliberately
		// not routed through the refreshing link; the linking routes are.
		const routed = [...sources()].filter(([, src]) => src.includes('<OAuthStartLink'));
		expect(routed.length).toBeGreaterThanOrEqual(5);
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
