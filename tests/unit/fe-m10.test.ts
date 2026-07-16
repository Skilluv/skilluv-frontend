import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

function ok(data: unknown) {
	return {
		ok: true,
		status: 200,
		json: () => Promise.resolve({ data, meta: { request_id: 'r', timestamp: '2026-07-16' } })
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

// --- privacyApi ---

describe('privacyApi consents + GDPR', () => {
	it('getConsents() reads /users/me/consents', async () => {
		fetchMock.mockResolvedValue(ok({ marketing: false, analytics: true, updated_at: '2026-07-16' }));
		const { privacyApi } = await import('../../src/lib/api/privacy');
		const res = await privacyApi.getConsents();
		expect(fetchMock).toHaveBeenCalledWith('/api/users/me/consents', expect.anything());
		expect(res.data.analytics).toBe(true);
	});

	it('patchConsents() PATCHes with body', async () => {
		fetchMock.mockResolvedValue(ok({ marketing: true, analytics: true, updated_at: '2026-07-16' }));
		const { privacyApi } = await import('../../src/lib/api/privacy');
		await privacyApi.patchConsents({ marketing: true });
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/users/me/consents');
		expect(init.method).toBe('PATCH');
		const body = JSON.parse(init.body);
		expect(body.marketing).toBe(true);
	});

	it('requestGdprExport() POSTs /users/me/gdpr-export', async () => {
		fetchMock.mockResolvedValue(ok({ job_id: 'j1', status: 'pending', requested_at: '2026-07-16' }));
		const { privacyApi } = await import('../../src/lib/api/privacy');
		await privacyApi.requestGdprExport();
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/users/me/gdpr-export');
		expect(init.method).toBe('POST');
	});

	it('requestDataExport() POSTs /users/me/data-export', async () => {
		fetchMock.mockResolvedValue(ok({ job_id: 'j2', status: 'pending', requested_at: '2026-07-16' }));
		const { privacyApi } = await import('../../src/lib/api/privacy');
		await privacyApi.requestDataExport();
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/users/me/data-export');
		expect(init.method).toBe('POST');
	});

	it('requestAccountDeletion() POSTs with reason', async () => {
		fetchMock.mockResolvedValue(ok({ scheduled_for: '2026-08-15' }));
		const { privacyApi } = await import('../../src/lib/api/privacy');
		await privacyApi.requestAccountDeletion('too many emails');
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/users/me/delete');
		const body = JSON.parse(init.body);
		expect(body.reason).toBe('too many emails');
	});
});

// --- badgeEventsApi lifecycle ---

describe('badgeEventsApi lifecycle', () => {
	it('list/detail/join/myEvents hit expected routes', async () => {
		fetchMock
			.mockResolvedValueOnce(ok([]))
			.mockResolvedValueOnce(ok({ id: 'e1', slug: 'fest' }))
			.mockResolvedValueOnce(ok({ event: { slug: 'fest' }, joined_at: '2026-07-16', stamp_earned: false }))
			.mockResolvedValueOnce(ok([]));

		const { badgeEventsApi } = await import('../../src/lib/api/badge_events');
		await badgeEventsApi.list();
		await badgeEventsApi.detail('fest');
		await badgeEventsApi.join('fest');
		await badgeEventsApi.myEvents();

		expect(fetchMock.mock.calls[0][0]).toBe('/api/badge-events');
		expect(fetchMock.mock.calls[1][0]).toBe('/api/badge-events/fest');
		expect(fetchMock.mock.calls[2][0]).toBe('/api/badge-events/fest/join');
		expect(fetchMock.mock.calls[2][1].method).toBe('POST');
		expect(fetchMock.mock.calls[3][0]).toBe('/api/users/me/badge-events');
	});
});

// --- tournamentApi currentSeason ---

describe('tournamentApi currentSeason', () => {
	it('reads /seasons/current', async () => {
		fetchMock.mockResolvedValue(
			ok({
				id: 's1',
				slug: 's-2026-summer',
				name: 'Summer 2026',
				status: 'active',
				starts_at: '2026-06-01',
				ends_at: '2026-09-01'
			})
		);
		const { tournamentApi } = await import('../../src/lib/api/tournament');
		const res = await tournamentApi.currentSeason();
		expect(fetchMock).toHaveBeenCalledWith('/api/seasons/current', expect.anything());
		expect(res.data.name).toBe('Summer 2026');
	});
});
