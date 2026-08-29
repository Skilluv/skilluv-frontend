/**
 * SKI-49 — SSO / OAuth, front side.
 *
 * Decision recorded on the ticket: the IDP round-trip (Google, LinkedIn,
 * GitHub) is not driven from the suite. Those screens belong to third parties,
 * carry MFA and captchas, and Google actively blocks automated consent, so a
 * test there would be flaky for zero information about our own code. The
 * callback is handled entirely by the backend, which sets the session cookies
 * and redirects.
 *
 * What is ours, and what is tested here: leaving for the right URL, carrying
 * the invite token when there is one, and surfacing the enterprise SSO entry
 * when the backend says the email is federated.
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

test.describe('SKI-49 SSO departure', () => {
	test('l inscription expose les trois providers sur leurs URL de depart', async ({ page }) => {
		await mockApi(page, common);
		await gotoHydrated(page, '/auth/register');

		await expect(page.getByRole('link', { name: 'Google' })).toHaveAttribute(
			'href',
			'/api/auth/google/start'
		);
		await expect(page.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
			'href',
			'/api/auth/linkedin/start'
		);
		// GitHub is the odd one out on the backend: /login, not /start.
		await expect(page.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
			'href',
			'/api/auth/github/login'
		);
	});

	test('un invite_token en URL est propage sur les trois providers', async ({ page }) => {
		await mockApi(page, common);
		await gotoHydrated(page, '/auth/register?invite_token=inv-42');

		// Losing the token here would create an orphan account instead of
		// consuming the invitation.
		await expect(page.getByRole('link', { name: 'Google' })).toHaveAttribute(
			'href',
			'/api/auth/google/start?invite_token=inv-42'
		);
		await expect(page.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
			'href',
			'/api/auth/linkedin/start?invite_token=inv-42'
		);
		await expect(page.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
			'href',
			'/api/auth/github/login?invite_token=inv-42'
		);
	});

	test('un email federe fait apparaitre l entree SSO entreprise', async ({ page }) => {
		await mockApi(page, [
			{
				path: '/enterprise/sso/discover',
				handler: json({
					data: { sso_available: true, start_url: '/api/enterprise/sso/start?domain=acme.io' }
				})
			},
			...common
		]);
		await gotoHydrated(page, '/auth/login');

		await page.getByLabel("Email ou nom d'utilisateur").fill('recruteur@acme.io');
		await expect(
			page.getByRole('link', { name: 'Se connecter via le SSO de ton entreprise' })
		).toHaveAttribute('href', '/api/enterprise/sso/start?domain=acme.io');
	});

	test('un email non federe ne propose pas de SSO entreprise', async ({ page }) => {
		await mockApi(page, [
			{
				path: '/enterprise/sso/discover',
				handler: json({ data: { sso_available: false, start_url: null } })
			},
			...common
		]);
		await gotoHydrated(page, '/auth/login');

		await page.getByLabel("Email ou nom d'utilisateur").fill('kofi@gmail.com');
		await page.waitForTimeout(1000);
		await expect(
			page.getByRole('link', { name: 'Se connecter via le SSO de ton entreprise' })
		).toHaveCount(0);
	});
});
