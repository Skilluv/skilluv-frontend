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

const marketplacePayload = {
	data: [
		{
			slot_id: 's1',
			role_slug: 'backend',
			role_display_name: 'Backend engineer',
			min_proficiency_level: 2,
			required_skill_slug: 'rust',
			team_id: 't1',
			team_name: 'Team Rust',
			challenge_id: 'ch1',
			challenge_title: 'Build a KV store',
			created_at: '2026-07-16'
		},
		{
			slot_id: 's2',
			role_slug: 'frontend',
			role_display_name: 'Frontend engineer',
			min_proficiency_level: 1,
			required_skill_slug: 'svelte',
			team_id: 't2',
			team_name: 'Team Svelte',
			challenge_id: 'ch2',
			challenge_title: 'Realtime dashboard',
			created_at: '2026-07-16'
		}
	],
	pagination: { page: 1, per_page: 20, total: 2, total_pages: 1 },
	meta: { request_id: 'r', timestamp: '2026-07-16' }
};

test.describe('Team marketplace page', () => {
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
						body: JSON.stringify({
							data: [
								{
									orientation_slug: 'dev-backend',
									orientation_name: 'Dev backend',
									mode: 'active',
									is_primary: true,
									started_at: '2026-01-01',
									working_languages: ['fr']
								}
							]
						})
					})
			},
			{
				path: '/teams/marketplace',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify(marketplacePayload)
					})
			},
			{
				path: '/teams/t1/slots/s1/fill',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({
							data: { slot_id: 's1', filled_by: 'u1', role_slug: 'backend', min_proficiency_level: 2, created_at: '2026-07-16' }
						})
					})
			}
		]);
	});

	test('renders open slots with team + challenge info', async ({ page }) => {
		await page.goto('/teams/marketplace');
		await expect(page.getByRole('heading', { name: 'Marché des équipes' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Build a KV store' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Realtime dashboard' })).toBeVisible();
	});

	test('opens fill dialog and joins a slot', async ({ page }) => {
		await page.goto('/teams/marketplace');
		await page
			.locator('article', { hasText: 'Build a KV store' })
			.getByRole('button', { name: 'Rejoindre' })
			.click();
		await expect(page.getByRole('heading', { name: 'Rejoindre ce slot ?' })).toBeVisible();
		await page.getByRole('button', { name: 'Je rejoins' }).click();
		await expect(page.getByRole('heading', { name: 'Build a KV store' })).toHaveCount(0);
	});

	test('shows soft-block when user has no orientation', async ({ page }) => {
		await page.route('**/api/users/me/orientations', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ data: [] })
			});
		});
		await page.goto('/teams/marketplace');
		await expect(
			page.getByRole('heading', { name: 'Cette section a besoin de tes orientations' })
		).toBeVisible();
	});
});
