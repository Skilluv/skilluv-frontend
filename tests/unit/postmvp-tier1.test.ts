import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * SKI-36 … SKI-39 — the tier-1 API surface and the bookmark index that keeps
 * a page of cards from firing one probe per card.
 */

function ok(data: unknown, status = 200) {
	return {
		ok: true,
		status,
		json: () => Promise.resolve({ data, meta: { request_id: 'r', timestamp: '2026-08-17' } })
	};
}

function noContent() {
	return { ok: true, status: 204, json: () => Promise.reject(new Error('no body')) };
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

describe('bookmarksApi', () => {
	it('create() posts the polymorphic target', async () => {
		fetchMock.mockResolvedValue(ok({ bookmark: { id: 'b1' } }, 201));
		const { bookmarksApi } = await import('../../src/lib/api/bookmarks');
		await bookmarksApi.create({
			target_type: 'challenge_template',
			target_id: 'c1',
			folder_slug: 'frontend'
		});
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/bookmarks');
		expect(init.method).toBe('POST');
		expect(JSON.parse(init.body)).toEqual({
			target_type: 'challenge_template',
			target_id: 'c1',
			folder_slug: 'frontend'
		});
	});

	it('listMine() drops undefined filters from the query string', async () => {
		fetchMock.mockResolvedValue(ok({ bookmarks: [], limit: 50, offset: 0 }));
		const { bookmarksApi } = await import('../../src/lib/api/bookmarks');
		await bookmarksApi.listMine({ target_type: 'user', folder_slug: undefined, limit: 50, offset: 0 });
		expect(fetchMock.mock.calls[0][0]).toBe('/api/users/me/bookmarks?target_type=user&limit=50&offset=0');
	});

	it('the unfiled sentinel is what the no-folder bucket filters on', async () => {
		fetchMock.mockResolvedValue(ok({ bookmarks: [], limit: 50, offset: 0 }));
		const { bookmarksApi, UNFILED_FOLDER } = await import('../../src/lib/api/bookmarks');
		await bookmarksApi.listMine({ folder_slug: UNFILED_FOLDER });
		expect(UNFILED_FOLDER).toBe('unfiled');
		expect(fetchMock.mock.calls[0][0]).toContain('folder_slug=unfiled');
	});

	it('remove() tolerates the 204 the backend answers with', async () => {
		fetchMock.mockResolvedValue(noContent());
		const { bookmarksApi } = await import('../../src/lib/api/bookmarks');
		await expect(bookmarksApi.remove('b1')).resolves.toBeUndefined();
		expect(fetchMock.mock.calls[0][1].method).toBe('DELETE');
	});
});

describe('bookmarks index store', () => {
	it('walks pages until one comes back short, then answers without a request', async () => {
		const page = (n: number, offset: number) =>
			ok({
				bookmarks: Array.from({ length: n }, (_, i) => ({
					id: `b${offset + i}`,
					target_type: 'challenge_template',
					target_id: `c${offset + i}`,
					folder_slug: null,
					notes: null,
					created_at: '2026-08-17T00:00:00Z'
				})),
				limit: 100,
				offset
			});
		fetchMock.mockResolvedValueOnce(page(100, 0)).mockResolvedValueOnce(page(3, 100));

		const { bookmarks } = await import('../../src/lib/stores/bookmarks.svelte');
		await bookmarks.ensureLoaded();

		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(bookmarks.count).toBe(103);
		expect(bookmarks.isSaved('challenge_template', 'c0')).toBe(true);
		expect(bookmarks.isSaved('challenge_template', 'nope')).toBe(false);

		// Loaded once per session: a second call must not hit the network.
		await bookmarks.ensureLoaded();
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('parallel callers share one in-flight load', async () => {
		fetchMock.mockResolvedValue(ok({ bookmarks: [], limit: 100, offset: 0 }));
		const { bookmarks } = await import('../../src/lib/stores/bookmarks.svelte');
		await Promise.all([bookmarks.ensureLoaded(), bookmarks.ensureLoaded(), bookmarks.ensureLoaded()]);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('track and forget keep the index in step without a refetch', async () => {
		fetchMock.mockResolvedValue(ok({ bookmarks: [], limit: 100, offset: 0 }));
		const { bookmarks } = await import('../../src/lib/stores/bookmarks.svelte');
		await bookmarks.ensureLoaded();

		bookmarks.track({ id: 'b9', target_type: 'team', target_id: 't1' });
		expect(bookmarks.isSaved('team', 't1')).toBe(true);
		expect(bookmarks.idFor('team', 't1')).toBe('b9');

		bookmarks.forget('team', 't1');
		expect(bookmarks.isSaved('team', 't1')).toBe(false);
		expect(bookmarks.idFor('team', 't1')).toBeUndefined();
	});

	it('reset clears the index so the next account starts empty', async () => {
		fetchMock.mockResolvedValue(ok({ bookmarks: [], limit: 100, offset: 0 }));
		const { bookmarks } = await import('../../src/lib/stores/bookmarks.svelte');
		await bookmarks.ensureLoaded();
		bookmarks.track({ id: 'b1', target_type: 'user', target_id: 'u1' });

		bookmarks.reset();
		expect(bookmarks.count).toBe(0);
		expect(bookmarks.loaded).toBe(false);
		expect(bookmarks.isSaved('user', 'u1')).toBe(false);
	});

	it('a failing index leaves every button unsaved instead of throwing', async () => {
		fetchMock.mockRejectedValue(new Error('offline'));
		const { bookmarks } = await import('../../src/lib/stores/bookmarks.svelte');
		await expect(bookmarks.ensureLoaded()).resolves.toBeUndefined();
		expect(bookmarks.loaded).toBe(false);
		expect(bookmarks.isSaved('user', 'u1')).toBe(false);
	});
});

describe('userNotesApi', () => {
	it('upsert() PUTs the body on the polymorphic path', async () => {
		fetchMock.mockResolvedValue(ok({ note: { body: 'hello' } }));
		const { userNotesApi } = await import('../../src/lib/api/user_notes');
		await userNotesApi.upsert('deliverable', 'd1', 'hello');
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/users/me/notes/deliverable/d1');
		expect(init.method).toBe('PUT');
		expect(JSON.parse(init.body)).toEqual({ body: 'hello' });
	});

	it('fetch() accepts the null note the backend answers 200 with', async () => {
		fetchMock.mockResolvedValue(ok({ note: null }));
		const { userNotesApi } = await import('../../src/lib/api/user_notes');
		const res = await userNotesApi.fetch('project', 'p1');
		expect(res.data.note).toBeNull();
	});
});

describe('goalsApi', () => {
	it('create() forwards the skill id only when the kind needs it', async () => {
		fetchMock.mockResolvedValue(ok({ goal: { goal: { id: 'g1' } } }, 201));
		const { goalsApi } = await import('../../src/lib/api/goals');

		await goalsApi.create({ kind: 'rank', target_value: 'artisan' });
		expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
			kind: 'rank',
			target_value: 'artisan'
		});

		await goalsApi.create({ kind: 'skill_level', target_value: '4', target_skill_id: 's1' });
		expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
			kind: 'skill_level',
			target_value: '4',
			target_skill_id: 's1'
		});
	});

	it('update() keeps an explicit null deadline distinct from an absent one', async () => {
		fetchMock.mockResolvedValue(ok({ goal: { goal: { id: 'g1' } } }));
		const { goalsApi } = await import('../../src/lib/api/goals');

		await goalsApi.update('g1', { deadline: null });
		expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ deadline: null });

		await goalsApi.update('g1', {});
		expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({});
	});

	it('listMine() asks for archived goals only when told to', async () => {
		fetchMock.mockResolvedValue(ok({ goals: [] }));
		const { goalsApi } = await import('../../src/lib/api/goals');
		await goalsApi.listMine();
		expect(fetchMock.mock.calls[0][0]).toBe('/api/users/me/goals?include_archived=false');
		await goalsApi.listMine(true);
		expect(fetchMock.mock.calls[1][0]).toBe('/api/users/me/goals?include_archived=true');
	});
});

describe('timelineApi', () => {
	it('forUser() paginates the public timeline', async () => {
		fetchMock.mockResolvedValue(ok({ events: [], total: 0, limit: 25, offset: 25 }));
		const { timelineApi } = await import('../../src/lib/api/timeline');
		await timelineApi.forUser('u1', { limit: 25, offset: 25 });
		expect(fetchMock.mock.calls[0][0]).toBe('/api/users/u1/timeline?limit=25&offset=25');
	});
});
