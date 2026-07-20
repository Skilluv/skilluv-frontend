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

describe('walletApi read routes', () => {
	it('get() hits /users/me/wallet and returns the wallet payload', async () => {
		fetchMock.mockResolvedValue(
			ok({
				wallet: {
					user_id: 'u1',
					balance_eur: '34.00',
					balance_xof: '17000',
					residency_country: 'FR',
					stripe_account_id: null,
					stripe_kyc_status: 'pending',
					momo_phone: null,
					momo_phone_verified: false,
					created_at: '2026-07-16',
					updated_at: '2026-07-16'
				}
			})
		);
		const { walletApi } = await import('../../src/lib/api/wallet');
		const res = await walletApi.get();
		expect(fetchMock).toHaveBeenCalledWith('/api/users/me/wallet', expect.anything());
		expect(res.data.wallet.balance_eur).toBe('34.00');
	});

	it('transactions() forwards limit query param', async () => {
		fetchMock.mockResolvedValue(ok({ transactions: [] }));
		const { walletApi } = await import('../../src/lib/api/wallet');
		await walletApi.transactions({ limit: 50 });
		const url = fetchMock.mock.calls[0][0] as string;
		expect(url).toBe('/api/users/me/wallet/transactions?limit=50');
	});

	it('setResidency() POSTs the ISO-2 country', async () => {
		fetchMock.mockResolvedValue(ok({ wallet: {} }));
		const { walletApi } = await import('../../src/lib/api/wallet');
		await walletApi.setResidency('CI');
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/users/me/wallet/residency');
		expect(JSON.parse(init.body).country).toBe('CI');
	});
});

describe('walletApi Stripe flow', () => {
	it('stripeOnboard() posts uppercased country + returns hosted URL', async () => {
		fetchMock.mockResolvedValue(
			ok({
				account_id: 'acct_x',
				onboarding_url: 'https://connect.stripe.com/x',
				expires_at: '2026-07-17'
			})
		);
		const { walletApi } = await import('../../src/lib/api/wallet');
		const res = await walletApi.stripeOnboard('fr');
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/users/me/wallet/stripe/onboard');
		expect(init.method).toBe('POST');
		expect(JSON.parse(init.body).country).toBe('FR');
		expect(res.data.onboarding_url).toContain('stripe.com');
	});

	it('stripeWithdraw() POSTs the amount body', async () => {
		fetchMock.mockResolvedValue(
			ok({ transaction_id: 't1', stripe_transfer_id: 'tr_1', amount_cents: 1500 })
		);
		const { walletApi } = await import('../../src/lib/api/wallet');
		await walletApi.stripeWithdraw({ amount: '15.00', currency: 'EUR' });
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/users/me/wallet/withdraw/stripe');
		expect(init.method).toBe('POST');
		const body = JSON.parse(init.body);
		expect(body.amount).toBe('15.00');
		expect(body.currency).toBe('EUR');
	});
});

describe('walletApi Mobile Money flow', () => {
	it('momoRegister() POSTs phone + provider', async () => {
		fetchMock.mockResolvedValue(ok({ wallet: { momo_phone_verified: true } }));
		const { walletApi } = await import('../../src/lib/api/wallet');
		await walletApi.momoRegister({ phone: '+22990000000', provider: 'orange' });
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/users/me/wallet/momo/phone');
		const body = JSON.parse(init.body);
		expect(body.phone).toBe('+22990000000');
		expect(body.provider).toBe('orange');
	});

	it('momoWithdraw() POSTs the amount', async () => {
		fetchMock.mockResolvedValue(
			ok({ transaction_id: 't2', momo_reference: 'ref_1' })
		);
		const { walletApi } = await import('../../src/lib/api/wallet');
		await walletApi.momoWithdraw({ amount: '10000', currency: 'XOF' });
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/users/me/wallet/withdraw/momo');
		expect(init.method).toBe('POST');
		const body = JSON.parse(init.body);
		expect(body.amount).toBe('10000');
		expect(body.currency).toBe('XOF');
	});
});
