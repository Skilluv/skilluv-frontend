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

const curatorUser = {
	id: 'u1',
	email: 'curator@example.com',
	username: 'curator',
	first_name: 'C',
	last_name: 'U',
	display_name: 'Curator U',
	role: 'user',
	skill_domain: 'code',
	profile_completed: true,
	title: 'artisan',
	golden_stars: 0,
	total_fragments: 0,
	streak_current: 0,
	trust_score: 100,
	country: 'FR',
	city: null,
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

const reviewPayload = {
	data: [
		{
			id: 'ch-1',
			title: 'Build a Rust HTTP server',
			description: 'Handle 1000 rps with async tokio.',
			instructions: 'x',
			skill_domain: 'code',
			difficulty: 4,
			mode: 'solo',
			duration_minutes: 120,
			ai_allowed: false,
			tone: 'serious',
			language: 'rust',
			prerequisite_fragments: 0,
			reward_fragments: 50,
			is_onboarding: false,
			status: 'draft',
			is_community: true,
			community_status: 'review',
			featured: false,
			vote_count: 0,
			test_cases: null,
			expected_output: null,
			created_by: 'alice',
			created_at: '2026-07-10',
			updated_at: '2026-07-10'
		}
	],
	pagination: { page: 1, per_page: 50, total: 1, total_pages: 1 },
	meta: { request_id: 'r', timestamp: '2026-07-16' }
};

test.describe('Curator community queue', () => {
	test.beforeEach(async ({ page }) => {
		await mockApi(page, [
			{
				path: '/auth/me',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({
							data: { user: curatorUser, login_method: 'password', has_passkey: false }
						})
					})
			},
			{
				path: '/users/me/capabilities',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({
							data: [
								{
									capability: 'community_curator',
									granted_at: '2026-01-01',
									granted_reason: 'nomination'
								}
							]
						})
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
				path: '/community/challenges/review',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify(reviewPayload)
					})
			},
			{
				path: '/community/challenges/ch-1/approve',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({ data: { approved: true } })
					})
			}
		]);
	});

	test('curator sees the queue and approves a challenge', async ({ page }) => {
		await page.goto('/community/curator');
		await expect(page.getByRole('heading', { name: 'File curator' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Build a Rust HTTP server' })).toBeVisible();

		await page.getByRole('button', { name: 'Approuver' }).click();
		await expect(page.getByRole('heading', { name: 'Approuver ce challenge ?' })).toBeVisible();
		await page.getByLabel('Raison').fill('Solid challenge');
		await page.getByRole('button', { name: 'Confirmer' }).click();

		await expect(page.getByRole('heading', { name: 'Build a Rust HTTP server' })).toHaveCount(0);
	});

	test('non-curator user gets the forbidden message', async ({ page }) => {
		await page.route('**/api/users/me/capabilities', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ data: [] })
			});
		});
		await page.goto('/community/curator');
		await expect(page.getByText(/permissions/i)).toBeVisible();
	});
});
