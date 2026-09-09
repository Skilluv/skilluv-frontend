import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Coming back to a tab twenty minutes later.
 *
 * The access token lasts fifteen minutes; the refresh token lasts seven days
 * and rotates on use. Client-side navigation rides the expiry out — the API
 * client refreshes on a 401 and replays the call — but a full page load does
 * not: the SSR probe asks `/auth/me` with the expired token, gets a 401 and
 * reports `unauthenticated`, which the layout renders as signed out.
 *
 * Verified against the deployed API: `POST /auth/refresh` needs nothing but the
 * refresh cookie — no access token, no CSRF header — and answers 200 with a
 * fresh pair. So twenty idle minutes was throwing people out with six days of
 * session left.
 *
 * The server cannot do this recovery itself, and that is deliberate rather than
 * an oversight: `refresh_token` carries `Path=/api/auth`, so a page request for
 * `/challenges` never carries it.
 */

function ok(data: unknown) {
	return {
		ok: true,
		status: 200,
		json: () => Promise.resolve({ data, meta: { request_id: 'r', timestamp: '2026-09-08' } })
	};
}

function unauthorized() {
	return {
		ok: false,
		status: 401,
		json: () =>
			Promise.resolve({
				error: { code: 'AUTH_UNAUTHORIZED', message: 'nope' },
				meta: { request_id: 'r', timestamp: '2026-09-08' }
			})
	};
}

const USER = { id: 'u-1', role: 'user', username: 'kofi' };

let fetchMock: ReturnType<typeof vi.fn>;
let store: Record<string, string>;

beforeEach(() => {
	vi.resetModules();
	fetchMock = vi.fn();
	vi.stubGlobal('fetch', fetchMock);
	store = {};
	vi.stubGlobal('localStorage', {
		getItem: (k: string) => store[k] ?? null,
		setItem: (k: string, v: string) => {
			store[k] = v;
		},
		removeItem: (k: string) => {
			delete store[k];
		}
	});
});

afterEach(() => {
	vi.unstubAllGlobals();
});

/** Which paths were called, in order, so the sequence can be asserted. */
function calls(): string[] {
	return fetchMock.mock.calls.map((c) => String(c[0]));
}

describe('recovering a session a reload found expired', () => {
	it('is not attempted for a browser that never had one', async () => {
		const { auth } = await import('../../src/lib/stores/auth.svelte');
		expect(await auth.recoverSession()).toBe(false);

		// An anonymous visitor must not pay a round trip that is guaranteed to
		// fail, on every page, on an intermittent connection.
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('refreshes and re-reads the session when this browser had one', async () => {
		const { auth } = await import('../../src/lib/stores/auth.svelte');
		// Signing in is what leaves the marker.
		auth.setUser(USER as never);
		auth.user = null;

		fetchMock.mockImplementation((url: string) => {
			if (String(url).includes('/auth/refresh')) return Promise.resolve(ok({}));
			if (String(url).includes('/auth/me')) return Promise.resolve(ok({ user: USER }));
			return Promise.resolve(ok([]));
		});

		expect(await auth.recoverSession()).toBe(true);
		expect(auth.user).toMatchObject({ id: 'u-1' });

		const seen = calls();
		expect(seen[0]).toContain('/auth/refresh');
		expect(seen.some((u) => u.includes('/auth/me'))).toBe(true);
	});

	it('forgets the marker when the refresh is refused, so the next load is free', async () => {
		const { auth } = await import('../../src/lib/stores/auth.svelte');
		auth.setUser(USER as never);
		auth.user = null;

		// Seven days gone, or the session revoked. That is a real sign-out.
		fetchMock.mockResolvedValue(unauthorized());

		expect(await auth.recoverSession()).toBe(false);
		expect(auth.user).toBeNull();

		fetchMock.mockClear();
		expect(await auth.recoverSession()).toBe(false);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('does nothing when somebody is already signed in', async () => {
		const { auth } = await import('../../src/lib/stores/auth.svelte');
		auth.setUser(USER as never);

		expect(await auth.recoverSession()).toBe(false);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('drops the marker on sign-out, so the next visitor is treated as one', async () => {
		const { auth } = await import('../../src/lib/stores/auth.svelte');
		auth.setUser(USER as never);
		auth.clear();

		expect(await auth.recoverSession()).toBe(false);
		expect(fetchMock).not.toHaveBeenCalled();
	});
});
