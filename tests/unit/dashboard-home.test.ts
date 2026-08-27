import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * The dashboard home.
 *
 * `/dashboard` had eight sub-pages and no entry point, because the five reads
 * that belong on it were served under `/users/me/**` and called by nothing.
 */

function ok(data: unknown) {
	return {
		ok: true,
		status: 200,
		json: () => Promise.resolve({ data, meta: { request_id: 'r', timestamp: '2026-08-27' } })
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

describe('dashboardApi', () => {
	it('reads the suggestion engine, not the other recommender', async () => {
		fetchMock.mockResolvedValue(ok({ suggestions: [], cached: true }));
		const { dashboardApi } = await import('../../src/lib/api/dashboard');
		await dashboardApi.nextChallenges();
		// `/me/feed/challenges` is a different endpoint, already consumed by
		// `slicesApi.feedRecommended`. This one returns its reasons.
		expect(fetchMock.mock.calls[0][0]).toBe('/api/users/me/next-challenges');
	});

	it('a suggestion carries the reasons it was made', async () => {
		fetchMock.mockResolvedValue(
			ok({
				suggestions: [
					{
						id: 's1',
						slug: null,
						title: 'Corriger le parsing des dates',
						format: 'individual',
						orientation_slug: 'backend-engineer',
						family: 'backend',
						difficulty: 3,
						estimated_hours: 6,
						closes_at: null,
						score: 42,
						reasons: ['Ton dernier livrable touchait ce dépôt', 'Difficulté juste au-dessus']
					}
				],
				cached: true
			})
		);
		const { dashboardApi } = await import('../../src/lib/api/dashboard');
		const res = await dashboardApi.nextChallenges();
		// Returned rather than logged: a recommendation nobody can argue with
		// is a recommendation nobody trusts.
		expect(res.data.suggestions[0].reasons).toHaveLength(2);
		// Said out loud rather than left to look like staleness.
		expect(res.data.cached).toBe(true);
	});

	it('an individual brief points at a slice, a contest at a tournament', async () => {
		fetchMock.mockResolvedValue(
			ok({
				suggestions: [
					{
						id: 't1',
						slug: 'brief-du-mois',
						title: 'Brief du mois',
						format: 'contest',
						orientation_slug: null,
						family: null,
						difficulty: null,
						estimated_hours: null,
						closes_at: '2027-01-01T00:00:00Z',
						score: 30,
						reasons: []
					}
				]
			})
		);
		const { dashboardApi } = await import('../../src/lib/api/dashboard');
		const res = await dashboardApi.nextChallenges();
		const s = res.data.suggestions[0];
		// The id means different things per format, which is why the slug is
		// what a contest link is built from.
		expect(s.format).toBe('contest');
		expect(s.slug).toBe('brief-du-mois');
		expect(s.closes_at).not.toBeNull();
	});

	it('reads the four other surfaces on their own paths', async () => {
		fetchMock.mockResolvedValue(ok({}));
		const { dashboardApi } = await import('../../src/lib/api/dashboard');
		await dashboardApi.contestInvitations();
		await dashboardApi.events();
		await dashboardApi.mentorSubscriptions();
		await dashboardApi.stewardships();
		expect(fetchMock.mock.calls.map((c) => c[0])).toEqual([
			'/api/users/me/contest-invitations',
			'/api/users/me/events',
			'/api/users/me/mentor-subscriptions',
			'/api/users/me/stewardships'
		]);
	});

	it('an invitation already accepted is not one waiting on you', async () => {
		fetchMock.mockResolvedValue(
			ok({
				invitations: [
					{
						contest_id: 'c1',
						slug: 'un-contest',
						title: 'Un contest',
						kind: 'brief_contest',
						deadline: '2027-01-01T00:00:00Z',
						invited_at: '2026-08-01T00:00:00Z',
						accepted_at: null
					},
					{
						contest_id: 'c2',
						slug: 'un-autre',
						title: 'Un autre',
						kind: 'hackathon',
						deadline: null,
						invited_at: '2026-07-01T00:00:00Z',
						accepted_at: '2026-07-02T00:00:00Z'
					}
				]
			})
		);
		const { dashboardApi } = await import('../../src/lib/api/dashboard');
		const res = await dashboardApi.contestInvitations();
		// The page counts only the ones still owed an answer; declined ones are
		// not served at all.
		const pending = res.data.invitations.filter((i) => !i.accepted_at);
		expect(pending).toHaveLength(1);
		expect(pending[0].contest_id).toBe('c1');
	});

	it('a mentoring row serves both sides, told apart by the ids', async () => {
		fetchMock.mockResolvedValue(
			ok({
				subscriptions: [
					{
						id: 'sub1',
						mentor_user_id: 'me',
						mentee_user_id: 'them',
						monthly_fee_cents: 9000,
						currency: 'EUR',
						platform_percent: '15.00',
						sessions_included: 2,
						current_period_end: '2026-09-01T00:00:00Z',
						auto_renew: false
					}
				]
			})
		);
		const { dashboardApi } = await import('../../src/lib/api/dashboard');
		const res = await dashboardApi.mentorSubscriptions();
		const sub = res.data.subscriptions[0];
		expect(sub.mentor_user_id).toBe('me');
		// Stopped, and what was paid for still runs to its end — so the date
		// matters as much as the flag.
		expect(sub.auto_renew).toBe(false);
		expect(sub.current_period_end).toBe('2026-09-01T00:00:00Z');
	});
});
