/**
 * S6.9 (SKI-53) — /enterprise/settings/sso: IdP configuration and SCIM.
 *
 * Two guards deserve pinning. The client secret is never pre-filled from the
 * backend, and updating an existing config forces the operator to re-enter it:
 * a blank field must not be posted as an empty secret and lock everyone out.
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

const CONFIG = {
	issuer: 'https://tenant.okta.com',
	client_id: '0oa1abc23DEF4gh5i6j7',
	email_domains: ['acme.io'],
	enforce_sso: false,
	auto_provision: true,
	default_role: 'recruiter'
};

function configResponse(config: unknown) {
	return {
		data: { config, redirect_uri: 'https://skill-uv.com/api/enterprise/sso/callback' },
		meta: { request_id: 'r', timestamp: '2026-08-12' }
	};
}

const common: ApiRoute[] = [
	{ path: '/users/me/capabilities', handler: json({ data: [] }) },
	{ path: '/users/me/orientations', handler: json({ data: [] }) }
];

test.beforeEach(async ({ page, context }) => {
	await page.addInitScript(() => {
		try {
			localStorage.setItem('skilluv-locale', 'fr');
		} catch {
			/* storage unavailable */
		}
	});
	await context.addCookies([
		{ name: 'access_token', value: 'owner', domain: 'localhost', path: '/' }
	]);
});

test.describe('S6.9 enterprise SSO configuration', () => {
	test('une config existante est prefillee, sauf le secret', async ({ page }) => {
		await mockApi(page, [
			{ path: '/enterprise/sso/config', handler: json(configResponse(CONFIG)) },
			...common
		]);
		await gotoHydrated(page, '/enterprise/settings/sso');

		await expect(page.getByLabel('Issuer OIDC')).toHaveValue('https://tenant.okta.com');
		await expect(page.getByLabel('Client ID')).toHaveValue('0oa1abc23DEF4gh5i6j7');
		// The backend redacts it; showing anything here would be a lie.
		await expect(page.getByLabel('Client Secret')).toHaveValue('');
	});

	test('mettre a jour sans re-saisir le secret est refuse', async ({ page }) => {
		let posts = 0;
		await mockApi(page, [
			{
				path: '/enterprise/sso/config',
				handler: (route) => {
					if (route.request().method() === 'POST') posts++;
					return json(configResponse(CONFIG))(route);
				}
			},
			...common
		]);
		await gotoHydrated(page, '/enterprise/settings/sso');

		await page.getByRole('button', { name: 'Mettre à jour' }).click();

		await expect(page.getByText(/Ré-entre le client_secret/)).toBeVisible();
		expect(posts).toBe(0);
	});

	test('une premiere configuration est postee telle quelle', async ({ page }) => {
		let sent: Record<string, unknown> | null = null;
		await mockApi(page, [
			{
				path: '/enterprise/sso/config',
				handler: (route) => {
					if (route.request().method() === 'POST') {
						sent = route.request().postDataJSON();
						return json(configResponse(CONFIG))(route);
					}
					return json(configResponse(null))(route);
				}
			},
			...common
		]);
		await gotoHydrated(page, '/enterprise/settings/sso');

		await page.getByLabel('Issuer OIDC').fill('https://tenant.okta.com');
		await page.getByLabel('Client ID').fill('0oa1abc23DEF4gh5i6j7');
		await page.getByLabel('Client Secret').fill('s3cr3t');
		await page.getByPlaceholder('acme.com, acme.fr').fill('acme.io, acme.fr');
		await page.getByRole('button', { name: 'Enregistrer' }).click();

		await expect.poll(() => sent).not.toBeNull();
		expect(sent).toMatchObject({
			issuer: 'https://tenant.okta.com',
			client_id: '0oa1abc23DEF4gh5i6j7',
			client_secret: 's3cr3t',
			email_domains: ['acme.io', 'acme.fr']
		});
	});

	test('sans domaine email, rien n est poste', async ({ page }) => {
		let posts = 0;
		await mockApi(page, [
			{
				path: '/enterprise/sso/config',
				handler: (route) => {
					if (route.request().method() === 'POST') posts++;
					return json(configResponse(null))(route);
				}
			},
			...common
		]);
		await gotoHydrated(page, '/enterprise/settings/sso');

		await page.getByLabel('Issuer OIDC').fill('https://tenant.okta.com');
		await page.getByLabel('Client ID').fill('id');
		await page.getByLabel('Client Secret').fill('s3cr3t');
		await page.getByRole('button', { name: 'Enregistrer' }).click();

		// Without a domain nobody could ever be routed to this IdP.
		await expect(page.getByText(/Au moins un domaine email est requis/)).toBeVisible();
		expect(posts).toBe(0);
	});

	test('desactiver le SSO demande confirmation', async ({ page }) => {
		let deletes = 0;
		await mockApi(page, [
			{
				path: '/enterprise/sso/config',
				handler: (route) => {
					if (route.request().method() === 'DELETE') {
						deletes++;
						return json({ data: { disabled: true } })(route);
					}
					return json(configResponse(CONFIG))(route);
				}
			},
			...common
		]);
		await gotoHydrated(page, '/enterprise/settings/sso');

		page.once('dialog', (d) => d.dismiss());
		await page.getByRole('button', { name: /Désactiver/i }).first().click();
		await page.waitForTimeout(400);
		expect(deletes).toBe(0);

		page.once('dialog', (d) => d.accept());
		await page.getByRole('button', { name: /Désactiver/i }).first().click();
		await expect.poll(() => deletes).toBe(1);
	});
});
