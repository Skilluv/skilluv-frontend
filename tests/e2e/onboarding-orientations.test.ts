import { test, expect, type Page, type Route } from '@playwright/test';

test.beforeEach(async ({ page }) => {
	await page.addInitScript(() => {
		try {
			localStorage.setItem('skilluv-locale', 'fr');
		} catch {
			// storage might be unavailable in some contexts
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

const authenticatedUser = {
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

const catalogPayload = {
	data: [
		{
			id: 'o1',
			slug: 'dev-frontend',
			name: 'Dev frontend',
			description: 'Crafte des interfaces web performantes et accessibles.',
			primary_domain: 'code',
			secondary_domains: ['design'],
			tags: ['react', 'svelte', 'a11y'],
			is_curated: true,
			is_archived: false
		},
		{
			id: 'o2',
			slug: 'security-analyst',
			name: 'Analyste sécurité',
			description: 'Audite, teste, remédie sur des systèmes critiques.',
			primary_domain: 'security',
			secondary_domains: [],
			tags: ['pentest', 'blue-team'],
			is_curated: true,
			is_archived: false
		},
		{
			id: 'o3',
			slug: 'game-designer',
			name: 'Game designer',
			description: 'Conçoit les mécaniques et boucles de jeu.',
			primary_domain: 'game',
			secondary_domains: ['design'],
			tags: ['unity', 'level-design'],
			is_curated: true,
			is_archived: false
		}
	]
};

test.describe('Onboarding orientations flow', () => {
	test.beforeEach(async ({ page }) => {
		await mockApi(page, [
			{
				path: '/auth/me',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({
							data: { user: authenticatedUser, login_method: 'password', has_passkey: false }
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
				handler: async (route) => {
					if (route.request().method() === 'POST') {
						const body = JSON.parse(route.request().postData() ?? '{}');
						await route.fulfill({
							status: 201,
							contentType: 'application/json',
							body: JSON.stringify({
								data: {
									orientation_slug: body.orientation_slug,
									orientation_name: body.orientation_slug,
									mode: body.mode,
									is_primary: !!body.is_primary,
									started_at: '2026-07-15',
									working_languages: body.working_languages ?? []
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
			},
			{
				path: '/orientations',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify(catalogPayload)
					})
			}
		]);
	});

	test('renders catalog with all orientations', async ({ page }) => {
		await page.goto('/onboarding/orientations');
		await expect(page.getByRole('heading', { name: 'Ton parcours Skilluv' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Dev frontend' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Analyste sécurité' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Game designer' })).toBeVisible();
	});

	test('filters catalog by domain', async ({ page }) => {
		await page.goto('/onboarding/orientations');
		await page.getByLabel('Filtrer par domaine').selectOption('code');
		await expect(page.getByRole('heading', { name: 'Dev frontend' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Analyste sécurité' })).toHaveCount(0);
	});

	test('enforces the 3-orientation cap', async ({ page }) => {
		await page.goto('/onboarding/orientations');
		await page.getByRole('button', { name: /Dev frontend/i }).click();
		await page.getByRole('button', { name: /Analyste sécurité/i }).click();
		await page.getByRole('button', { name: /Game designer/i }).click();
		await expect(page.getByRole('heading', { name: 'Ta sélection' })).toBeVisible();
		await expect(page.getByText('Dev frontend')).toBeVisible();
	});

	test('submits selection and shows confirmation', async ({ page }) => {
		await page.goto('/onboarding/orientations');
		await page.getByRole('button', { name: /Dev frontend/i }).click();
		await page.getByRole('button', { name: 'Valider mes orientations' }).click();
		await expect(page.getByRole('status')).toContainText(/Orientations enregistrées/i);
	});
});
