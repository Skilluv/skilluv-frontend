/**
 * S6.8 (SKI-53) — /enterprise/credits and /enterprise/subscriptions.
 *
 * Money surfaces. Two things must hold: the owner/recruiter split on anything
 * that charges the company card, and the fact that we hand off to Stripe with
 * the pack the user actually clicked.
 */
import { test, expect, type Page, type Route } from '@playwright/test';
import { gotoHydrated } from './utils/hydration';

type ApiRoute = { path: string; handler: (route: Route) => Promise<void> | void };

async function mockApi(page: Page, routes: ApiRoute[]) {
	await page.route('**/api/**', async (route) => {
		const url = new URL(route.request().url());
		const match = routes.find((r) => url.pathname.endsWith(r.path));
		if (match) return match.handler(route);
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ data: {} })
		});
	});
}

function json(body: unknown, status = 200) {
	return (route: Route) =>
		route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

const BALANCE = {
	data: {
		balance: '120',
		total_purchased: 500,
		total_used: '380',
		total_refunded: '0',
		updated_at: '2026-08-01T09:00:00Z'
	}
};

const TRANSACTIONS = {
	data: {
		transactions: [
			{
				id: 'tx-1',
				delta: '+100',
				balance_after: '120',
				reason: 'purchase',
				related_interest_request_id: null,
				related_payment_id: 'pay-1',
				related_promo_code_id: null,
				notes: null,
				actor_user_id: 'u-owner',
				expires_at: null,
				created_at: '2026-08-01T09:00:00Z'
			}
		],
		total: 1,
		page: 1
	}
};

const PRICING = {
	data: {
		currency: 'EUR',
		psp: 'stripe',
		packs: [
			{
				slug: 'pack-100',
				credits: 100,
				kind: 'credits',
				price: 99,
				price_cents: 9900,
				price_eur: 99,
				per_credit: 0.99,
				fx_rate_applied: null,
				fx_margin_pct: null
			}
		],
		subscriptions: [],
		refund_policy: { window_days: 14 }
	}
};

const common: ApiRoute[] = [
	{ path: '/users/me/capabilities', handler: json({ data: [] }) },
	{ path: '/users/me/orientations', handler: json({ data: [] }) }
];

const billingRoutes: ApiRoute[] = [
	{ path: '/enterprise/credits/transactions', handler: json(TRANSACTIONS) },
	{ path: '/enterprise/credits', handler: json(BALANCE) },
	{ path: '/pricing', handler: json(PRICING) },
	...common
];

async function signIn(page: Page, token: 'owner' | 'recruiter') {
	await page.context().addCookies([
		{ name: 'access_token', value: token, domain: 'localhost', path: '/' }
	]);
}

test.beforeEach(async ({ page }) => {
	await page.addInitScript(() => {
		try {
			localStorage.setItem('skilluv-locale', 'fr');
		} catch {
			/* storage unavailable */
		}
	});
	// Stripe is off-site; stop at the boundary rather than following the redirect.
	await page.route('https://checkout.stripe.com/**', (route) =>
		route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>stripe</h1>' })
	);
	await page.route('https://billing.stripe.com/**', (route) =>
		route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>portal</h1>' })
	);
});

test.describe('S6.8 enterprise credits', () => {
	test('affiche le solde et l historique', async ({ page }) => {
		await signIn(page, 'owner');
		await mockApi(page, billingRoutes);
		await gotoHydrated(page, '/enterprise/credits');

		await expect(page.getByText('120').first()).toBeVisible();
		await expect(page.getByText('Achat').first()).toBeVisible();
	});

	test('acheter un pack envoie vers Stripe avec le bon slug', async ({ page }) => {
		let sent: Record<string, unknown> | null = null;
		await signIn(page, 'owner');
		await mockApi(page, [
			{
				path: '/enterprise/credits/checkout',
				handler: (route) => {
					sent = route.request().postDataJSON();
					return json({ data: { checkout_url: 'https://checkout.stripe.com/c/pay/cs_test_1' } })(
						route
					);
				}
			},
			...billingRoutes
		]);
		await gotoHydrated(page, '/enterprise/credits');

		await page.getByRole('button', { name: /Acheter|Choisir/i }).first().click();

		await expect.poll(() => sent).not.toBeNull();
		expect(sent).toEqual({ pack_slug: 'pack-100' });
		await expect(page).toHaveURL(/checkout\.stripe\.com/);
	});

	test('un code promo credite le compte', async ({ page }) => {
		let redeemed: Record<string, unknown> | null = null;
		await signIn(page, 'owner');
		await mockApi(page, [
			{
				path: '/enterprise/credits/redeem',
				handler: (route) => {
					redeemed = route.request().postDataJSON();
					return json({
						data: { code: 'SKILLUV-2026', kind: 'bonus_credits', credits_added: '50', new_balance: '170' }
					})(route);
				}
			},
			...billingRoutes
		]);
		await gotoHydrated(page, '/enterprise/credits');

		await page.getByPlaceholder('SKILLUV-2026').fill('SKILLUV-2026');
		await page.getByRole('button', { name: /Valider|Utiliser|Appliquer/i }).first().click();

		await expect.poll(() => redeemed).not.toBeNull();
		expect(redeemed).toEqual({ code: 'SKILLUV-2026' });
		await expect(page.getByText(/\+50 crédits/)).toBeVisible();
	});

	test('un recruteur lit le solde mais n engage pas la CB', async ({ page }) => {
		await signIn(page, 'recruiter');
		await mockApi(page, billingRoutes);
		await gotoHydrated(page, '/enterprise/credits');

		await expect(page.getByText('120').first()).toBeVisible();
		await expect(page.getByRole('button', { name: /Acheter|Choisir/i })).toHaveCount(0);
		await expect(page.getByRole('button', { name: /portail|facturation/i })).toHaveCount(0);
	});
});

test.describe('S6.8 enterprise subscriptions', () => {
	test('sans abonnement, les offres sont proposees', async ({ page }) => {
		await signIn(page, 'owner');
		await mockApi(page, [
			{ path: '/enterprise/subscriptions/current', handler: json({ data: { subscription: null } }) },
			{
				path: '/pricing',
				handler: json({
					data: {
						...PRICING.data,
						subscriptions: [
							{
								slug: 'pro',
								name: 'Pro',
								credits_per_month: 100,
								price: 199,
								price_cents: 19_900,
								price_eur: 199
							}
						]
					}
				})
			},
			...common
		]);
		await gotoHydrated(page, '/enterprise/subscriptions');

		await expect(page.getByText('Pro').first()).toBeVisible();
	});

	test('un abonnement actif peut etre annule', async ({ page }) => {
		let cancelled = 0;
		await signIn(page, 'owner');
		await mockApi(page, [
			{
				path: '/enterprise/subscriptions/cancel',
				handler: (route) => {
					cancelled++;
					return json({
						data: { cancel_at_period_end: true, current_period_end: '2026-09-01T09:00:00Z' }
					})(route);
				}
			},
			{
				path: '/enterprise/subscriptions/current',
				handler: json({
					data: {
						subscription: {
							plan_slug: 'pro',
							status: 'active',
							monthly_credit_grant: 100,
							current_period_start: '2026-08-01T09:00:00Z',
							current_period_end: '2026-09-01T09:00:00Z',
							cancel_at_period_end: false
						}
					}
				})
			},
			{ path: '/pricing', handler: json(PRICING) },
			...common
		]);
		await gotoHydrated(page, '/enterprise/subscriptions');

		// Cancelling is guarded by a confirm: refusing must leave the plan alone.
		page.once('dialog', (d) => d.dismiss());
		await page.getByRole('button', { name: 'Résilier' }).click();
		await page.waitForTimeout(400);
		expect(cancelled).toBe(0);

		page.once('dialog', (d) => d.accept());
		await page.getByRole('button', { name: 'Résilier' }).click();
		await expect.poll(() => cancelled).toBe(1);
	});
});
