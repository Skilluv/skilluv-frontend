import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * The three contracts the frontend asked the backend for, now that the backend
 * has shipped them. Each of these assertions guards a failure that renders
 * perfectly and is wrong on the wire, which is the only kind this surface has
 * ever produced.
 */

const publicEnv = vi.hoisted(() => ({}) as Record<string, string | undefined>);
vi.mock('$env/dynamic/public', () => ({ env: publicEnv }));

import { createApiClient, csrfHeaders } from '$api/client';
import { linkUrl } from '$api/oauth_links';

function okFetch(payload: unknown = { data: {} }) {
	return vi.fn().mockResolvedValue({
		ok: true,
		status: 200,
		json: () => Promise.resolve(payload)
	});
}

beforeEach(() => {
	for (const k of Object.keys(publicEnv)) delete publicEnv[k];
	document.cookie = '';
});

afterEach(() => {
	for (const name of ['csrf_token', 'admin_csrf_token']) {
		document.cookie = `${name}=; Max-Age=0; path=/`;
	}
});

// ─── SKI-357: the double-submit header ───────────────────────────────────

describe('CSRF double-submit', () => {
	it('sends no header on safe methods', () => {
		document.cookie = 'csrf_token=abc';
		expect(csrfHeaders('GET')).toEqual({});
		expect(csrfHeaders('HEAD')).toEqual({});
		expect(csrfHeaders('OPTIONS')).toEqual({});
	});

	it('echoes the cookie on writes', () => {
		document.cookie = 'csrf_token=abc';
		expect(csrfHeaders('POST')).toEqual({ 'X-CSRF-Token': 'abc' });
		expect(csrfHeaders('delete')).toEqual({ 'X-CSRF-Token': 'abc' });
	});

	it('prefers the admin cookie, as the backend reader does', () => {
		// Both cookies are visible on the app origin now that they carry a
		// Domain on the shared parent. The server reads admin first; echoing
		// the public one would be compared against the admin one and 403.
		document.cookie = 'csrf_token=public';
		document.cookie = 'admin_csrf_token=admin';
		expect(csrfHeaders('POST')).toEqual({ 'X-CSRF-Token': 'admin' });
	});

	it('omits the header entirely when no cookie is readable', () => {
		expect(csrfHeaders('POST')).toEqual({});
	});

	it('carries the header through the shared client on a write', async () => {
		document.cookie = 'csrf_token=tok';
		const f = okFetch();
		const client = createApiClient(f as never, 'http://test/api');
		await client.post('/x', { a: 1 });
		expect(f.mock.calls[0][1].headers['X-CSRF-Token']).toBe('tok');
	});
});

describe('the writes that cannot use the shared client', () => {
	/**
	 * Multipart uploads set their own boundary, so they call `fetch` directly
	 * and have to repeat by hand what the client would have done: the API base,
	 * and the CSRF header. Missing either is invisible until deploy — a wrong
	 * base 404s only on the split-origin host, and a missing header 403s only
	 * once the backend layer enforces.
	 */
	async function upload(mod: string, call: (api: never) => Promise<unknown>) {
		const f = okFetch({ data: { key: 'k', note: 'n', document_id: 'd' } });
		vi.resetModules();
		vi.stubGlobal('fetch', f);
		publicEnv.PUBLIC_API_ORIGIN = 'https://api.skill-uv.com';
		document.cookie = 'csrf_token=tok';
		const api = await import(/* @vite-ignore */ mod);
		await call(api as never);
		return f;
	}

	afterEach(() => vi.unstubAllGlobals());

	it('a security proof upload carries the base and the header', async () => {
		const f = await upload('$api/security', (m: never) =>
			(
				m as { securityApi: { uploadProof: (f: File) => Promise<unknown> } }
			).securityApi.uploadProof(new File(['x'], 'a.png'))
		);
		const [url, init] = f.mock.calls[0];
		expect(url).toBe('https://api.skill-uv.com/api/security/reports/uploads');
		expect(init.headers['X-CSRF-Token']).toBe('tok');
		expect(Object.keys(init.headers)).not.toContain('Content-Type');
	});

	it('a KYC document upload carries the base and the header', async () => {
		const f = await upload('$api/kyc', (m: never) =>
			(
				m as {
					kycApi: { uploadDocument: (k: string, f: File) => Promise<unknown> };
				}
			).kycApi.uploadDocument('id_card', new File(['x'], 'a.png'))
		);
		const [url, init] = f.mock.calls[0];
		expect(url).toBe('https://api.skill-uv.com/api/enterprise/kyc/documents');
		expect(init.headers['X-CSRF-Token']).toBe('tok');
	});
});

// ─── SKI-356: the social contract ────────────────────────────────────────

describe('social comments', () => {
	/**
	 * `social.ts` builds its client at import time and captures `fetch` then,
	 * so the stub has to be in place before the module is loaded — hence the
	 * reset and the dynamic import rather than a top-level one.
	 */
	async function withStubbedFetch(payload: unknown) {
		const f = okFetch(payload);
		vi.resetModules();
		vi.stubGlobal('fetch', f);
		const { socialApi } = await import('$api/social');
		return { f, socialApi };
	}

	afterEach(() => vi.unstubAllGlobals());

	it('lists through the path route, not query parameters', async () => {
		// `/social/comments?target_type=…` is not a route: the target belongs in
		// the path, and the query form answered 404 for every thread.
		const { f, socialApi } = await withStubbedFetch({ data: { comments: [] } });
		await socialApi.listComments('post', 'abc');
		expect(f.mock.calls[0][0]).toBe('/api/social/comments/post/abc');
	});

	it('names target types and reaction kinds the backend validator accepts', async () => {
		const { f, socialApi } = await withStubbedFetch({ data: {} });
		await socialApi.createComment('post', 'abc', 'hello');
		await socialApi.toggleReaction('comment', 'abc', 'upvote');
		const created = JSON.parse(f.mock.calls[0][1].body);
		const reacted = JSON.parse(f.mock.calls[1][1].body);
		// `forum_post` and `up` were rejected by the validator before touching
		// the database, which made the whole forum social surface inert.
		expect(created.target_type).toBe('post');
		expect(reacted.target_type).toBe('comment');
		expect(reacted.kind).toBe('upvote');
	});
});

// ─── SKI-359: the OAuth return path ──────────────────────────────────────

describe('linkUrl', () => {
	it('targets the API base, not a relative /api the SPA origin cannot serve', () => {
		publicEnv.PUBLIC_API_ORIGIN = 'https://api.skill-uv.com';
		expect(linkUrl('google')).toBe('https://api.skill-uv.com/api/auth/google/link');
	});

	it('stays relative when no origin is declared', () => {
		expect(linkUrl('linkedin')).toBe('/api/auth/linkedin/link');
	});

	it('carries the return path so the callback does not end on raw JSON', () => {
		expect(linkUrl('google', '/settings/account')).toBe(
			'/api/auth/google/link?return_to=%2Fsettings%2Faccount'
		);
	});

	it('refuses a return path that is not a same-site path', () => {
		// A protocol-relative target is an open redirect off a consent screen.
		expect(linkUrl('google', '//evil.example/x')).toBe('/api/auth/google/link');
		expect(linkUrl('google', 'https://evil.example')).toBe('/api/auth/google/link');
	});

	it('links discord, which the backend serves and the onboarding offers', () => {
		expect(linkUrl('discord', '/onboarding')).toBe(
			'/api/auth/discord/link?return_to=%2Fonboarding'
		);
	});
});
