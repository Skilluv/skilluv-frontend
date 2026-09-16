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

let fetchMock: ReturnType<typeof vi.fn>;

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
		expect(fetchMock.mock.calls[0][0]).toBe('/api/open-slices?domain=code&slice_type=github_issue');
	});
});

describe('a provider link that did not take', () => {
	it('reads the code off the URL and says what the URL should become', async () => {
		const { readOAuthLinkError } = await import('../../src/lib/utils/oauth_link_error');

		const { failure, cleanedSearch } = readOAuthLinkError('?github_error=already_linked');
		expect(failure).toEqual({ provider: 'github', code: 'already_linked' });
		// Cleared, or it reappears on every reload and travels in any link
		// copied out of the address bar.
		expect(cleanedSearch).toBe('');
	});

	it('names which of the four refused', async () => {
		const { readOAuthLinkError } = await import('../../src/lib/utils/oauth_link_error');

		// The parameter is namespaced by provider precisely so a settings page
		// offering four connect buttons can say which one it was.
		for (const provider of ['github', 'discord', 'google', 'linkedin'] as const) {
			const { failure } = readOAuthLinkError(`?${provider}_error=expired`);
			expect(failure).toEqual({ provider, code: 'expired' });
		}
	});

	it('keeps the other parameters when it removes its own', async () => {
		const { readOAuthLinkError } = await import('../../src/lib/utils/oauth_link_error');
		const { failure, cleanedSearch } = readOAuthLinkError(
			'?step=2&discord_error=expired&from=rite'
		);
		expect(failure).toEqual({ provider: 'discord', code: 'expired' });
		expect(cleanedSearch).toBe('?step=2&from=rite');
	});

	it('leaves a URL that carries no failure exactly as it was', async () => {
		const { readOAuthLinkError } = await import('../../src/lib/utils/oauth_link_error');
		const { failure, cleanedSearch } = readOAuthLinkError('?step=2');
		expect(failure).toBeNull();
		expect(cleanedSearch).toBe('?step=2');
	});

	it('strips only the one it reports, so a second reader still finds its own', async () => {
		const { readOAuthLinkError } = await import('../../src/lib/utils/oauth_link_error');
		// Two at once cannot happen — one callback runs at a time — but a
		// page can hold two readers owning different buttons, and clearing
		// the other's parameter before it has been read would lose the
		// message. `/settings/security` is exactly that page.
		const { failure, cleanedSearch } = readOAuthLinkError(
			'?google_error=failed&linkedin_error=expired'
		);
		expect(failure).toEqual({ provider: 'google', code: 'failed' });
		expect(cleanedSearch).toBe('?linkedin_error=expired');
	});

	it('treats a code it has never heard of as a failure, not as a success', async () => {
		const { readOAuthLinkError, oauthLinkErrorKey } =
			await import('../../src/lib/utils/oauth_link_error');
		// A code added server-side must not arrive as silence: the link did
		// not happen either way, and `failed` is the backend's own catch-all.
		const { failure } = readOAuthLinkError('?github_error=rate_limited');
		expect(failure).toEqual({ provider: 'github', code: 'failed' });
		expect(oauthLinkErrorKey('rate_limited')).toBe('oauthLink.errors.failed');
	});

	it('has wording for every code the backend can send, in both locales', async () => {
		const { OAUTH_LINK_ERRORS } = await import('../../src/lib/utils/oauth_link_error');
		const { fr } = await import('../../src/lib/i18n/fr');
		const { en } = await import('../../src/lib/i18n/en');
		const frErrors = fr.oauthLink.errors as unknown as Record<string, string>;
		const enErrors = en.oauthLink.errors as unknown as Record<string, string>;

		// Mirrors `oauth_error_code` in `routes::oauth` — one function for the
		// four providers, so one list here. A token with no sentence would
		// render as a raw i18n path on a page somebody reached by failing.
		expect(OAUTH_LINK_ERRORS).toEqual([
			'already_linked',
			'expired',
			'invalid_request',
			'unavailable',
			'failed'
		]);
		for (const code of OAUTH_LINK_ERRORS) {
			expect(frErrors[code], `fr ${code}`).toBeTruthy();
			expect(enErrors[code], `en ${code}`).toBeTruthy();
		}
	});

	it('names the brand rather than interpolating its slug', async () => {
		const { OAUTH_PROVIDER_NAMES, LINK_ERROR_PROVIDERS } =
			await import('../../src/lib/utils/oauth_link_error');
		// "Ce compte linkedin est déjà lié" is what the slug would produce.
		expect(OAUTH_PROVIDER_NAMES.linkedin).toBe('LinkedIn');
		expect(OAUTH_PROVIDER_NAMES.github).toBe('GitHub');
		for (const provider of LINK_ERROR_PROVIDERS) {
			expect(OAUTH_PROVIDER_NAMES[provider], provider).toBeTruthy();
		}
	});

	it('every consent link carries a return path', async () => {
		const { githubLinkUrl, linkUrl, LINKABLE_PROVIDERS } =
			await import('../../src/lib/api/oauth_links');

		// Without one the callback ends on the API origin: success shows raw
		// JSON, and a failure has nowhere to put its error code. That is the
		// condition on the whole mechanism, for all four.
		expect(githubLinkUrl('/settings/security', '/api')).toBe(
			'/api/auth/github/start?return_to=%2Fsettings%2Fsecurity'
		);
		for (const provider of LINKABLE_PROVIDERS) {
			expect(linkUrl(provider, '/settings', '/api')).toBe(
				`/api/auth/${provider}/link?return_to=%2Fsettings`
			);
		}

		// An absolute or protocol-relative path is dropped rather than sent:
		// an open redirect straight off a consent screen is the most
		// convincing possible moment to bounce somebody elsewhere.
		expect(githubLinkUrl('//evil.example', '/api')).toBe('/api/auth/github/start');
		expect(linkUrl('google', 'https://evil.example', '/api')).toBe('/api/auth/google/link');
	});

	it('no longer exports a second builder for the GitHub route', async () => {
		const github = await import('../../src/lib/api/github');
		// Two builders for `/auth/github/start` is how one of them came to
		// hardcode `/api` and forget the return path.
		expect('connectUrl' in github).toBe(false);
	});
});
