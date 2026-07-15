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

const enterpriseOwner = {
	id: 'u1',
	email: 'owner@acme.co',
	username: 'owner',
	first_name: 'Owner',
	last_name: 'Acme',
	display_name: 'Owner Acme',
	role: 'enterprise',
	skill_domain: 'code',
	profile_completed: true,
	title: 'apprenti',
	golden_stars: 0,
	total_fragments: 0,
	streak_current: 0,
	trust_score: 100,
	country: 'FR',
	city: 'Paris',
	bio: null,
	avatar_url: null,
	github: null,
	linkedin: null,
	website: null,
	twitter: null,
	email_verified: true,
	totp_enabled: true,
	email_2fa_enabled: false,
	profile_active: true,
	created_at: '2026-01-01'
};

test.describe('Agency clients page', () => {
	test.beforeEach(async ({ page }) => {
		await mockApi(page, [
			{
				path: '/auth/me',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({
							data: { user: enterpriseOwner, login_method: 'password', has_passkey: true }
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
				path: '/enterprises/me/type-config',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({
							data: { enterprise_type: 'staffing_agency', type_config: {} }
						})
					})
			},
			{
				path: '/enterprises/me/agency-clients',
				handler: async (route) => {
					const method = route.request().method();
					if (method === 'POST') {
						const body = JSON.parse(route.request().postData() ?? '{}');
						await route.fulfill({
							status: 201,
							contentType: 'application/json',
							body: JSON.stringify({
								data: {
									id: 'c-new',
									client_name: body.client_name,
									client_contact_email: body.client_contact_email,
									notes: body.notes,
									active: true,
									created_at: '2026-07-15'
								}
							})
						});
						return;
					}
					await route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({ data: [] })
					});
				}
			}
		]);
	});

	test('shows empty state and adds a new client', async ({ page }) => {
		await page.goto('/enterprise/agency-clients');
		await expect(page.getByRole('heading', { name: 'Mes clients' })).toBeVisible();
		await expect(page.getByText('Aucun client pour l\'instant.')).toBeVisible();

		await page.getByRole('button', { name: /Créer mon premier client/i }).click();
		await page.getByLabel('Nom du client').fill('Acme SAS');
		await page.getByLabel('Email de contact').fill('contact@acme.co');
		await page.getByRole('button', { name: 'Enregistrer' }).click();

		await expect(page.getByText('Acme SAS')).toBeVisible();
	});

	test('surfaces the owner-only warning for direct_hire accounts', async ({ page }) => {
		await page.route('**/api/enterprises/me/type-config', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					data: { enterprise_type: 'direct_hire', type_config: {} }
				})
			});
		});
		await page.goto('/enterprise/agency-clients');
		await expect(page.getByText(/Réservé aux comptes agency/i)).toBeVisible();
	});
});
