import { describe, it, expect, vi, beforeEach } from 'vitest';

// Modules mockés à cause du import { createApiClient } singleton.
// On teste les modules via un stub global de fetch.

describe('Pricing API', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it('calls GET /pricing without params', async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: () =>
				Promise.resolve({
					data: {
						currency: 'EUR',
						psp: 'stripe',
						packs: [
							{
								slug: 'pack_1',
								credits: 1,
								kind: 'credits',
								price: 39.0,
								price_cents: 3900,
								price_eur: 39.0,
								per_credit: 39.0,
								fx_rate_applied: null,
								fx_margin_pct: null
							}
						],
						subscriptions: [],
						refund_policy: { refused: 0.5, timeout_days: 30, timeout_refund: 0.5 }
					}
				})
		});
		vi.stubGlobal('fetch', mockFetch);
		const { pricingApi } = await import('../../src/lib/api/pricing');
		const res = await pricingApi.get();
		expect(res.data.currency).toBe('EUR');
		expect(res.data.packs).toHaveLength(1);
		expect(res.data.refund_policy.refused).toBe(0.5);
		expect(mockFetch).toHaveBeenCalledWith(
			'/api/pricing',
			expect.objectContaining({ credentials: 'include' })
		);
	});

	it('sends country + currency query params when provided', async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: () =>
				Promise.resolve({
					data: { currency: 'NGN', psp: 'paystack', packs: [], subscriptions: [], refund_policy: { refused: 0.5, timeout_days: 30, timeout_refund: 0.5 } }
				})
		});
		vi.stubGlobal('fetch', mockFetch);
		const { pricingApi } = await import('../../src/lib/api/pricing');
		await pricingApi.get({ country: 'NG', currency: 'NGN' });
		const call = mockFetch.mock.calls[0][0] as string;
		expect(call).toContain('country=NG');
		expect(call).toContain('currency=NGN');
	});
});

describe('Credits API', () => {
	beforeEach(() => vi.resetModules());

	it('creates a Stripe checkout session', async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: () =>
				Promise.resolve({
					data: {
						session_id: 'cs_test_xyz',
						checkout_url: 'https://checkout.stripe.com/pay/cs_test_xyz'
					}
				})
		});
		vi.stubGlobal('fetch', mockFetch);
		const { creditsApi } = await import('../../src/lib/api/credits');
		const res = await creditsApi.createCheckout('pack_5');
		expect(res.data.checkout_url).toContain('checkout.stripe.com');
		expect(mockFetch).toHaveBeenCalledWith(
			'/api/enterprise/credits/checkout',
			expect.objectContaining({
				method: 'POST',
				credentials: 'include',
				body: JSON.stringify({ pack_slug: 'pack_5' })
			})
		);
	});

	it('redeems a promo code', async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: () =>
				Promise.resolve({
					data: { code: 'WELCOME', kind: 'bonus_credits', credits_added: '5', new_balance: '5' }
				})
		});
		vi.stubGlobal('fetch', mockFetch);
		const { creditsApi } = await import('../../src/lib/api/credits');
		const res = await creditsApi.redeemPromo('WELCOME');
		expect(res.data.credits_added).toBe('5');
		expect(res.data.new_balance).toBe('5');
	});
});

describe('Invoices API', () => {
	beforeEach(() => vi.resetModules());

	it('lists invoices', async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: () =>
				Promise.resolve({
					data: {
						invoices: [
							{
								id: 'inv-1',
								invoice_number: 'SKL-2026-00001',
								enterprise_id: 'ent-1',
								amount_ht_cents: 3900,
								amount_tva_cents: 780,
								amount_ttc_cents: 4680,
								tva_rate_pct: 20.0,
								currency: 'EUR',
								billing_country: 'FR',
								billing_company_name: 'Test Corp',
								billing_address: null,
								billing_vat_number: null,
								description: 'Pack de 1 crédit(s) Skilluv',
								stripe_payment_intent_id: 'pi_test',
								stripe_session_id: 'cs_test',
								related_transaction_id: 'txn-1',
								issued_at: '2026-01-15T10:00:00Z',
								pdf_storage_key: null
							}
						],
						total: 1,
						page: 1
					}
				})
		});
		vi.stubGlobal('fetch', mockFetch);
		const { invoicesApi } = await import('../../src/lib/api/invoices');
		const res = await invoicesApi.list({ per_page: 100 });
		expect(res.data.invoices).toHaveLength(1);
		expect(res.data.invoices[0].invoice_number).toMatch(/^SKL-\d{4}-\d{5}$/);
	});

	it('generates a PDF URL', async () => {
		const { invoicesApi } = await import('../../src/lib/api/invoices');
		expect(invoicesApi.pdfUrl('inv-123')).toBe('/api/enterprise/invoices/inv-123/pdf');
	});
});
