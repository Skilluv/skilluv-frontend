import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * The talent side of recruitment (SKI-324).
 *
 * The gap it closes: somebody publishes a "job wanted", companies spend
 * credits pitching to them, and the pitches were reachable from no page at
 * all. The loop never closed.
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

describe('opportunitiesApi — reverse recruitment', () => {
	it('reads the pitches sent to your own posting', async () => {
		fetchMock.mockResolvedValue(
			ok({
				pitches: [
					{
						id: 'p1',
						posting_id: 'po1',
						enterprise_id: 'e1',
						company_name: 'Une boîte',
						pitch_md: 'Voici pourquoi.',
						offered_salary: '45000',
						currency: 'EUR',
						status: 'sent',
						decline_reason: null,
						created_at: '2026-08-01T00:00:00Z'
					}
				]
			})
		);
		const { opportunitiesApi } = await import('../../src/lib/api/opportunities');
		const res = await opportunitiesApi.pitches();
		expect(fetchMock.mock.calls[0][0]).toBe('/api/users/me/pitches');
		expect(res.data.pitches[0].company_name).toBe('Une boîte');
	});

	it('answering carries the reason only when there is one', async () => {
		fetchMock.mockResolvedValue(ok({}));
		const { opportunitiesApi } = await import('../../src/lib/api/opportunities');

		await opportunitiesApi.respondToPitch('p1', { interested: true });
		expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ interested: true });

		await opportunitiesApi.respondToPitch('p2', { interested: false, reason: 'mauvaise stack' });
		// Optional on purpose: somebody declining ten pitches should not have
		// to justify each one.
		expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
			interested: false,
			reason: 'mauvaise stack'
		});
	});

	it('the posting carries what a company needs before writing', async () => {
		fetchMock.mockResolvedValue(
			ok({
				posting: {
					id: 'po1',
					talent_user_id: 'u1',
					username: 'ada',
					title: 'Backend, remote',
					desired_role: 'backend',
					desired_domain: 'code',
					desired_orientations: ['backend-engineer'],
					desired_salary_range: null,
					remote_only: true,
					preferred_countries: ['BJ'],
					available_from: '2026-10-01',
					not_looking_for: 'Pas de crypto.',
					status: 'open',
					pitches_left_this_month: 3
				}
			})
		);
		const { opportunitiesApi } = await import('../../src/lib/api/opportunities');
		const res = await opportunitiesApi.posting();
		// On the posting rather than hidden in a quota table: it is what a
		// company needs to know before writing four hundred words.
		expect(res.data.posting?.pitches_left_this_month).toBe(3);
		expect(res.data.posting?.not_looking_for).toContain('crypto');
	});

	it('no posting answers null rather than an empty object', async () => {
		fetchMock.mockResolvedValue(ok({ posting: null }));
		const { opportunitiesApi } = await import('../../src/lib/api/opportunities');
		const res = await opportunitiesApi.posting();
		expect(res.data.posting).toBeNull();
	});
});

describe('opportunitiesApi — campaigns and interviews', () => {
	it('a campaign answer is the talent s own, on the campaign path', async () => {
		fetchMock.mockResolvedValue(ok({}));
		const { opportunitiesApi } = await import('../../src/lib/api/opportunities');
		await opportunitiesApi.respondToCampaign('c1', true);
		// Their session, their decision — there is deliberately no admin
		// equivalent of this endpoint.
		expect(fetchMock.mock.calls[0][0]).toBe('/api/recruitment/campaigns/c1/respond');
		expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ interested: true });
	});

	it('confirming an interview sends one of the proposed slots', async () => {
		fetchMock.mockResolvedValue(ok({ interview: { id: 'i1' } }));
		const { opportunitiesApi } = await import('../../src/lib/api/opportunities');
		const slot = { start: '2026-09-01T09:00:00Z', end: '2026-09-01T09:45:00Z' };
		await opportunitiesApi.confirmInterview('i1', slot);
		expect(fetchMock.mock.calls[0][0]).toBe('/api/interviews/i1/confirm');
		// Both ends: a start with no end is not a slot, and a zero-length one
		// is a typo somebody would clear an afternoon for.
		expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ slot });
	});

	it('declining an interview needs nothing but the id', async () => {
		fetchMock.mockResolvedValue(ok({}));
		const { opportunitiesApi } = await import('../../src/lib/api/opportunities');
		await opportunitiesApi.declineInterview('i1');
		expect(fetchMock.mock.calls[0][0]).toBe('/api/interviews/i1/decline');
	});
});

describe('opportunitiesApi — trials', () => {
	it('approved and pending hours arrive as two figures, never one', async () => {
		fetchMock.mockResolvedValue(
			ok({
				hours: [
					{
						id: 'h1',
						worked_on: '2026-08-03',
						hours: '7.5',
						summary: 'Migration du parser',
						approved_at: '2026-08-04T00:00:00Z',
						rejected_at: null,
						rejection_reason: null
					},
					{
						id: 'h2',
						worked_on: '2026-08-04',
						hours: '4',
						summary: 'Revue',
						approved_at: null,
						rejected_at: null,
						rejection_reason: null
					}
				],
				approved_total: '7.5',
				pending_total: '4'
			})
		);
		const { opportunitiesApi } = await import('../../src/lib/api/opportunities');
		const res = await opportunitiesApi.trialHours('t1');
		expect(fetchMock.mock.calls[0][0]).toBe('/api/trials/t1/hours');
		// Claimed but unapproved is not money owed. One total would be a figure
		// nobody agreed to.
		expect(res.data.approved_total).toBe('7.5');
		expect(res.data.pending_total).toBe('4');
	});

	it('a refused day carries its reason back', async () => {
		fetchMock.mockResolvedValue(
			ok({
				hours: [
					{
						id: 'h3',
						worked_on: '2026-08-05',
						hours: '8',
						summary: 'Réunions',
						approved_at: null,
						rejected_at: '2026-08-06T00:00:00Z',
						rejection_reason: 'Hors périmètre de l’essai'
					}
				],
				approved_total: '0',
				pending_total: '0'
			})
		);
		const { opportunitiesApi } = await import('../../src/lib/api/opportunities');
		const res = await opportunitiesApi.trialHours('t1');
		expect(res.data.hours[0].rejection_reason).toContain('périmètre');
	});

	it('claiming a day sends the date, the hours and what was done', async () => {
		fetchMock.mockResolvedValue(ok({ entry_id: 'h9' }));
		const { opportunitiesApi } = await import('../../src/lib/api/opportunities');
		await opportunitiesApi.logHours('t1', {
			worked_on: '2026-08-07',
			hours: '6.25',
			summary: 'Correction du parser de dates'
		});
		expect(fetchMock.mock.calls[0][0]).toBe('/api/trials/t1/hours');
		// The summary is what the client approves against, so it goes with the
		// figure rather than after it.
		expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
			worked_on: '2026-08-07',
			hours: '6.25',
			summary: 'Correction du parser de dates'
		});
	});
});
