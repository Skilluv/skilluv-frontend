import { test, expect, type Page, type Route } from '@playwright/test';

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

test.describe('Wallet page', () => {
	test.beforeEach(async ({ page }) => {
		await mockApi(page, [
			{
				path: '/auth/me',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({
							data: { user: talent, login_method: 'password', has_passkey: false }
						})
					})
			},
			{
				path: '/users/me/capabilities',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({ data: [] })
					})
			},
			{
				path: '/users/me/orientations',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({ data: [] })
					})
			},
			{
				path: '/talent/wallet/balance',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({
							data: { fragments: 3400, eur_equivalent: 34, last_updated: '2026-07-16T10:00:00Z' }
						})
					})
			},
			{
				path: '/talent/wallet/history',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({
							data: [
								{
									id: 't1',
									kind: 'earn',
									fragments_delta: 100,
									description: 'Challenge terminé — React hook',
									entry_hash: 'a1b2c3d4e5f6g7h8',
									created_at: '2026-07-10'
								}
							],
							pagination: { page: 1, per_page: 25, total: 1, total_pages: 1 },
							meta: { request_id: 'r', timestamp: '2026-07-16' }
						})
					})
			},
			{
				path: '/talent/wallet/payouts',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({
							data: [],
							pagination: { page: 1, per_page: 25, total: 0, total_pages: 0 },
							meta: { request_id: 'r', timestamp: '2026-07-16' }
						})
					})
			},
			{
				path: '/talent/wallet/stripe/status',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({ data: { connected: true, account_id: 'acct_test' } })
					})
			}
		]);
	});

	test('displays balance and history', async ({ page }) => {
		await page.goto('/wallet');
		await expect(page.getByRole('heading', { name: 'Mon wallet' })).toBeVisible();
		await expect(page.getByText('3 400 fragments').or(page.getByText('3,400 fragments'))).toBeVisible();
		await expect(page.getByText('Challenge terminé — React hook')).toBeVisible();
	});

	test('opens payout modal and shows Stripe status', async ({ page }) => {
		await page.goto('/wallet');
		await page.getByRole('button', { name: 'Demander un payout' }).click();
		await expect(page.getByRole('heading', { name: 'Demander un payout' })).toBeVisible();
		await expect(page.getByText('Stripe connecté')).toBeVisible();
	});

	test('switching to Mobile Money reveals the operator + number fields', async ({ page }) => {
		await page.goto('/wallet');
		await page.getByRole('button', { name: 'Demander un payout' }).click();
		await page.getByText('Orange Money / MTN', { exact: false }).click();
		await expect(page.getByLabel('Numéro Mobile Money')).toBeVisible();
		await expect(page.getByLabel('Orange Money')).toBeVisible();
	});
});
