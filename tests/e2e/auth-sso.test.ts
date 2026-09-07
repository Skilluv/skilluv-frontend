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
			// The shortcuts now live on the pact, the last screen of the
			// enlistment, which needs a class already chosen to render. Seeding one
			// puts us there without walking the fresco, which has its own spec.
			// Only when absent. `addInitScript` runs on every document, so seeding
			// unconditionally resets the tab's enlistment on each navigation —
			// which would quietly undo anything a test is trying to observe
			// across one, the SSO departure included.
			if (!sessionStorage.getItem('skilluv-enlist')) {
				sessionStorage.setItem(
					'skilluv-enlist',
					JSON.stringify({ domain: 'code', picks: [], primary: 0 })
				);
			}
		} catch {
			/* storage unavailable */
		}
	});
});

test.describe('SKI-49 SSO departure', () => {
	test('l inscription expose les trois providers sur leurs URL de depart', async ({ page }) => {
		await mockApi(page, common);
		await gotoHydrated(page, '/auth/register/account');

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
		await gotoHydrated(page, '/auth/register/account?invite_token=inv-42');

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

	test('partir en SSO enregistre le depart, pour que le retour sache quoi finir', async ({
		page
	}) => {
		await mockApi(page, common);
		await gotoHydrated(page, '/auth/register/account');

		// The link stays a link and the click is real — the OAuth start is a
		// server redirect. Only the provider is stubbed, and with a page on this
		// origin rather than an abort: an aborted navigation lands on
		// chrome-error://, where reading sessionStorage is a SecurityError and
		// the test fails for a reason that has nothing to do with the feature.
		await page.route('**/api/auth/google/start*', (route) =>
			route.fulfill({ status: 200, contentType: 'text/html', body: '<p>provider</p>' })
		);
		await page.getByRole('link', { name: 'Google' }).click();
		await page.waitForURL(/\/api\/auth\/google\/start/);

		const pending = await page.evaluate(() => {
			const raw = sessionStorage.getItem('skilluv-enlist');
			return raw ? (JSON.parse(raw) as { ssoPending?: boolean }).ssoPending : null;
		});
		expect(pending).toBe(true);
	});

	test('au retour dune inscription SSO, le terrain deja choisi nest pas redemande', async ({
		page,
		context
	}) => {
		await page.addInitScript(() => {
			sessionStorage.setItem(
				'skilluv-enlist',
				JSON.stringify({
					domain: 'code',
					picks: [{ slug: 'backend-developer', name: 'Backend Developer', mode: 'learning' }],
					primary: 0,
					ssoPending: true
				})
			);
		});
		await context.addCookies([
			{ name: 'access_token', value: 'challenger', domain: 'localhost', path: '/' }
		]);
		await mockApi(page, common);

		await gotoHydrated(page, '/onboarding/complete-profile');

		// Step 2, not step 1. The ground was chosen on the fresco; this screen
		// only offers seven of the eleven disciplines, so a second answer could
		// not even have matched the first.
		await expect(page.getByRole('checkbox')).toBeVisible();
		await expect(page.getByText(/Choisis ton terrain|Pick your ground/i)).toHaveCount(0);
	});

	test('les metiers sont postes apres la completion du profil, pas avant', async ({
		page,
		context
	}) => {
		await page.addInitScript(() => {
			sessionStorage.setItem(
				'skilluv-enlist',
				JSON.stringify({
					domain: 'code',
					picks: [
						{ slug: 'backend-developer', name: 'Backend Developer', mode: 'learning' },
						{ slug: 'frontend-developer', name: 'Frontend Developer', mode: 'active' }
					],
					primary: 1,
					ssoPending: true
				})
			);
		});
		await context.addCookies([
			{ name: 'access_token', value: 'challenger', domain: 'localhost', path: '/' }
		]);

		// The order is the whole point: an SSO account starts incomplete, and an
		// incomplete account is refused on every write — including the
		// orientations. Posting them first would 4xx and lose the trades for good.
		const calls: string[] = [];
		await mockApi(page, [
			{
				path: '/auth/complete-profile',
				handler: (route) => {
					calls.push('complete-profile');
					return json({ data: { message: 'ok' } })(route);
				}
			},
			{
				path: '/users/me/orientations',
				handler: (route) => {
					if (route.request().method() === 'POST') calls.push(route.request().postDataJSON().orientation_slug);
					return json({ data: {} })(route);
				}
			},
			...common
		]);

		await gotoHydrated(page, '/onboarding/complete-profile');
		await page.getByRole('checkbox').check();
		await page.getByRole('button', { name: /Terminer|Finish|Continuer/i }).first().click();

		await expect.poll(() => calls.length, { timeout: 10_000 }).toBe(3);
		expect(calls).toEqual(['complete-profile', 'backend-developer', 'frontend-developer']);

		// Done once. Left standing, the flag would re-post on the next visit to
		// an account that already carries the trades.
		await expect
			.poll(() => page.evaluate(() => sessionStorage.getItem('skilluv-enlist')))
			.toBeNull();
	});

	test('sans depart SSO enregistre, completer un profil ne poste aucun metier', async ({
		page,
		context
	}) => {
		// The same storage, minus the flag: somebody who abandoned the signup and
		// then signed into an existing account in the same tab. They did not ask
		// for those trades.
		await page.addInitScript(() => {
			sessionStorage.setItem(
				'skilluv-enlist',
				JSON.stringify({
					domain: 'code',
					picks: [{ slug: 'backend-developer', name: 'Backend Developer', mode: 'learning' }],
					primary: 0
				})
			);
		});
		await context.addCookies([
			{ name: 'access_token', value: 'challenger', domain: 'localhost', path: '/' }
		]);

		let posted = 0;
		await mockApi(page, [
			{ path: '/auth/complete-profile', handler: json({ data: { message: 'ok' } }) },
			{
				path: '/users/me/orientations',
				handler: (route) => {
					if (route.request().method() === 'POST') posted++;
					return json({ data: [] })(route);
				}
			},
			...common
		]);

		await gotoHydrated(page, '/onboarding/complete-profile');
		// Step 1 this time, since nothing was chosen on a fresco.
		await page.getByRole('button', { name: /Code/i }).first().click();
		await page.getByRole('checkbox').check();
		await page.getByRole('button', { name: /Terminer|Finish|Continuer/i }).first().click();

		await page.waitForTimeout(1500);
		expect(posted).toBe(0);
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
