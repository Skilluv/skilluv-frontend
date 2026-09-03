import { test, expect, type Page, type Route } from '@playwright/test';
import { gotoHydrated } from './utils/hydration';

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
				// The catalogue is asked for one discipline at a time now — the
				// endpoint caps a page at 200 against ~255 curated trades, so a
				// call with no filter silently returned the default 50. The mock
				// honours the filter so the page under test is exercised the way
				// the backend actually answers.
				path: '/orientations',
				handler: (route) => {
					const domain = new URL(route.request().url()).searchParams.get('domain');
					const orientations = domain
						? catalogPayload.data.filter((o) => o.primary_domain === domain)
						: catalogPayload.data;
					return route.fulfill({
						status: 200,
						contentType: 'application/json',
						// The envelope the handler actually writes. This fixture used
						// to answer a bare array, matching what the client was typed
						// for rather than what the server sends.
						body: JSON.stringify({
							data: {
								orientations,
								pagination: { limit: 200, offset: 0 },
								total: orientations.length
							}
						})
					});
				}
			}
		]);
	});

	test('opens on the caller own discipline', async ({ page }) => {
		// The user is a `code` account, so that is the catalogue they meet —
		// not a mixed list of every discipline at once.
		await gotoHydrated(page, '/onboarding/orientations');
		await expect(page.getByRole('heading', { name: 'Ton parcours Skilluv' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Dev frontend' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Analyste sécurité' })).toHaveCount(0);
	});

	test('changing the discipline asks the backend again for that one', async ({ page }) => {
		const asked: string[] = [];
		page.on('request', (req) => {
			const url = new URL(req.url());
			if (url.pathname.endsWith('/orientations')) {
				asked.push(url.searchParams.get('domain') ?? '');
			}
		});

		await gotoHydrated(page, '/onboarding/orientations');
		await expect(page.getByRole('heading', { name: 'Dev frontend' })).toBeVisible();

		await page.getByLabel('Filtrer par domaine').selectOption('security');
		await expect(page.getByRole('heading', { name: 'Analyste sécurité' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Dev frontend' })).toHaveCount(0);

		expect(asked).toContain('security');
	});

	test('offers every discipline the platform serves, not four of them', async ({ page }) => {
		await gotoHydrated(page, '/onboarding/orientations');
		const options = page.getByLabel('Filtrer par domaine').locator('option');
		// The list used to be written out by hand and froze at four while the
		// platform served eleven.
		await expect(options).toHaveCount(11);
	});

	test('shows the selection summary once something is picked', async ({ page }) => {
		await gotoHydrated(page, '/onboarding/orientations');
		await page.getByRole('button', { name: /Dev frontend/i }).click();
		await expect(page.getByRole('heading', { name: 'Ta sélection' })).toBeVisible();
		// "Dev frontend" also appears on the picker card; assert inside the
		// summary, which is what this test is about.
		await expect(
			page.getByLabel('Ta sélection').getByText('Dev frontend')
		).toBeVisible();
	});

	test('submits selection and shows confirmation', async ({ page }) => {
		await gotoHydrated(page, '/onboarding/orientations');
		await page.getByRole('button', { name: /Dev frontend/i }).click();
		await page.getByRole('button', { name: 'Valider mes orientations' }).click();
		await expect(page.getByRole('status')).toContainText(/Orientations enregistrées/i);
	});
});
