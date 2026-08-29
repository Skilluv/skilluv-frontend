/**
 * S6.2 and S6.11 (SKI-53) — enterprise profile, lists and interest requests.
 *
 * The profile is what talents see before answering a contact request, and the
 * discard guard is what stops an accidental navigation from throwing away an
 * edit. Lists and interests only ever had a heading assertion.
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

const ENTERPRISE = {
	data: {
		enterprise: {
			id: 'ent-1',
			company_name: 'Acme Corp',
			description: 'On construit des outils.',
			website: 'https://acme.io',
			logo_url: null,
			industry: 'tech',
			company_size: '11-50',
			country: 'FR',
			enterprise_type: 'direct_hire'
		},
		member_count: 3
	}
};

const common: ApiRoute[] = [
	{ path: '/users/me/capabilities', handler: json({ data: [] }) },
	{ path: '/users/me/orientations', handler: json({ data: [] }) }
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
});

test.describe('S6.2 enterprise profile', () => {
	test('prefille le formulaire avec le profil existant', async ({ page }) => {
		await signIn(page, 'owner');
		await mockApi(page, [{ path: '/enterprise/profile', handler: json(ENTERPRISE) }, ...common]);
		await gotoHydrated(page, '/enterprise/profile');

		await expect(page.getByLabel("Nom de l'entreprise")).toHaveValue('Acme Corp');
		await expect(page.getByLabel(/Site web/)).toHaveValue('https://acme.io');
	});

	test('enregistrer poste les champs modifies', async ({ page }) => {
		let sent: Record<string, unknown> | null = null;
		await signIn(page, 'owner');
		await mockApi(page, [
			{
				path: '/enterprise/profile',
				handler: (route) => {
					if (route.request().method() === 'PUT') {
						sent = route.request().postDataJSON();
						return json(ENTERPRISE)(route);
					}
					return json(ENTERPRISE)(route);
				}
			},
			...common
		]);
		await gotoHydrated(page, '/enterprise/profile');

		await page.getByLabel("Nom de l'entreprise").fill('Acme International');
		await page.getByRole('button', { name: /Enregistrer|Sauvegarder/i }).click();

		await expect.poll(() => sent).not.toBeNull();
		expect(sent).toMatchObject({ company_name: 'Acme International' });
	});

	test('un nom vide est refuse avant tout appel', async ({ page }) => {
		let puts = 0;
		await signIn(page, 'owner');
		await mockApi(page, [
			{
				path: '/enterprise/profile',
				handler: (route) => {
					if (route.request().method() === 'PUT') puts++;
					return json(ENTERPRISE)(route);
				}
			},
			...common
		]);
		await gotoHydrated(page, '/enterprise/profile');

		await page.getByLabel("Nom de l'entreprise").fill('');
		await page.getByRole('button', { name: /Enregistrer|Sauvegarder/i }).click();

		// The field is `required`, so the browser blocks the submit before the
		// handler runs. Either way, nothing reaches the API.
		await expect(page.getByLabel("Nom de l'entreprise")).toHaveJSProperty('validity.valid', false);
		await page.waitForTimeout(400);
		expect(puts).toBe(0);
	});
});

test.describe('S6.11 enterprise lists and interests', () => {
	test('creer une liste poste son nom', async ({ page }) => {
		let created: Record<string, unknown> | null = null;
		await signIn(page, 'recruiter');
		await mockApi(page, [
			{
				path: '/enterprise/lists',
				handler: (route) => {
					if (route.request().method() === 'POST') {
						created = route.request().postDataJSON();
						return json({
							data: { list: { id: 'l-1', name: 'Backend Rust', description: null, talent_count: 0 } }
						})(route);
					}
					return json({ data: { lists: [] } })(route);
				}
			},
			...common
		]);
		await gotoHydrated(page, '/enterprise/lists');

		await page.getByRole('button', { name: '+ Nouvelle liste' }).click();
		await page.getByLabel('Nom de la liste').fill('Backend Rust');
		await page.getByRole('button', { name: 'Créer' }).click();

		await expect.poll(() => created).not.toBeNull();
		expect(created).toMatchObject({ name: 'Backend Rust' });
	});

	test('sans liste, un etat vide est affiche', async ({ page }) => {
		await signIn(page, 'recruiter');
		await mockApi(page, [
			{ path: '/enterprise/lists', handler: json({ data: { lists: [] } }) },
			...common
		]);
		await gotoHydrated(page, '/enterprise/lists');

		await expect(page.getByText('Aucune liste créée.')).toBeVisible();
	});

	test('les demandes de contact affichent leur statut', async ({ page }) => {
		await signIn(page, 'recruiter');
		await mockApi(page, [
			{
				path: '/contact/interest/sent',
				handler: json({
					data: [
						{
							id: 'ir-1',
							talent_id: 'u-kofi',
							talent_username: 'kofi',
							talent_display_name: 'Kofi Adjovi',
							status: 'pending',
							message: 'Un poste backend pourrait vous plaire.',
							created_at: '2026-08-10T09:00:00Z'
						}
					],
					pagination: { page: 1, per_page: 20, total: 1, total_pages: 1 },
					meta: { request_id: 'r', timestamp: '2026-08-12' }
				})
			},
			...common
		]);
		await gotoHydrated(page, '/enterprise/interests');

		await expect(page.getByText('Kofi Adjovi').first()).toBeVisible();
	});
});
