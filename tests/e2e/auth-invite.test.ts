/**
 * S1.6 (SKI-49) — /auth/invite/[token]: enterprise recruiter invitation.
 *
 * Four distinct outcomes hang off one URL depending on the token preview and
 * the visitor's session. Only the "invalid token does not crash" case was
 * covered by a parcours spec, and it pointed at a query-string URL that is not
 * even the real route.
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

const TOKEN = 'inv-token-1';

function preview(overrides: Record<string, unknown> = {}) {
	return {
		data: {
			email: 'recruteur@acme.io',
			company_name: 'Acme Corp',
			account_exists: false,
			...overrides
		}
	};
}

const common: ApiRoute[] = [
	{ path: '/users/me/capabilities', handler: json({ data: [] }) },
	{ path: '/users/me/orientations', handler: json({ data: [] }) }
];

test.beforeEach(async ({ page }) => {
	await page.addInitScript(() => {
		try {
			localStorage.setItem('skilluv-locale', 'fr');
		} catch {
			/* storage unavailable */
		}
	});
});

test.describe('S1.6 enterprise invitation', () => {
	test('sans compte, le formulaire est reduit au minimum et l email est fige', async ({ page }) => {
		await mockApi(page, [
			{ path: '/enterprise/invite/preview', handler: json(preview()) },
			...common
		]);
		await gotoHydrated(page, `/auth/invite/${TOKEN}`);

		await expect(page.getByText('Acme Corp').first()).toBeVisible();
		await expect(page.getByText('recruteur@acme.io')).toBeVisible();
		await expect(page.getByLabel('Prénom')).toBeVisible();
		await expect(page.getByLabel('Nom', { exact: true })).toBeVisible();
		// The token fixes the email, so asking for it again would be a way to
		// send the invitation somewhere else.
		await expect(page.getByLabel('Email')).toHaveCount(0);
	});

	test('l inscription poste le token et ouvre l onboarding entreprise', async ({ page }) => {
		let sent: Record<string, unknown> | null = null;
		await mockApi(page, [
			{
				path: '/enterprise/invite/register-and-accept',
				handler: (route) => {
					sent = route.request().postDataJSON();
					return json({
						data: {
							user: {
								id: 'u-new',
								username: 'recruteur',
								email: 'recruteur@acme.io',
								role: 'recruiter'
							}
						}
					})(route);
				}
			},
			{ path: '/enterprise/invite/preview', handler: json(preview()) },
			...common
		]);
		await gotoHydrated(page, `/auth/invite/${TOKEN}`);

		await page.getByLabel('Prénom').fill('Kwame');
		await page.getByLabel('Nom', { exact: true }).fill('Boateng');
		await page.getByLabel('Mot de passe', { exact: true }).fill('Skilluv!2026abc');
		await page.getByRole('checkbox').check();
		await page.getByRole('button', { name: "Rejoindre l'entreprise" }).click();

		await expect.poll(() => sent).not.toBeNull();
		expect(sent).toMatchObject({
			token: TOKEN,
			first_name: 'Kwame',
			last_name: 'Boateng',
			terms_accepted: true
		});
		await expect(page).toHaveURL(/\/enterprise\/onboarding/);
	});

	test('sans acceptation des conditions, rien n est poste', async ({ page }) => {
		let calls = 0;
		await mockApi(page, [
			{
				path: '/enterprise/invite/register-and-accept',
				handler: (route) => {
					calls++;
					return json({ data: {} })(route);
				}
			},
			{ path: '/enterprise/invite/preview', handler: json(preview()) },
			...common
		]);
		await gotoHydrated(page, `/auth/invite/${TOKEN}`);

		await page.getByLabel('Prénom').fill('Kwame');
		await page.getByLabel('Nom', { exact: true }).fill('Boateng');
		await page.getByLabel('Mot de passe', { exact: true }).fill('Skilluv!2026abc');
		await page.getByRole('button', { name: "Rejoindre l'entreprise" }).click();

		await page.waitForTimeout(500);
		expect(calls).toBe(0);
	});

	test('si un compte existe deja, on renvoie vers la connexion et non un formulaire', async ({
		page
	}) => {
		await mockApi(page, [
			{
				path: '/enterprise/invite/preview',
				handler: json(preview({ account_exists: true }))
			},
			...common
		]);
		await gotoHydrated(page, `/auth/invite/${TOKEN}`);

		await expect(page.getByLabel('Prénom')).toHaveCount(0);
		await page.getByRole('button', { name: 'Se connecter et accepter' }).click();
		await expect(page).toHaveURL(/\/auth\/login\?redirect=/);
	});

	test('un token expire affiche une invitation invalide, pas une page blanche', async ({
		page
	}) => {
		await mockApi(page, [
			{
				path: '/enterprise/invite/preview',
				handler: json(
					{
						error: { code: 'INVITE_EXPIRED', message: 'Invitation expirée' },
						meta: { request_id: 'r', timestamp: '2026-08-12' }
					},
					400
				)
			},
			...common
		]);
		await gotoHydrated(page, `/auth/invite/${TOKEN}`);

		await expect(page.getByText('Invitation expirée')).toBeVisible();
		await expect(page.getByRole('link', { name: "Retour à l'accueil" })).toBeVisible();
	});

	test('le raccourci SSO part vers le bon provider en portant le token', async ({ page }) => {
		await mockApi(page, [
			{ path: '/enterprise/invite/preview', handler: json(preview()) },
			...common
		]);
		// The IDP itself is not ours to drive; what must hold is that we leave
		// for the right URL and carry the invite token along.
		await page.route('**/api/auth/google/start*', (route) =>
			route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>idp</h1>' })
		);
		await gotoHydrated(page, `/auth/invite/${TOKEN}`);

		await page.getByRole('button', { name: 'Google' }).click();
		await expect(page).toHaveURL(/\/api\/auth\/google\/start\?invite_token=inv-token-1/);
	});

	test('un candidat connecte est prevenu de la conversion avant d accepter', async ({
		page,
		context
	}) => {
		await context.addCookies([
			{ name: 'access_token', value: 'challenger', domain: 'localhost', path: '/' }
		]);
		await mockApi(page, [
			{ path: '/enterprise/invite/preview', handler: json(preview()) },
			...common
		]);
		await gotoHydrated(page, `/auth/invite/${TOKEN}`);

		// Converting a candidate hides their XP and badges; that must never be
		// silent.
		await expect(page.getByText(/perdrez l'accès aux challenges/)).toBeVisible();
		await page.getByRole('button', { name: 'Continuer et rejoindre' }).click();
		await expect(page).toHaveURL(/\/enterprise\/invite\/accept\?token=/);
	});
});
