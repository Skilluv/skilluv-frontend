import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('$env/dynamic/public', () => ({ env: {} }));

/**
 * Two surfaces the backend shipped ahead of the front.
 *
 * The open pool answers for all twelve trades and the front read only the
 * deprecated code-only route; the GitHub callback reports a refusal as
 * `?github_error=` on the URL and nothing read it.
 */

function ok(data: unknown, status = 200) {
	return {
		ok: true,
		status,
		json: () => Promise.resolve({ data, meta: { request_id: 'r', timestamp: '2026-09-11' } })
	};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let fetchMock: any;

beforeEach(() => {
	fetchMock = vi.fn();
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.resetModules();
});

describe('the open pool is one endpoint for twelve trades', () => {
	it('asks the shared route, not the deprecated code one', async () => {
		fetchMock.mockResolvedValue(ok({ slices: [], domain: null, max_difficulty: 3 }));
		const { openSlicesApi } = await import('../../src/lib/api/open_slices');
		await openSlicesApi.list({ domain: 'audio' });

		// `/code/first-issues` is `#[deprecated]` upstream and answers for one
		// trade. Eleven others had open unclaimed work and no listing.
		expect(fetchMock.mock.calls[0][0]).toBe('/api/open-slices?domain=audio');
	});

	it('carries every filter the endpoint accepts, and omits the ones left unset', async () => {
		fetchMock.mockResolvedValue(ok({ slices: [], domain: 'code', max_difficulty: 5 }));
		const { openSlicesApi } = await import('../../src/lib/api/open_slices');
		await openSlicesApi.list({
			domain: 'code',
			slice_type: 'github_issue',
			tag: 'rust',
			max_difficulty: 5,
			limit: undefined
		});

		const url = fetchMock.mock.calls[0][0] as string;
		expect(url).toContain('domain=code');
		expect(url).toContain('slice_type=github_issue');
		expect(url).toContain('tag=rust');
		expect(url).toContain('max_difficulty=5');
		// An absent filter must not travel as `limit=undefined`, which the
		// server would read as a value and refuse.
		expect(url).not.toContain('limit');
	});

	it('the code hub asks the pool for its one trade and its one surface', async () => {
		fetchMock.mockResolvedValue(ok({ slices: [], domain: 'code', max_difficulty: 3 }));
		const { openSlicesApi } = await import('../../src/lib/api/open_slices');
		// The two filters the deprecated route hardcoded, now in the query.
		await openSlicesApi.list({ domain: 'code', slice_type: 'github_issue' });
		expect(fetchMock.mock.calls[0][0]).toBe(
			'/api/open-slices?domain=code&slice_type=github_issue'
		);
	});
});

describe('a GitHub link that did not take', () => {
	it('reads the code off the URL and says what the URL should become', async () => {
		const { readGithubLinkError } = await import('../../src/lib/utils/github_link_error');

		const found = readGithubLinkError('?github_error=already_linked');
		expect(found.code).toBe('already_linked');
		// Cleared, or it reappears on every reload and travels in any link
		// copied out of the address bar.
		expect(found.cleanedSearch).toBe('');
	});

	it('keeps the other parameters when it removes its own', async () => {
		const { readGithubLinkError } = await import('../../src/lib/utils/github_link_error');
		const found = readGithubLinkError('?step=2&github_error=expired&from=rite');
		expect(found.code).toBe('expired');
		expect(found.cleanedSearch).toBe('?step=2&from=rite');
	});

	it('leaves a URL that carries no error exactly as it was', async () => {
		const { readGithubLinkError } = await import('../../src/lib/utils/github_link_error');
		const found = readGithubLinkError('?step=2');
		expect(found.code).toBeNull();
		expect(found.cleanedSearch).toBe('?step=2');
	});

	it('treats a code it has never heard of as a failure, not as a success', async () => {
		const { readGithubLinkError, githubLinkErrorKey } = await import(
			'../../src/lib/utils/github_link_error'
		);
		// A code added server-side must not arrive as silence: the link did
		// not happen either way, and `failed` is the backend's own catch-all.
		const found = readGithubLinkError('?github_error=rate_limited');
		expect(found.code).toBe('failed');
		expect(githubLinkErrorKey('rate_limited')).toBe('githubLink.errors.failed');
	});

	it('has wording for every code the backend can send, in both locales', async () => {
		const { GITHUB_LINK_ERRORS } = await import('../../src/lib/utils/github_link_error');
		const { fr } = await import('../../src/lib/i18n/fr');
		const { en } = await import('../../src/lib/i18n/en');
		const frErrors = fr.githubLink.errors as unknown as Record<string, string>;
		const enErrors = en.githubLink.errors as unknown as Record<string, string>;

		// Mirrors `github_error_code` in `routes::github`. A token with no
		// sentence would render as a raw i18n path on a page somebody reached
		// by failing at something.
		expect(GITHUB_LINK_ERRORS).toEqual([
			'already_linked',
			'expired',
			'invalid_request',
			'unavailable',
			'failed'
		]);
		for (const code of GITHUB_LINK_ERRORS) {
			expect(frErrors[code], `fr ${code}`).toBeTruthy();
			expect(enErrors[code], `en ${code}`).toBeTruthy();
		}
	});

	it('the GitHub consent link carries a return path', async () => {
		const { githubLinkUrl } = await import('../../src/lib/api/oauth_links');

		// Without one the callback ends on the API origin: success shows raw
		// JSON, and a failure has nowhere to put its error code. `connectUrl`
		// in `$api/github` took no return path at all, which is why settings
		// used to land there.
		expect(githubLinkUrl('/settings', '/api')).toBe(
			'/api/auth/github/start?return_to=%2Fsettings'
		);
		// An absolute or protocol-relative path is dropped rather than sent:
		// an open redirect straight off a consent screen is the most
		// convincing possible moment to bounce somebody elsewhere.
		expect(githubLinkUrl('//evil.example', '/api')).toBe('/api/auth/github/start');
		expect(githubLinkUrl('https://evil.example', '/api')).toBe('/api/auth/github/start');
	});

	it('no longer exports a second builder for the same route', async () => {
		const github = await import('../../src/lib/api/github');
		// Two builders for `/auth/github/start` is how one of them came to
		// hardcode `/api` and forget the return path.
		expect('connectUrl' in github).toBe(false);
	});
});
