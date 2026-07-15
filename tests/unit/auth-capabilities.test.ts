import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

function ok(data: unknown) {
	return {
		ok: true,
		status: 200,
		json: () => Promise.resolve({ data, meta: { request_id: 'r', timestamp: '2026-07-15' } })
	};
}

function unauthorized() {
	return {
		ok: false,
		status: 401,
		json: () =>
			Promise.resolve({
				error: { code: 'AUTH_UNAUTHORIZED', message: 'nope' },
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

describe('AuthState capabilities', () => {
	it('starts with an empty capabilities array', async () => {
		const { auth } = await import('../../src/lib/stores/auth.svelte');
		expect(auth.capabilities).toEqual([]);
	});

	it('can() returns false when no capability is loaded', async () => {
		const { auth } = await import('../../src/lib/stores/auth.svelte');
		expect(auth.can('mentor')).toBe(false);
		expect(auth.can('admin')).toBe(false);
	});

	it('refreshCapabilities() bails out silently when unauthenticated', async () => {
		const { auth } = await import('../../src/lib/stores/auth.svelte');
		auth.clear();
		await auth.refreshCapabilities();
		expect(auth.capabilities).toEqual([]);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('init() loads user + capabilities in one pass', async () => {
		fetchMock
			.mockResolvedValueOnce(
				ok({
					user: {
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
					},
					login_method: 'password',
					has_passkey: false
				})
			)
			.mockResolvedValueOnce(
				ok([
					{
						capability: 'mentor',
						granted_at: '2026-01-01',
						granted_reason: 'auto-promotion'
					},
					{
						capability: 'forum_moderator',
						granted_at: '2026-02-01',
						granted_reason: 'nomination'
					}
				])
			);

		const { auth } = await import('../../src/lib/stores/auth.svelte');
		await auth.init();

		expect(auth.user?.id).toBe('u1');
		expect(auth.capabilities).toHaveLength(2);
		expect(auth.can('mentor')).toBe(true);
		expect(auth.can('forum_moderator')).toBe(true);
		expect(auth.can('admin')).toBe(false);
	});

	it('init() clears capabilities when /auth/me fails', async () => {
		fetchMock.mockResolvedValue(unauthorized());
		const { auth } = await import('../../src/lib/stores/auth.svelte');
		await auth.init();
		expect(auth.user).toBeNull();
		expect(auth.capabilities).toEqual([]);
	});

	it('logout() clears capabilities', async () => {
		fetchMock.mockResolvedValue(ok({}));
		const { auth } = await import('../../src/lib/stores/auth.svelte');
		auth.capabilities = [
			{ capability: 'mentor', granted_at: '2026-01-01', granted_reason: 'x' }
		];
		await auth.logout();
		expect(auth.capabilities).toEqual([]);
	});

	it('can() ignores expired capabilities', async () => {
		const { auth } = await import('../../src/lib/stores/auth.svelte');
		auth.capabilities = [
			{
				capability: 'jury_tournament',
				granted_at: '2026-01-01',
				granted_reason: 'season 1',
				expires_at: new Date(Date.now() - 60_000).toISOString()
			}
		];
		expect(auth.can('jury_tournament')).toBe(false);
	});
});
