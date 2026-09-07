import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * What the session knows about the trades, once they have been registered.
 *
 * The trades are chosen before the account exists and posted the moment it
 * does. What the first version left out is the half nobody sees: `auth.user
 * .orientations` is loaded once per identity, and on this path it was loaded
 * from an account created seconds earlier — so it read empty, and stayed empty
 * for the rest of the session.
 *
 * Everything that asks "does this person have a trade" then answered no. The
 * prompt banner in the layout told somebody to choose the trades they had just
 * chosen; the team marketplace soft-blocked them out of it. Both were reading
 * a correct answer to a stale question.
 *
 * Tested here rather than in the browser because that is where the bug is: the
 * store's copy of a list, not a rendering. An e2e written for it passed with
 * the fix removed — the harness re-seeds auth from SSR on navigation and hid
 * the very thing under test.
 */

function ok(data: unknown) {
	return {
		ok: true,
		status: 200,
		json: () => Promise.resolve({ data, meta: { request_id: 'r', timestamp: '2026-09-07' } })
	};
}

function refused() {
	return {
		ok: false,
		status: 409,
		json: () =>
			Promise.resolve({
				error: { code: 'ORIENTATION_CAP_REACHED', message: 'no' },
				meta: { request_id: 'r', timestamp: '2026-09-07' }
			})
	};
}

const TRADE = {
	orientation_slug: 'backend-developer',
	orientation_name: 'Backend Developer',
	mode: 'learning',
	is_primary: true,
	started_at: '2026-09-07T00:00:00Z',
	working_languages: []
};

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
	vi.resetModules();
	fetchMock = vi.fn();
	vi.stubGlobal('fetch', fetchMock);
	vi.stubGlobal('sessionStorage', {
		getItem: () => null,
		setItem: () => {},
		removeItem: () => {}
	});
});

afterEach(() => {
	vi.unstubAllGlobals();
});

/** A store pair with an account that exists and carries no trades yet. */
async function freshStores() {
	const { auth } = await import('../../src/lib/stores/auth.svelte');
	const { enlist } = await import('../../src/lib/stores/enlist.svelte');
	auth.setUser({ id: 'u-1', role: 'user' } as never);
	return { auth, enlist };
}

describe('registering the chosen trades', () => {
	it('brings the session list up to date, so nothing still asks for them', async () => {
		const { auth, enlist } = await freshStores();
		enlist.togglePath('backend-developer', 'Backend Developer');

		fetchMock.mockImplementation((url: string, init?: RequestInit) => {
			if ((init?.method ?? 'GET') === 'POST') return Promise.resolve(ok({}));
			// The list, as the API answers it once the post has landed.
			return Promise.resolve(ok([TRADE]));
		});

		const { registered, failed } = await enlist.replay();
		expect(registered).toEqual(['backend-developer']);
		expect(failed).toEqual([]);

		// The assertion that matters: the banner and the soft-block both read
		// this, and both were showing because it was still empty.
		expect(auth.user?.orientations).toHaveLength(1);
		expect(auth.user?.orientations?.[0].orientation_slug).toBe('backend-developer');
	});

	it('does not refetch when every trade was refused', async () => {
		const { auth, enlist } = await freshStores();
		enlist.togglePath('backend-developer', 'Backend Developer');

		const calls: string[] = [];
		fetchMock.mockImplementation((url: string, init?: RequestInit) => {
			calls.push(init?.method ?? 'GET');
			return Promise.resolve(refused());
		});

		const { registered, failed } = await enlist.replay();
		expect(registered).toEqual([]);
		expect(failed).toEqual(['backend-developer']);

		// One POST and no GET. A total failure has nothing to propagate, and
		// the caller is already telling the person about it.
		expect(calls).toEqual(['POST']);
		expect(auth.user?.orientations).toBeUndefined();
	});

	it('still refreshes when only some of them were refused', async () => {
		const { auth, enlist } = await freshStores();
		enlist.togglePath('backend-developer', 'Backend Developer');
		enlist.togglePath('frontend-developer', 'Frontend Developer');

		let posts = 0;
		fetchMock.mockImplementation((url: string, init?: RequestInit) => {
			if ((init?.method ?? 'GET') === 'POST') {
				posts += 1;
				// The second one is refused; the first still happened.
				return Promise.resolve(posts === 1 ? ok({}) : refused());
			}
			return Promise.resolve(ok([TRADE]));
		});

		const { registered, failed } = await enlist.replay();
		expect(registered).toEqual(['backend-developer']);
		expect(failed).toEqual(['frontend-developer']);
		// Partly registered is still registered: the session must not go on
		// believing the person has nothing.
		expect(auth.user?.orientations).toHaveLength(1);
	});
});
