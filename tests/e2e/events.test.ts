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
	title: 'apprenti',
	golden_stars: 0,
	total_fragments: 0,
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

const eventsPayload = {
	data: [
		{
			id: 'e1',
			slug: 'skilluv-fest-2026',
			name: 'Skilluv Fest 2026',
			description: 'Le hackathon flagship de l\'année.',
			starts_at: '2026-07-01',
			ends_at: '2026-07-31',
			visual_theme: {},
			is_partner: false
		},
		{
			id: 'e2',
			slug: 'hacktoberfest',
			name: 'Hacktoberfest',
			description: 'Contribuez open-source pendant octobre.',
			starts_at: '2026-10-01',
			ends_at: '2026-10-31',
			visual_theme: {},
			is_partner: true
		}
	]
};

test.describe('Events pages', () => {
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
				path: '/badge-events',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify(eventsPayload)
					})
			},
			{
				path: '/users/me/badge-events',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({ data: [] })
					})
			},
			{
				path: '/badge-events/skilluv-fest-2026',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({ data: eventsPayload.data[0] })
					})
			},
			{
				path: '/badge-events/skilluv-fest-2026/join',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({
							data: { event: eventsPayload.data[0], joined_at: '2026-07-16', stamp_earned: false }
						})
					})
			}
		]);
	});

	test('lists active + upcoming events with correct badges', async ({ page }) => {
		await page.goto('/events');
		await expect(page.getByRole('heading', { name: 'Événements Skilluv' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Skilluv Fest 2026' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Hacktoberfest' })).toBeVisible();
		await expect(page.getByText('Partenaire').first()).toBeVisible();
	});

	test('event detail joins successfully', async ({ page }) => {
		await page.goto('/events/skilluv-fest-2026');
		await expect(page.getByRole('heading', { name: 'Skilluv Fest 2026' })).toBeVisible();
		await page.getByRole('button', { name: /Rejoindre l'événement/i }).click();
		await expect(page.getByRole('button', { name: 'Déjà rejoint' })).toBeVisible();
	});
});
