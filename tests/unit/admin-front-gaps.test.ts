import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * SKI-295 → SKI-301 — the front half of the batch.
 *
 * Every surface of the Post-MVP release was built for its owner, which left
 * the two callers that also need it with nothing: the visitor reading
 * somebody else's profile, and the moderator who has to act on content the
 * public listing hides. The backend closed the gaps; these tests pin the
 * client side of each contract it now serves.
 *
 * SKI-295, 296, 298 and 299 land under `/api/admin/**` behind the admin gate
 * and belong to skilluv-admin, so nothing here touches them.
 */

function ok(data: unknown, status = 200) {
	return {
		ok: true,
		status,
		json: () => Promise.resolve({ data, meta: { request_id: 'r', timestamp: '2026-08-27' } })
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

describe('SKI-301 — vouchings carry a linkable identity', () => {
	it('the profile listing exposes the voucher username, not only a display name', async () => {
		fetchMock.mockResolvedValue(
			ok({
				vouchings: [
					{
						id: 'v1',
						voucher_id: 'u1',
						voucher_username: 'gapvoucher',
						voucher_display_name: 'Ada Lovelace',
						statement: 'solid work',
						active_until: '2027-01-01T00:00:00Z',
						at_stake_kind: 'rank_temporary'
					}
				],
				count: 1
			})
		);
		const { vouchingsApi } = await import('../../src/lib/api/vouchings');
		const res = await vouchingsApi.forUser('u2');

		// A display name with a space is exactly the case a link built on the
		// display name cannot survive, which is why the username is the field
		// the profile section renders its href from.
		expect(res.data.vouchings[0].voucher_username).toBe('gapvoucher');
		expect(res.data.vouchings[0].voucher_display_name).toBe('Ada Lovelace');
	});

	it('both buckets of "my vouchings" resolve the other party', async () => {
		fetchMock.mockResolvedValue(
			ok({
				given: [
					{
						id: 'v1',
						voucher_id: 'me',
						vouched_id: 'u2',
						active_until: '2027-01-01T00:00:00Z',
						at_stake_kind: 'rank_temporary',
						statement: '',
						broken_at: null,
						break_reason: null,
						broken_by: null,
						created_at: '2026-08-01T00:00:00Z',
						other_user_id: 'u2',
						other_username: 'mentee',
						other_display_name: 'A Mentee'
					}
				],
				received: [
					{
						id: 'v2',
						voucher_id: 'u3',
						vouched_id: 'me',
						active_until: '2027-01-01T00:00:00Z',
						at_stake_kind: 'reputation_only',
						statement: '',
						broken_at: null,
						break_reason: null,
						broken_by: null,
						created_at: '2026-08-01T00:00:00Z',
						other_user_id: 'u3',
						other_username: 'doyen',
						other_display_name: 'A Doyen'
					}
				],
				max_live: 5
			})
		);
		const { vouchingsApi } = await import('../../src/lib/api/vouchings');
		const res = await vouchingsApi.listMine();

		expect(fetchMock.mock.calls[0][0]).toBe('/api/users/me/vouchings');
		// "Other" flips side per bucket: the person backed on `given`, the
		// backer on `received`.
		expect(res.data.given[0].other_username).toBe('mentee');
		expect(res.data.received[0].other_username).toBe('doyen');
	});
});

describe('SKI-297 — the vouching moderation queue', () => {
	it('defaults to nothing and lets the backend pick `live`', async () => {
		fetchMock.mockResolvedValue(ok({ vouchings: [], status: 'live', total: 0, limit: 50, offset: 0 }));
		const { vouchingsApi } = await import('../../src/lib/api/vouchings');
		await vouchingsApi.moderationQueue();
		expect(fetchMock.mock.calls[0][0]).toBe('/api/moderation/vouchings');
	});

	it('passes status, paging and the stake filter through', async () => {
		fetchMock.mockResolvedValue(
			ok({ vouchings: [], status: 'broken', total: 0, limit: 20, offset: 40 })
		);
		const { vouchingsApi } = await import('../../src/lib/api/vouchings');
		await vouchingsApi.moderationQueue({
			status: 'broken',
			at_stake_kind: 'rank_temporary',
			limit: 20,
			offset: 40
		});
		const url = fetchMock.mock.calls[0][0] as string;
		expect(url.startsWith('/api/moderation/vouchings?')).toBe(true);
		const qs = new URLSearchParams(url.split('?')[1]);
		expect(qs.get('status')).toBe('broken');
		expect(qs.get('at_stake_kind')).toBe('rank_temporary');
		expect(qs.get('limit')).toBe('20');
		expect(qs.get('offset')).toBe('40');
	});

	it('a flagged mentee is carried on the row, because that is what the queue sorts on', async () => {
		fetchMock.mockResolvedValue(
			ok({
				vouchings: [
					{
						id: 'v1',
						status: 'live',
						voucher_id: 'u1',
						voucher_username: 'doyen',
						voucher_display_name: 'A Doyen',
						voucher_rank: 'doyen',
						vouched_id: 'u2',
						vouched_username: 'suspect',
						vouched_display_name: 'A Suspect',
						vouched_user_flagged: true,
						at_stake_kind: 'rank_temporary',
						statement: '',
						active_until: '2027-01-01T00:00:00Z',
						created_at: '2026-08-01T00:00:00Z',
						broken_at: null,
						broken_by: null,
						break_reason: null
					}
				],
				status: 'live',
				total: 1,
				limit: 50,
				offset: 0
			})
		);
		const { vouchingsApi } = await import('../../src/lib/api/vouchings');
		const res = await vouchingsApi.moderationQueue({ status: 'live' });
		expect(res.data.vouchings[0].vouched_user_flagged).toBe(true);
		// The raw rank is what breaking the vouching would cost — shown
		// before the moderator imposes it.
		expect(res.data.vouchings[0].voucher_rank).toBe('doyen');
	});

	it('breaking a vouching sends the reason and reports what it cost', async () => {
		fetchMock.mockResolvedValue(
			ok({
				vouching: { id: 'v1' },
				penalty_applied: true,
				voucher_rank_before: 'doyen',
				voucher_rank_effective: 'artisan',
				penalty_until: '2026-11-25T00:00:00Z'
			})
		);
		const { vouchingsApi, VOUCHING_BREAK_REASON_MIN } = await import(
			'../../src/lib/api/vouchings'
		);
		const reason = 'fabricated deliverables across three challenges';
		expect(reason.length).toBeGreaterThanOrEqual(VOUCHING_BREAK_REASON_MIN);

		const res = await vouchingsApi.breakVouching('v1', reason);
		expect(fetchMock.mock.calls[0][0]).toBe('/api/moderation/vouchings/v1/break');
		expect(fetchMock.mock.calls[0][1].method).toBe('POST');
		expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ reason });
		expect(res.data.penalty_applied).toBe(true);
	});
});

describe('external signal moderation', () => {
	it('reads the pending queue', async () => {
		fetchMock.mockResolvedValue(ok({ pending: [] }));
		const { externalSignalsApi } = await import('../../src/lib/api/external_signals');
		await externalSignalsApi.listPending(50);
		const url = fetchMock.mock.calls[0][0] as string;
		expect(url.startsWith('/api/moderation/external-signals?')).toBe(true);
		expect(new URLSearchParams(url.split('?')[1]).get('limit')).toBe('50');
	});

	it('a removal carries its motive in the query string', async () => {
		fetchMock.mockResolvedValue(noContent());
		const { externalSignalsApi, SIGNAL_REJECT_REASON_MIN } = await import(
			'../../src/lib/api/external_signals'
		);
		const reason = 'link points at somebody else account';
		expect(reason.length).toBeGreaterThanOrEqual(SIGNAL_REJECT_REASON_MIN);

		await externalSignalsApi.reject('s1', reason);
		const url = fetchMock.mock.calls[0][0] as string;
		// A query parameter and not a body: enough proxies strip DELETE
		// bodies that a required one would only fail in production. Before
		// SKI-299 the client sent no motive at all, which the backend now
		// refuses outright.
		expect(url.split('?')[0]).toBe('/api/moderation/external-signals/s1');
		expect(new URLSearchParams(url.split('?')[1]).get('reason')).toBe(reason);
		expect(fetchMock.mock.calls[0][1].method).toBe('DELETE');
	});

	it('verifying confirms ownership and nothing more', async () => {
		fetchMock.mockResolvedValue(ok({ signal: { id: 's1', verified_at: '2026-08-27T00:00:00Z' } }));
		const { externalSignalsApi } = await import('../../src/lib/api/external_signals');
		const res = await externalSignalsApi.verify('s1');
		expect(fetchMock.mock.calls[0][0]).toBe('/api/moderation/external-signals/s1/verify');
		expect(res.data.signal.verified_at).not.toBeNull();
	});
});

describe('SKI-300 — the public profile resolves a username to an id', () => {
	it('the id comes back for an anonymous visitor, unlocking the four sections', async () => {
		fetchMock.mockResolvedValue(
			ok({
				user: { id: 'owner-uuid', username: 'gapprofileowner', display_name: 'Owner' },
				stats: {}
			})
		);
		const { profileApi } = await import('../../src/lib/api/profile');
		const res = await profileApi.getPublic('gapprofileowner');
		// Without this the front could render timeline, skill tree, external
		// signals and vouchings on your own profile — where the id came from
		// the auth store — and on nobody else's.
		expect(res.data.user.id).toBe('owner-uuid');
	});
});
