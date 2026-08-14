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

	// Ces tests verifiaient l'URL, pas son existence : ils passaient
	// pendant que `/withdraw/stripe` et `/withdraw/momo` avaient disparu du
	// backend et que le retrait etait casse en production. Un test qui
	// affirme une URL sans qu'aucun test de contrat ne la confirme donne
	// une confiance qui n'est adossee a rien.
	it('withdraw() en EUR passe par un endpoint unique', async () => {
		fetchMock.mockResolvedValue(
			ok({ amount: '15.00', currency: 'EUR', provider: 'stripe', reference: 'tr_1', status: 'completed' })
		);
		const { walletApi } = await import('../../src/lib/api/wallet');
		await walletApi.withdraw({ amount: '15.00', currency: 'EUR', rail: 'bank_account' });
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/users/me/wallet/withdraw');
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

	it('withdraw() en XOF passe par le meme endpoint', async () => {
		fetchMock.mockResolvedValue(
			ok({ amount: '10000', currency: 'XOF', provider: 'mtn', reference: 'ref_1', status: 'pending' })
		);
		const { walletApi } = await import('../../src/lib/api/wallet');
		await walletApi.withdraw({ amount: '10000', currency: 'XOF', rail: 'mobile_money' });
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/users/me/wallet/withdraw');
		const body = JSON.parse(init.body);
		expect(body.amount).toBe('10000');
		expect(body.currency).toBe('XOF');
	});

	it('ne choisit jamais le prestataire, seulement le rail', async () => {
		fetchMock.mockResolvedValue(
			ok({ amount: '5000', currency: 'XOF', provider: 'fedapay', reference: 'r', status: 'pending' })
		);
		const { walletApi } = await import('../../src/lib/api/wallet');
		await walletApi.withdraw({ amount: '5000', currency: 'XOF', rail: 'mobile_money' });
		const body = JSON.parse(fetchMock.mock.calls[0][1].body);
		// Qui paie depend du pays du beneficiaire et de la table de
		// routage. Un client qui nomme un prestataire court-circuite ce
		// choix et casse le jour ou un corridor change.
		expect(body.provider).toBeUndefined();
	});
});
