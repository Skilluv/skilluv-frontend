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

describe('privacyApi consents + GDPR (aligned backend)', () => {
	it('consentVersion() reads /legal/consent-version', async () => {
		fetchMock.mockResolvedValue(
			ok({
				version: 1,
				pages: {
					terms: 'https://x/terms',
					privacy: 'https://x/privacy',
					cookies: 'https://x/cookies'
				}
			})
		);
		const { privacyApi } = await import('../../src/lib/api/privacy');
		const res = await privacyApi.consentVersion();
		expect(fetchMock).toHaveBeenCalledWith('/api/legal/consent-version', expect.anything());
		expect(res.data.version).toBe(1);
	});

	it('recordConsent() POSTs /legal/consent with both flags', async () => {
		fetchMock.mockResolvedValue(
			ok({ version: 1, analytics: true, marketing: false, essential: true, stored: true })
		);
		const { privacyApi } = await import('../../src/lib/api/privacy');
		await privacyApi.recordConsent({ analytics: true, marketing: false });
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/legal/consent');
		expect(init.method).toBe('POST');
		const body = JSON.parse(init.body);
		expect(body.analytics).toBe(true);
		expect(body.marketing).toBe(false);
	});

	it('requestDataExport() POSTs /auth/me/data-export', async () => {
		fetchMock.mockResolvedValue(
			ok({ job_id: 'j2', status: 'pending', requested_at: '2026-07-16' })
		);
		const { privacyApi } = await import('../../src/lib/api/privacy');
		await privacyApi.requestDataExport();
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/auth/me/data-export');
		expect(init.method).toBe('POST');
	});

	it('deleteAccount() DELETEs /auth/account with optional reason', async () => {
		fetchMock.mockResolvedValue(ok({ scheduled_for: '2026-08-15' }));
		const { privacyApi } = await import('../../src/lib/api/privacy');
		await privacyApi.deleteAccount('too many emails');
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/auth/account');
		expect(init.method).toBe('DELETE');
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
