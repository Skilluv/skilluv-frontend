import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

function ok(data: unknown) {
	return {
		ok: true,
		status: 200,
		json: () => Promise.resolve({ data, meta: { request_id: 'r', timestamp: '2026-07-16' } })
	};
}

function paginated(items: unknown[]) {
	return {
		ok: true,
		status: 200,
		json: () =>
			Promise.resolve({
				data: items,
				pagination: { page: 1, per_page: 20, total: items.length, total_pages: 1 },
				meta: { request_id: 'r', timestamp: '2026-07-16' }
			})
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

describe('walletApi read routes', () => {
	it('balance() hits /talent/wallet/balance', async () => {
		fetchMock.mockResolvedValue(
			ok({ fragments: 3400, eur_equivalent: 34, last_updated: '2026-07-16' })
		);
		const { walletApi } = await import('../../src/lib/api/wallet');
		const res = await walletApi.balance();
		expect(fetchMock).toHaveBeenCalledWith('/api/talent/wallet/balance', expect.anything());
		expect(res.data.fragments).toBe(3400);
	});

	it('history() serializes pagination', async () => {
		fetchMock.mockResolvedValue(paginated([]));
		const { walletApi } = await import('../../src/lib/api/wallet');
		await walletApi.history({ page: 2, per_page: 50 });
		const url = fetchMock.mock.calls[0][0] as string;
		expect(url).toBe('/api/talent/wallet/history?page=2&per_page=50');
	});

	it('payouts() serializes pagination', async () => {
		fetchMock.mockResolvedValue(paginated([]));
		const { walletApi } = await import('../../src/lib/api/wallet');
		await walletApi.payouts({ page: 3 });
		const url = fetchMock.mock.calls[0][0] as string;
		expect(url).toBe('/api/talent/wallet/payouts?page=3');
	});
});

describe('walletApi Stripe flow', () => {
	it('stripeStatus() reports connected state', async () => {
		fetchMock.mockResolvedValue(ok({ connected: true, account_id: 'acct_123' }));
		const { walletApi } = await import('../../src/lib/api/wallet');
		const res = await walletApi.stripeStatus();
		expect(fetchMock).toHaveBeenCalledWith('/api/talent/wallet/stripe/status', expect.anything());
		expect(res.data.connected).toBe(true);
		expect(res.data.account_id).toBe('acct_123');
	});

	it('stripeOnboarding() returns a hosted URL', async () => {
		fetchMock.mockResolvedValue(
			ok({ url: 'https://connect.stripe.com/x', account_id: 'acct_x', expires_at: '2026-07-17' })
		);
		const { walletApi } = await import('../../src/lib/api/wallet');
		const res = await walletApi.stripeOnboarding();
		expect(fetchMock).toHaveBeenCalledWith(
			'/api/talent/wallet/stripe/onboarding',
			expect.objectContaining({ method: 'POST' })
		);
		expect(res.data.url).toContain('stripe.com');
	});

	it('requestPayout() with stripe includes stripe_account_id when provided', async () => {
		fetchMock.mockResolvedValue(ok({ id: 'p1', status: 'pending' }));
		const { walletApi } = await import('../../src/lib/api/wallet');
		await walletApi.requestPayout({
			method: 'stripe',
			amount_fragments: 1500,
			stripe_account_id: 'acct_1'
		});
		const body = JSON.parse(fetchMock.mock.calls[0][1].body);
		expect(body.method).toBe('stripe');
		expect(body.stripe_account_id).toBe('acct_1');
		expect(body.amount_fragments).toBe(1500);
	});
});

describe('walletApi Mobile Money flow', () => {
	it('momoRegister() sends provider + number', async () => {
		fetchMock.mockResolvedValue(ok({ verified: true }));
		const { walletApi } = await import('../../src/lib/api/wallet');
		await walletApi.momoRegister({ provider: 'orange', number: '+22990000000' });
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/talent/wallet/mobile-money/register');
		const body = JSON.parse(init.body);
		expect(body.provider).toBe('orange');
		expect(body.number).toBe('+22990000000');
	});

	it('requestPayout() with mobile_money carries provider + number', async () => {
		fetchMock.mockResolvedValue(ok({ id: 'p2', status: 'pending' }));
		const { walletApi } = await import('../../src/lib/api/wallet');
		await walletApi.requestPayout({
			method: 'mobile_money',
			amount_fragments: 300,
			momo_provider: 'mtn',
			momo_number: '+22997000000'
		});
		const body = JSON.parse(fetchMock.mock.calls[0][1].body);
		expect(body.method).toBe('mobile_money');
		expect(body.momo_provider).toBe('mtn');
		expect(body.momo_number).toBe('+22997000000');
	});
});
