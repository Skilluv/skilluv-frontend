import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

function ok(data: unknown) {
	return {
		ok: true,
		status: 200,
		json: () => Promise.resolve({ data, meta: { request_id: 'r', timestamp: '2026-08-13' } })
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

/** The URL and parsed body of the nth call. */
function call(n = 0) {
	const [url, init] = fetchMock.mock.calls[n];
	return {
		url: String(url),
		method: init?.method ?? 'GET',
		body: init?.body ? JSON.parse(String(init.body)) : undefined
	};
}

describe('disputesApi', () => {
	it('lists disputes on the endpoint that returns both sides', async () => {
		const { disputesApi } = await import('$lib/api/disputes');
		fetchMock.mockResolvedValue(ok([]));
		await disputesApi.list();
		expect(call().url).toContain('/disputes');
		expect(call().method).toBe('GET');
	});

	it('raises against a subject, not against a payment', async () => {
		// The payer knows what they bought, not which charge paid for it.
		const { disputesApi } = await import('$lib/api/disputes');
		fetchMock.mockResolvedValue(ok({ dispute_id: 'd1' }));
		await disputesApi.raise({
			subject_type: 'mentorship_session',
			subject_id: 'abc',
			reason: 'never happened'
		});
		expect(call().method).toBe('POST');
		expect(call().body).toEqual({
			subject_type: 'mentorship_session',
			subject_id: 'abc',
			reason: 'never happened'
		});
	});

	it('sends the recipient response when contesting', async () => {
		const { disputesApi } = await import('$lib/api/disputes');
		fetchMock.mockResolvedValue(ok({ status: 'contested' }));
		await disputesApi.contest('d1', 'delivered on the 3rd');
		expect(call().url).toContain('/disputes/d1/contest');
		expect(call().body).toEqual({ response: 'delivered on the 3rd' });
	});

	it('concedes and withdraws on their own endpoints', async () => {
		const { disputesApi } = await import('$lib/api/disputes');
		fetchMock.mockResolvedValue(ok({ status: 'refunded' }));
		await disputesApi.concede('d1');
		await disputesApi.withdraw('d2');
		expect(call(0).url).toContain('/disputes/d1/concede');
		expect(call(1).url).toContain('/disputes/d2/withdraw');
		expect(call(0).method).toBe('POST');
		expect(call(1).method).toBe('POST');
	});
});
