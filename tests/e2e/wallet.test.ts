import { test, expect, type Page, type Route } from '@playwright/test';
import { gotoHydrated } from './utils/hydration';

test.beforeEach(async ({ page }) => {
	await page.addInitScript(() => {
		try {
			localStorage.setItem('skilluv-locale', 'fr');
		} catch {
			// storage unavailable
		}
	});
});

type ApiRoute = { path: string; handler: (route: Route) => Promise<void> | void };

async function mockApi(page: Page, routes: ApiRoute[]) {
	await page.route('**/api/**', async (route) => {
		const url = new URL(route.request().url());
		const match = routes.find((r) => url.pathname.endsWith(r.path));
		if (match) {
			await match.handler(route);
			return;
		}
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ data: {} })
		});
	});
}

const talent = {
	id: 'u1',
	email: 'kofi@example.com',
	username: 'kofi',
	first_name: 'Kofi',
	last_name: 'Adjovi',
	display_name: 'Kofi Adjovi',
	role: 'user',
	skill_domain: 'code',
	profile_completed: true,
	title: 'artisan',
	golden_stars: 0,
	total_fragments: 3400,
	streak_current: 0,
	trust_score: 100,
	country: 'BJ',
	city: 'Cotonou',
	bio: null,
	avatar_url: null,
	github: null,
	linkedin: null,
	website: null,
	twitter: null,
	email_verified: true,
	totp_enabled: false,
	email_2fa_enabled: false,
	profile_active: true,
	created_at: '2026-01-01'
};

/**
 * Wallet endpoints moved from `/talent/wallet/*` to `/users/me/wallet*` during
 * the backend contract realignment. The old mocks matched nothing, the page
 * stayed empty and all three tests failed. Payloads follow the `Wallet` and
 * `WalletTransaction` types.
 */
const wallet = {
	user_id: 'u1',
	balance_eur: '34.00',
	balance_xof: '22300',
	residency_country: 'BJ',
	stripe_account_id: 'acct_test',
	stripe_kyc_status: 'verified',
	momo_phone: '+22990000000',
	momo_phone_verified: true,
	created_at: '2026-01-01T10:00:00Z',
	updated_at: '2026-07-16T10:00:00Z'
};

const transactions = [
	{
		id: 't1',
		user_id: 'u1',
		delta: '12.50',
		currency: 'EUR',
		reason: 'slice_payout',
		notes: 'Challenge termine — React hook',
		ledger_hash: 'a1b2c3d4e5f6g7h8',
		prev_ledger_hash: null,
		created_at: '2026-07-10T09:00:00Z'
	}
];

function json(body: unknown, status = 200) {
	return (route: Route) =>
		route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

test.describe('Wallet page', () => {
	test.beforeEach(async ({ page }) => {
		await mockApi(page, [
			{
				path: '/auth/me',
				handler: json({ data: { user: talent, login_method: 'password', has_passkey: false } })
			},
			{ path: '/users/me/capabilities', handler: json({ data: [] }) },
			{ path: '/users/me/orientations', handler: json({ data: [] }) },
			{ path: '/users/me/wallet/transactions', handler: json({ data: { transactions } }) },
			{ path: '/users/me/wallet', handler: json({ data: { wallet } }) }
		]);
	});

	test('affiche les soldes EUR/XOF et l historique', async ({ page }) => {
		await gotoHydrated(page, '/wallet');
		await expect(page.getByRole('heading', { name: 'Mon wallet' })).toBeVisible();
		await expect(page.getByText('EUR', { exact: true }).first()).toBeVisible();
		await expect(page.getByText('XOF', { exact: true }).first()).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Historique' })).toBeVisible();
		await expect(page.getByText('Challenge termine — React hook')).toBeVisible();
	});

	test('ouvre la modale de payout et montre Stripe verifie', async ({ page }) => {
		await gotoHydrated(page, '/wallet');
		await page.getByRole('button', { name: 'Demander un payout' }).click();
		await expect(page.getByRole('heading', { name: 'Demander un payout' })).toBeVisible();
		await expect(page.getByText('Stripe vérifié')).toBeVisible();
	});

	test('basculer sur Mobile Money revele les champs operateur + numero', async ({ page }) => {
		await gotoHydrated(page, '/wallet');
		await page.getByRole('button', { name: 'Demander un payout' }).click();
		await expect(page.getByRole('heading', { name: 'Demander un payout' })).toBeVisible();
		// The radio is `sr-only`: present in the DOM but covered by the label's
		// visual content, hence not normally clickable. Forcing the check still
		// fires the component's `onchange`.
		await page.getByRole('radio', { name: /Mobile Money \(XOF\)/ }).check({ force: true });
		// `getByLabel` also matches the method radio, whose accessible name
		// contains "Mobile Money"; target the text field explicitly.
		await expect(page.getByRole('textbox', { name: 'Numéro Mobile Money' })).toBeVisible();
		// "Operateur" is a <legend>, so it is a group, not a field label.
		await expect(page.getByRole('group', { name: 'Opérateur' })).toBeVisible();
	});
});
