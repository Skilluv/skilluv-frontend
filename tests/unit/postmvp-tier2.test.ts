import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/** SKI-40 … SKI-43 — cohorts, peer matching, external signals, promotions. */

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

describe('cohortsApi', () => {
	it('list() filters by orientation slug, not id', async () => {
		fetchMock.mockResolvedValue(ok({ cohorts: [], limit: 24, offset: 0 }));
		const { cohortsApi } = await import('../../src/lib/api/cohorts');
		await cohortsApi.list({ orientation: 'dev-frontend', upcoming_only: true, limit: 24, offset: 0 });
		expect(fetchMock.mock.calls[0][0]).toBe(
			'/api/cohorts?orientation=dev-frontend&upcoming_only=true&limit=24&offset=0'
		);
	});

	it('join() POSTs with no body and leave() answers 204', async () => {
		fetchMock.mockResolvedValueOnce(ok({ member: { role: 'member' } }, 201));
		fetchMock.mockResolvedValueOnce(noContent());
		const { cohortsApi } = await import('../../src/lib/api/cohorts');

		await cohortsApi.join('c1');
		expect(fetchMock.mock.calls[0][0]).toBe('/api/cohorts/c1/join');
		expect(fetchMock.mock.calls[0][1].method).toBe('POST');
		expect(fetchMock.mock.calls[0][1].body).toBeUndefined();

		await expect(cohortsApi.leave('c1')).resolves.toBeUndefined();
		expect(fetchMock.mock.calls[1][1].method).toBe('DELETE');
	});

	it('messages() passes the before cursor through', async () => {
		fetchMock.mockResolvedValue(ok({ messages: [], limit: 50 }));
		const { cohortsApi } = await import('../../src/lib/api/cohorts');
		await cohortsApi.messages('c1', { limit: 50, before: '2026-08-17T10:00:00Z' });
		expect(fetchMock.mock.calls[0][0]).toContain('before=2026-08-17T10%3A00%3A00Z');
	});

	it('addMember() re-posts a role to promote an existing member', async () => {
		fetchMock.mockResolvedValue(ok({ member: { role: 'organizer' } }, 201));
		const { cohortsApi } = await import('../../src/lib/api/cohorts');
		await cohortsApi.addMember('c1', 'u1', 'organizer');
		expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
			user_id: 'u1',
			role: 'organizer'
		});
	});
});

describe('peerMatchingApi', () => {
	it('enroll() and unenroll() address the orientation by id', async () => {
		fetchMock.mockResolvedValueOnce(ok({ enrollment: {} }, 201));
		fetchMock.mockResolvedValueOnce(noContent());
		const { peerMatchingApi } = await import('../../src/lib/api/peer_matching');

		await peerMatchingApi.enroll({ orientation_id: 'o1', weekly_cadence: 2 });
		expect(fetchMock.mock.calls[0][0]).toBe('/api/users/me/peer-matching/enroll');
		expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
			orientation_id: 'o1',
			weekly_cadence: 2
		});

		await peerMatchingApi.unenroll('o1');
		expect(fetchMock.mock.calls[1][0]).toBe('/api/users/me/peer-matching/enroll/o1');
	});

	it('checkIn() PATCHes the session, not the match', async () => {
		fetchMock.mockResolvedValue(ok({ session: {} }));
		const { peerMatchingApi } = await import('../../src/lib/api/peer_matching');
		await peerMatchingApi.checkIn('s1', { notes: 'good', rating: 5 });
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/peer-sessions/s1');
		expect(init.method).toBe('PATCH');
		expect(JSON.parse(init.body)).toEqual({ notes: 'good', rating: 5 });
	});

	it('matches() hides ended pairings unless asked', async () => {
		fetchMock.mockResolvedValue(ok({ matches: [] }));
		const { peerMatchingApi } = await import('../../src/lib/api/peer_matching');
		await peerMatchingApi.matches();
		expect(fetchMock.mock.calls[0][0]).toBe('/api/users/me/peer-matches?include_ended=false');
		await peerMatchingApi.matches(true);
		expect(fetchMock.mock.calls[1][0]).toBe('/api/users/me/peer-matches?include_ended=true');
	});
});

describe('externalSignalsApi', () => {
	it('create() reports whether the signal self-verified through GitHub', async () => {
		fetchMock.mockResolvedValue(ok({ signal: { id: 's1' }, auto_verified: true }, 201));
		const { externalSignalsApi } = await import('../../src/lib/api/external_signals');
		const res = await externalSignalsApi.create({
			provider: 'github',
			url: 'https://github.com/x',
			title: 'My repos'
		});
		expect(res.data.auto_verified).toBe(true);
	});

	it('the public listing keeps verified and declared apart', async () => {
		fetchMock.mockResolvedValue(
			ok({
				verified: [{ id: 'a' }],
				declared: [{ id: 'b' }, { id: 'c' }],
				disclaimer: 'not a Skilluv proof'
			})
		);
		const { externalSignalsApi } = await import('../../src/lib/api/external_signals');
		const res = await externalSignalsApi.forUser('u1');
		expect(fetchMock.mock.calls[0][0]).toBe('/api/users/u1/external-signals');
		expect(res.data.verified).toHaveLength(1);
		expect(res.data.declared).toHaveLength(2);
		expect(res.data.disclaimer).toBeTruthy();
	});

	it('every provider the backend accepts has a label in both locales', async () => {
		const { EXTERNAL_SIGNAL_PROVIDERS } = await import('../../src/lib/types');
		const { postMvpFr } = await import('../../src/lib/i18n/postmvp.fr');
		const { postMvpEn } = await import('../../src/lib/i18n/postmvp.en');
		for (const provider of EXTERNAL_SIGNAL_PROVIDERS) {
			expect(postMvpFr.externalSignals.providers[provider]).toBeTruthy();
			expect(postMvpEn.externalSignals.providers[provider]).toBeTruthy();
		}
	});
});

describe('promotion notification copy', () => {
	it('each promotion kind the backend emits has a call to action', async () => {
		const { postMvpFr } = await import('../../src/lib/i18n/postmvp.fr');
		const { postMvpEn } = await import('../../src/lib/i18n/postmvp.en');
		// Mirrors `services::promotion_notify` — one CTA per emitted kind.
		const ctas = ['rankCta', 'capabilityCta', 'badgeCta', 'firstVerifiedCta', 'goalCta'] as const;
		for (const cta of ctas) {
			expect(postMvpFr.promotionNotifs[cta]).toBeTruthy();
			expect(postMvpEn.promotionNotifs[cta]).toBeTruthy();
		}
	});
});
