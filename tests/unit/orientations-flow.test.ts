import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

function ok(data: unknown) {
	return {
		ok: true,
		status: 200,
		json: () => Promise.resolve({ data, meta: { request_id: 'r', timestamp: '2026-07-15' } })
	};
}

function notFound() {
	return {
		ok: false,
		status: 404,
		json: () =>
			Promise.resolve({
				error: { code: 'RESOURCE_NOT_FOUND', message: 'nope' },
				meta: { request_id: 'r', timestamp: '2026-07-15' }
			})
	};
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
	vi.resetModules();
	fetchMock = vi.fn();
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

const userWithoutOrientations = {
	id: 'u1',
	email: 'a@b.co',
	username: 'a',
	first_name: 'A',
	last_name: 'B',
	display_name: 'A B',
	role: 'user',
	skill_domain: 'code',
	profile_completed: true,
	title: 'apprenti',
	golden_stars: 0,
	total_fragments: 0,
	streak_current: 0,
	trust_score: 100,
	country: null,
	city: null,
	bio: null,
	avatar_url: null,
	github: null,
	linkedin: null,
	website: null,
	twitter: null,
	email_verified: true,
	totp_enabled: false,
	email_2fa_enabled: false,
	profile_active: true,
	created_at: '2026-01-01'
};

describe('AuthState orientations lifecycle', () => {
	it('populates user.orientations after init()', async () => {
		fetchMock
			.mockResolvedValueOnce(ok({ user: userWithoutOrientations, login_method: 'password', has_passkey: false }))
			.mockResolvedValueOnce(ok([])) // capabilities
			// The envelope the endpoint actually answers. Mocked as a bare array,
			// this test agreed with the client rather than with the server, and
			// went green while `user.orientations` was being set to an object.
			.mockResolvedValueOnce(
				ok({
					orientations: [
						{
							orientation_slug: 'dev-frontend',
							orientation_name: 'Dev frontend',
							mode: 'learning',
							is_primary: true,
							started_at: '2026-06-01',
							ended_at: null,
							working_languages: ['fr']
						}
					]
				})
			);

		const { auth } = await import('../../src/lib/stores/auth.svelte');
		await auth.init();

		expect(auth.user?.orientations).toHaveLength(1);
		expect(auth.user?.orientations?.[0].orientation_slug).toBe('dev-frontend');
	});

	it('refreshOrientations() tolerates a 404 (backend endpoint absent)', async () => {
		fetchMock
			.mockResolvedValueOnce(ok({ user: userWithoutOrientations, login_method: 'password', has_passkey: false }))
			.mockResolvedValueOnce(ok([])) // capabilities
			.mockResolvedValueOnce(notFound()); // orientations 404

		const { auth } = await import('../../src/lib/stores/auth.svelte');
		await auth.init();

		expect(auth.user?.orientations).toEqual([]);
	});

	it('refreshOrientations() bails out silently when unauthenticated', async () => {
		const { auth } = await import('../../src/lib/stores/auth.svelte');
		auth.clear();
		fetchMock.mockClear();
		await auth.refreshOrientations();
		expect(fetchMock).not.toHaveBeenCalled();
	});
});

describe('orientationsApi sequential registration', () => {
	it('POSTs each pick in order with is_primary flag', async () => {
		fetchMock
			.mockResolvedValueOnce(ok({ slug: 'dev-frontend', mode: 'learning', is_primary: true }))
			.mockResolvedValueOnce(ok({ slug: 'security-analyst', mode: 'active', is_primary: false }));

		const { orientationsApi } = await import('../../src/lib/api/orientations');

		await orientationsApi.register({
			slug: 'dev-frontend',
			mode: 'learning',
			is_primary: true,
			working_languages: ['fr']
		});
		await orientationsApi.register({
			slug: 'security-analyst',
			mode: 'active',
			is_primary: false,
			working_languages: ['fr']
		});

		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(fetchMock.mock.calls[0][0]).toBe('/api/users/me/orientations');
		expect(fetchMock.mock.calls[1][0]).toBe('/api/users/me/orientations');
		const body1 = JSON.parse(fetchMock.mock.calls[0][1].body);
		const body2 = JSON.parse(fetchMock.mock.calls[1][1].body);
		expect(body1.is_primary).toBe(true);
		expect(body2.is_primary).toBe(false);
		// The field the API requires, named. Asserting only `is_primary` left the
		// one key that decides whether the request parses at all unchecked.
		expect(body1.slug).toBe('dev-frontend');
		expect(body2.slug).toBe('security-analyst');
	});
});
