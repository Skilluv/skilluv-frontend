import { test, expect, type Page, type Route } from '@playwright/test';
import { gotoHydrated } from './utils/hydration';

test.beforeEach(async ({ page, context }) => {
	await page.addInitScript(() => {
		try {
			localStorage.setItem('skilluv-locale', 'fr');
		} catch {
			// storage unavailable
		}
	});
	// Auth is resolved during SSR (hooks.server.ts): without this cookie the
	// page renders anonymous, capabilities never load and the curator queue
	// shows "no permission". The capability itself comes from each test's own
	// `/users/me/capabilities` mock.
	await context.addCookies([
		{ name: 'access_token', value: 'challenger', domain: 'localhost', path: '/' }
	]);
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
		await gotoHydrated(page, '/community/curator');
		await expect(page.getByRole('heading', { name: 'File curator' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Build a Rust HTTP server' })).toBeVisible();

		await page.getByRole('button', { name: 'Approuver' }).click();
		await expect(page.getByRole('heading', { name: 'Approuver ce challenge ?' })).toBeVisible();
		// Approving does NOT ask for a reason (`requireReason` is only true for a
		// rejection): the old `getByLabel('Raison')` waited on a field that is
		// never rendered and timed the test out.
		await page.getByRole('button', { name: 'Confirmer' }).click();

		await expect(page.getByRole('heading', { name: 'Build a Rust HTTP server' })).toHaveCount(0);
	});

	test('curator rejects a challenge with the canonical `reason` payload', async ({ page }) => {
		let rejected: Record<string, unknown> | null = null;
		await page.route('**/api/community/challenges/ch-1/reject', async (route) => {
			rejected = route.request().postDataJSON();
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ data: { rejected: true, id: 'ch-1', title: 'Build a Rust HTTP server' } })
			});
		});

		await gotoHydrated(page, '/community/curator');
		await expect(page.getByRole('heading', { name: 'Build a Rust HTTP server' })).toBeVisible();

		await page.getByRole('button', { name: 'Rejeter' }).click();
		await expect(page.getByRole('heading', { name: 'Rejeter ce challenge ?' })).toBeVisible();
		// A rejection requires a reason, unlike an approval.
		await page.getByLabel('Raison').fill('Hors sujet pour le domaine code');
		await page.getByRole('button', { name: 'Confirmer' }).click();

		await expect.poll(() => rejected).not.toBeNull();
		// The backend field is `reason`; `feedback` returns 422.
		expect(rejected).toEqual({ reason: 'Hors sujet pour le domaine code' });
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
		await gotoHydrated(page, '/community/curator');
		await expect(page.getByText(/permissions/i)).toBeVisible();
	});
});
