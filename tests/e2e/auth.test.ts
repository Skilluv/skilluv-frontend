import { test, expect, type Page, type Route } from '@playwright/test';
import { gotoHydrated } from './utils/hydration';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Locale forcé en FR pour des assertions de texte déterministes. */
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

/** Enregistre des interceptions Playwright pour /api/**. */
async function mockApi(page: Page, routes: ApiRoute[]) {
	await page.route('**/api/**', async (route) => {
		const url = new URL(route.request().url());
		const match = routes.find((r) => url.pathname.endsWith(r.path));
		if (match) {
			await match.handler(route);
			return;
		}
		// Fallback: unhandled API calls return an empty success body
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ data: {} })
		});
	});
}

/** Submits the login form, retrying until POST /auth/login actually fires. */
async function submitLogin(page: Page) {
	const submit = page.getByRole('button', { name: 'Se connecter', exact: true });
	await expect(async () => {
		const posted = page
			.waitForRequest(
				(r) => r.url().includes('/api/auth/login') && r.method() === 'POST',
				{ timeout: 1500 }
			)
			.catch(() => null);
		await submit.click();
		expect(await posted, 'POST /auth/login fired').not.toBeNull();
	}).toPass({ timeout: 20_000 });
}

const fakeUser = {
	id: 'user-1',
	email: 'kofi@example.com',
	username: 'kofi_dev',
	first_name: 'Kofi',
	last_name: 'Mensah',
	skill_domain: 'code',
	profile_active: true,
	role: 'user'
};

// ---------------------------------------------------------------------------
// Layout (auth pages)
// ---------------------------------------------------------------------------

test.describe('Auth layout', () => {
	test('logo, footer, and no top navbar on auth pages', async ({ page }) => {
		await gotoHydrated(page, '/auth/login');
		await expect(page.getByRole('link', { name: /Skilluv/i }).first()).toBeVisible();
		await expect(page.locator('header nav')).toHaveCount(0);
		await expect(page.getByText(/Skilluv ©/)).toBeVisible();
	});

	test('logo links back to home', async ({ page }) => {
		await gotoHydrated(page, '/auth/login');
		const logo = page.locator('a[href="/"]').first();
		await expect(logo).toBeVisible();
	});
});

// ---------------------------------------------------------------------------
// Enlistment — the entrance
//
// The register flow is a sequence now (entrance → domain → trade → pact), not a
// domain grid stacked on a form. What used to be asserted here — seven cards
// and three OAuth buttons on the first screen — describes a screen that no
// longer exists. The sequence's own screens are covered in enlist.test.ts;
// what stays here is the pact, because that is where the account is created.
// ---------------------------------------------------------------------------

/** Puts a chosen domain in the tab's session, the way the wall would have. */
async function seedEnlistment(page: Page, domain = 'code') {
	await page.addInitScript((d) => {
		try {
			sessionStorage.setItem(
				'skilluv-enlist',
				JSON.stringify({ domain: d, picks: [], primary: 0 })
			);
		} catch {
			// storage might be unavailable in some contexts
		}
	}, domain);
}

test.describe('Enlistment — entrance', () => {
	test('offers exactly two ways forward', async ({ page }) => {
		await gotoHydrated(page, '/auth/register');
		await expect(page.getByTestId('enlist-start')).toBeVisible();
		await expect(page.locator('a[href="/auth/login"]').first()).toBeVisible();
	});

	test('carries no OAuth button', async ({ page }) => {
		// The shortcuts moved to the pact. On the entrance they were a fourth
		// decision on a screen whose only question is "are you new".
		await gotoHydrated(page, '/auth/register');
		await expect(page.getByRole('link', { name: 'Google' })).toHaveCount(0);
		await expect(page.getByRole('link', { name: 'LinkedIn' })).toHaveCount(0);
	});

	test('leads to the wall, keeping an enterprise invite token', async ({ page }) => {
		await gotoHydrated(page, '/auth/register?invite_token=abc123');
		await expect(page.getByTestId('enlist-start')).toHaveAttribute(
			'href',
			'/auth/register/domain?invite_token=abc123'
		);
	});
});

// ---------------------------------------------------------------------------
// Enlistment — the pact
// ---------------------------------------------------------------------------

test.describe('Enlistment — pact', () => {
	async function reachPact(page: Page) {
		await seedEnlistment(page);
		await gotoHydrated(page, '/auth/register/account');
		await expect(page.locator('input[autocomplete="username"]')).toBeVisible();
	}

	test('displays all required fields and the chosen domain', async ({ page }) => {
		await reachPact(page);
		await expect(page.locator('input[autocomplete="email"]')).toBeVisible();
		await expect(page.locator('input[autocomplete="given-name"]')).toBeVisible();
		await expect(page.locator('input[autocomplete="family-name"]')).toBeVisible();
		await expect(page.locator('input[autocomplete="new-password"]')).toBeVisible();
		await expect(page.locator('input[type="checkbox"]')).toBeVisible();
		await expect(page.getByText('Code', { exact: true }).first()).toBeVisible();
	});

	test('offers the OAuth shortcuts here, not at the entrance', async ({ page }) => {
		await reachPact(page);
		await expect(page.getByRole('link', { name: 'Google' })).toHaveAttribute(
			'href',
			'/api/auth/google/start'
		);
		await expect(page.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
			'href',
			'/api/auth/github/login'
		);
	});

	test('an invite token rides through to the OAuth shortcuts', async ({ page }) => {
		await seedEnlistment(page);
		await gotoHydrated(page, '/auth/register/account?invite_token=abc123');
		await expect(page.getByRole('link', { name: 'Google' })).toHaveAttribute(
			'href',
			'/api/auth/google/start?invite_token=abc123'
		);
	});

	test('with no domain chosen, it sends you back to the wall', async ({ page }) => {
		await gotoHydrated(page, '/auth/register/account');
		await page.waitForURL('**/auth/register/domain', { timeout: 10_000 });
	});

	test('weak password triggers a client-side error', async ({ page }) => {
		await reachPact(page);

		let called = false;
		await page.route('**/api/auth/register', (route) => {
			called = true;
			return route.fulfill({ status: 200, body: '{}' });
		});

		await page.locator('input[autocomplete="username"]').fill('kofi_dev');
		await page.locator('input[autocomplete="email"]').fill('kofi@example.com');
		await page.locator('input[autocomplete="given-name"]').fill('Kofi');
		await page.locator('input[autocomplete="family-name"]').fill('Mensah');
		await page.locator('input[autocomplete="new-password"]').fill('weak');
		await page.locator('input[type="checkbox"]').check();

		await page.getByTestId('enlist-submit').click();

		await expect(page.getByText(/Au moins 10 caractères/i)).toBeVisible();
		expect(called).toBe(false);
	});

	test('unchecked terms triggers a client-side error', async ({ page }) => {
		await reachPact(page);

		await page.locator('input[autocomplete="username"]').fill('kofi_dev');
		await page.locator('input[autocomplete="email"]').fill('kofi@example.com');
		await page.locator('input[autocomplete="given-name"]').fill('Kofi');
		await page.locator('input[autocomplete="family-name"]').fill('Mensah');
		await page.locator('input[autocomplete="new-password"]').fill('StrongPass1!');

		// Bypass the HTML required attribute so we can hit our custom validation.
		await page.locator('input[type="checkbox"]').evaluate((el) => el.removeAttribute('required'));

		await page.getByTestId('enlist-submit').click();
		await expect(
			page.getByText(/Tu dois accepter les CGU|You must accept the Terms of Service/i)
		).toBeVisible();
	});

	test('a backend refusal is shown and the account is not assumed', async ({ page }) => {
		await reachPact(page);
		await mockApi(page, [
			{
				path: '/auth/register',
				handler: (route) =>
					route.fulfill({
						status: 409,
						contentType: 'application/json',
						body: JSON.stringify({
							error: { code: 'EMAIL_ALREADY_EXISTS', message: 'Email déjà utilisé.' }
						})
					})
			}
		]);

		await page.locator('input[autocomplete="username"]').fill('kofi_dev');
		await page.locator('input[autocomplete="email"]').fill('kofi@example.com');
		await page.locator('input[autocomplete="given-name"]').fill('Kofi');
		await page.locator('input[autocomplete="family-name"]').fill('Mensah');
		await page.locator('input[autocomplete="new-password"]').fill('StrongPass1!');
		await page.locator('input[type="checkbox"]').check();

		await page.getByTestId('enlist-submit').click();

		// Either the country widget was reachable and the backend error shows, or
		// client validation stopped at the country. Both prove the account was not
		// assumed to exist.
		const backendErr = page.getByText(/Email déjà utilisé/i);
		const countryErr = page.getByText(/Sélectionne un pays|Select a country/i);
		await expect(backendErr.or(countryErr)).toBeVisible({ timeout: 5000 });
	});
});


// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

test.describe('Login', () => {
	test('renders the form fields', async ({ page }) => {
		await gotoHydrated(page, '/auth/login');
		await expect(page.locator('h1')).toBeVisible();
		await expect(page.locator('input[autocomplete="username"]')).toBeVisible();
		await expect(page.locator('input[type="password"]')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Se connecter', exact: true })).toBeVisible();
	});

	test('links to register, forgot password and magic-link', async ({ page }) => {
		await gotoHydrated(page, '/auth/login');
		await expect(page.locator('a[href="/auth/register"]')).toBeVisible();
		await expect(page.locator('a[href="/auth/forgot-password"]')).toBeVisible();
		await expect(page.locator('a[href="/auth/magic-link"]')).toBeVisible();
	});

	test('shows OAuth provider buttons', async ({ page }) => {
		await gotoHydrated(page, '/auth/login');
		await expect(page.getByRole('button', { name: /Google/i })).toBeVisible();
		await expect(page.getByRole('button', { name: /LinkedIn/i })).toBeVisible();
		await expect(page.getByRole('button', { name: /GitHub/i })).toBeVisible();
	});

	test('OAuth Google click navigates to /api/auth/google/start', async ({ page }) => {
		await page.route('**/api/auth/google/start', (route) =>
			route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>ok</body></html>' })
		);
		await gotoHydrated(page, '/auth/login');
		// The OAuth button navigates through JS, so the click is inert until
		// hydration. Retry until the URL changes.
		const google = page.getByRole('button', { name: /Google/i });
		await expect(async () => {
			await google.click();
			await expect(page).toHaveURL(/\/api\/auth\/google\/start/, { timeout: 1500 });
		}).toPass({ timeout: 20_000 });
	});

	test('successful login with active profile redirects home', async ({ page }) => {
		await mockApi(page, [
			{
				path: '/auth/login',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({ data: { user: { ...fakeUser, profile_active: true } } })
					})
			},
			{
				path: '/auth/me',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({ data: { user: fakeUser } })
					})
			}
		]);

		await gotoHydrated(page, '/auth/login');
		await page.locator('input[autocomplete="username"]').fill('kofi@example.com');
		await page.locator('input[type="password"]').fill('StrongPass1!');
		await submitLogin(page);

		await page.waitForURL((url) => url.pathname === '/', { timeout: 5000 });
	});

	test('login with inactive profile redirects to onboarding', async ({ page }) => {
		await mockApi(page, [
			{
				path: '/auth/login',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({ data: { user: { ...fakeUser, profile_active: false } } })
					})
			}
		]);

		await gotoHydrated(page, '/auth/login');
		await page.locator('input[autocomplete="username"]').fill('kofi@example.com');
		await page.locator('input[type="password"]').fill('StrongPass1!');
		await submitLogin(page);

		await page.waitForURL('**/challenges/onboarding', { timeout: 5000 });
	});

	test('TOTP challenge appears when AUTH_TOTP_REQUIRED is returned', async ({ page }) => {
		await mockApi(page, [
			{
				path: '/auth/login',
				handler: (route) =>
					route.fulfill({
						status: 401,
						contentType: 'application/json',
						body: JSON.stringify({
							error: { code: 'AUTH_TOTP_REQUIRED', message: 'TOTP required' }
						})
					})
			}
		]);

		await gotoHydrated(page, '/auth/login');
		await page.locator('input[autocomplete="username"]').fill('kofi@example.com');
		await page.locator('input[type="password"]').fill('StrongPass1!');
		await submitLogin(page);

		await expect(page.locator('input[autocomplete="one-time-code"]')).toBeVisible();
		await expect(page.getByRole('button', { name: /Utiliser un code de secours/i })).toBeVisible();
	});

	test('TOTP → backup code toggle works both ways', async ({ page }) => {
		await mockApi(page, [
			{
				path: '/auth/login',
				handler: (route) =>
					route.fulfill({
						status: 401,
						contentType: 'application/json',
						body: JSON.stringify({
							error: { code: 'AUTH_TOTP_REQUIRED', message: 'TOTP required' }
						})
					})
			}
		]);

		await gotoHydrated(page, '/auth/login');
		await page.locator('input[autocomplete="username"]').fill('kofi@example.com');
		await page.locator('input[type="password"]').fill('StrongPass1!');
		await submitLogin(page);

		await page.getByRole('button', { name: /code de secours/i }).click();
		await expect(page.getByRole('button', { name: /code TOTP/i })).toBeVisible();

		await page.getByRole('button', { name: /code TOTP/i }).click();
		await expect(page.getByRole('button', { name: /code de secours/i })).toBeVisible();
	});

	test('email 2FA challenge shows the verification code input', async ({ page }) => {
		await mockApi(page, [
			{
				path: '/auth/login',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({
							data: { requires_email_2fa: true, user_id: 'user-1' }
						})
					})
			}
		]);

		await gotoHydrated(page, '/auth/login');
		await page.locator('input[autocomplete="username"]').fill('kofi@example.com');
		await page.locator('input[type="password"]').fill('StrongPass1!');
		await submitLogin(page);

		await expect(page.getByText(/Un code a été envoyé/i)).toBeVisible();
		await expect(page.locator('input[autocomplete="one-time-code"]')).toBeVisible();
	});

	test('displays a generic error on backend failure', async ({ page }) => {
		await mockApi(page, [
			{
				path: '/auth/login',
				handler: (route) =>
					route.fulfill({
						status: 401,
						contentType: 'application/json',
						body: JSON.stringify({
							error: { code: 'AUTH_INVALID_CREDENTIALS', message: 'Identifiants invalides.' }
						})
					})
			}
		]);

		await gotoHydrated(page, '/auth/login');
		await page.locator('input[autocomplete="username"]').fill('kofi@example.com');
		await page.locator('input[type="password"]').fill('WrongPass1!');
		await submitLogin(page);

		await expect(page.getByRole('alert')).toContainText(/Identifiants invalides/i);
	});

	test('separator "or" is hidden after TOTP challenge appears', async ({ page }) => {
		await mockApi(page, [
			{
				path: '/auth/login',
				handler: (route) =>
					route.fulfill({
						status: 401,
						contentType: 'application/json',
						body: JSON.stringify({
							error: { code: 'AUTH_TOTP_REQUIRED', message: 'TOTP required' }
						})
					})
			}
		]);

		await gotoHydrated(page, '/auth/login');
		await expect(page.getByText(/^ou$/i).first()).toBeVisible();

		await page.locator('input[autocomplete="username"]').fill('kofi@example.com');
		await page.locator('input[type="password"]').fill('StrongPass1!');
		await submitLogin(page);

		await expect(page.locator('input[autocomplete="one-time-code"]')).toBeVisible();
		// OAuth buttons disappear during 2FA flows
		await expect(page.getByRole('button', { name: /Google/i })).toHaveCount(0);
	});
});

// ---------------------------------------------------------------------------
// Forgot password
// ---------------------------------------------------------------------------

test.describe('Forgot password', () => {
	test('renders the email form', async ({ page }) => {
		await gotoHydrated(page, '/auth/forgot-password');
		await expect(page.locator('h1')).toBeVisible();
		await expect(page.locator('input[type="email"]')).toBeVisible();
		await expect(page.getByRole('button', { name: /Envoyer le lien/i })).toBeVisible();
	});

	test('back-to-login link is present', async ({ page }) => {
		await gotoHydrated(page, '/auth/forgot-password');
		await expect(page.locator('a[href="/auth/login"]')).toBeVisible();
	});

	test('shows the success state after submission', async ({ page }) => {
		await mockApi(page, [
			{
				path: '/auth/forgot-password',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({ data: { message: 'ok' } })
					})
			}
		]);

		await gotoHydrated(page, '/auth/forgot-password');
		await page.locator('input[type="email"]').fill('kofi@example.com');
		await page.getByRole('button', { name: /Envoyer le lien/i }).click();

		await expect(page.getByText(/Email envoyé/i)).toBeVisible();
		await expect(page.getByRole('link', { name: /Retour à la connexion/i })).toBeVisible();
	});

	test('shows a generic error when the backend fails', async ({ page }) => {
		await mockApi(page, [
			{
				path: '/auth/forgot-password',
				handler: (route) =>
					route.fulfill({
						status: 500,
						contentType: 'application/json',
						body: JSON.stringify({
							error: { code: 'INTERNAL', message: 'boom' }
						})
					})
			}
		]);

		await gotoHydrated(page, '/auth/forgot-password');
		await page.locator('input[type="email"]').fill('kofi@example.com');
		await page.getByRole('button', { name: /Envoyer le lien/i }).click();

		await expect(page.getByRole('alert')).toBeVisible();
	});
});

// ---------------------------------------------------------------------------
// Reset password
// ---------------------------------------------------------------------------

test.describe('Reset password', () => {
	test('renders the new-password form when a token is provided', async ({ page }) => {
		await gotoHydrated(page, '/auth/reset-password?token=abc123');
		await expect(page.locator('h1')).toContainText(/Nouveau mot de passe/i);
		await expect(page.locator('input[autocomplete="new-password"]')).toHaveCount(2);
	});

	test('mismatched passwords show an error', async ({ page }) => {
		await gotoHydrated(page, '/auth/reset-password?token=abc123');
		const inputs = page.locator('input[autocomplete="new-password"]');
		await inputs.nth(0).fill('StrongPass1!');
		await inputs.nth(1).fill('OtherPass1!');
		await page.getByRole('button', { name: /Changer le mot de passe/i }).click();
		await expect(page.getByText(/ne correspondent pas/i)).toBeVisible();
	});

	test('too-short password shows an error', async ({ page }) => {
		await gotoHydrated(page, '/auth/reset-password?token=abc123');
		const inputs = page.locator('input[autocomplete="new-password"]');
		await inputs.nth(0).fill('short');
		await inputs.nth(1).fill('short');
		// Purely client-side validation: without hydration the click does nothing.
		const submit = page.getByRole('button', { name: /Changer le mot de passe/i });
		await expect(async () => {
			await submit.click();
			await expect(page.getByRole('alert')).toBeVisible({ timeout: 1500 });
		}).toPass({ timeout: 20_000 });
	});

	test('missing token shows the invalid-link error', async ({ page }) => {
		await gotoHydrated(page, '/auth/reset-password');
		const inputs = page.locator('input[autocomplete="new-password"]');
		await inputs.nth(0).fill('StrongPass1!');
		await inputs.nth(1).fill('StrongPass1!');
		await page.getByRole('button', { name: /Changer le mot de passe/i }).click();
		await expect(page.getByText(/Lien invalide/i)).toBeVisible();
	});

	test('successful reset shows the success state and redirects', async ({ page }) => {
		await mockApi(page, [
			{
				path: '/auth/reset-password',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({ data: { message: 'ok' } })
					})
			}
		]);

		await gotoHydrated(page, '/auth/reset-password?token=abc123');
		const inputs = page.locator('input[autocomplete="new-password"]');
		await inputs.nth(0).fill('StrongPass1!');
		await inputs.nth(1).fill('StrongPass1!');
		await page.getByRole('button', { name: /Changer le mot de passe/i }).click();

		await expect(page.getByText(/Mot de passe modifié/i)).toBeVisible();
	});

	test('backend error is displayed on invalid/expired token', async ({ page }) => {
		await mockApi(page, [
			{
				path: '/auth/reset-password',
				handler: (route) =>
					route.fulfill({
						status: 400,
						contentType: 'application/json',
						body: JSON.stringify({
							error: { code: 'TOKEN_EXPIRED', message: 'Token expiré.' }
						})
					})
			}
		]);

		await gotoHydrated(page, '/auth/reset-password?token=abc123');
		const inputs = page.locator('input[autocomplete="new-password"]');
		await inputs.nth(0).fill('StrongPass1!');
		await inputs.nth(1).fill('StrongPass1!');
		await page.getByRole('button', { name: /Changer le mot de passe/i }).click();

		await expect(page.getByText(/Token expiré/i)).toBeVisible();
	});
});

// ---------------------------------------------------------------------------
// Magic link — request
// ---------------------------------------------------------------------------

test.describe('Magic link (request)', () => {
	test('renders the form with intent tabs and email input', async ({ page }) => {
		await gotoHydrated(page, '/auth/magic-link');
		await expect(page.locator('h1')).toBeVisible();
		await expect(page.getByRole('button', { name: /^Connexion$/i })).toBeVisible();
		await expect(page.getByRole('button', { name: /^Inscription$/i })).toBeVisible();
		await expect(page.locator('input[type="email"]')).toBeVisible();
	});

	test('submit button is disabled when email is empty', async ({ page }) => {
		await gotoHydrated(page, '/auth/magic-link');
		const submit = page.getByRole('button', { name: /M'envoyer un lien/i });
		await expect(submit).toBeDisabled();
	});

	test('toggling the intent tab changes the submit label', async ({ page }) => {
		await gotoHydrated(page, '/auth/magic-link');
		await page.locator('input[type="email"]').fill('kofi@example.com');
		await expect(page.getByRole('button', { name: /lien de connexion/i })).toBeVisible();

		await page.getByRole('button', { name: /^Inscription$/i }).click();
		await expect(page.getByRole('button', { name: /créer un compte/i })).toBeVisible();
	});

	test('successful request shows the "check your inbox" state', async ({ page }) => {
		await mockApi(page, [
			{
				path: '/auth/magic-link/request',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({ data: { expires_in_minutes: 15 } })
					})
			}
		]);

		await gotoHydrated(page, '/auth/magic-link');
		await page.locator('input[type="email"]').fill('kofi@example.com');
		await page.getByRole('button', { name: /M'envoyer un lien/i }).click();

		await expect(page.getByText(/Regarde ta boîte/i)).toBeVisible();
		await expect(page.getByText(/kofi@example\.com/)).toBeVisible();
		await expect(page.getByText(/15 minutes/)).toBeVisible();
	});
});

// ---------------------------------------------------------------------------
// Magic link — consume
// ---------------------------------------------------------------------------

test.describe('Magic link (consume)', () => {
	test('missing token shows the error state', async ({ page }) => {
		await gotoHydrated(page, '/auth/magic-link/consume');
		await expect(page.getByText(/Lien invalide/i)).toBeVisible();
		await expect(page.getByText(/Aucun token/i)).toBeVisible();
	});

	test('valid token → success state then redirect', async ({ page }) => {
		await mockApi(page, [
			{
				path: '/auth/magic-link/consume',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({ data: { user: fakeUser } })
					})
			},
			{
				path: '/auth/me',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({ data: { user: fakeUser } })
					})
			}
		]);

		await gotoHydrated(page, '/auth/magic-link/consume?token=abc123&intent=login');
		await expect(page.getByText(/Bienvenue/i)).toBeVisible({ timeout: 5000 });
		await page.waitForURL((url) => url.pathname === '/', { timeout: 5000 });
	});

	test('signup intent redirects to onboarding after consume', async ({ page }) => {
		// A signup magic link always leads to an inactive account: it is
		// `profile_active: false` that routes to onboarding through
		// postLoginDestination(). The previous version mocked an already active
		// account while expecting onboarding, an impossible scenario.
		const freshUser = { ...fakeUser, profile_active: false };
		await mockApi(page, [
			{
				path: '/auth/magic-link/consume',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({ data: { user: freshUser } })
					})
			},
			{
				path: '/auth/me',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({ data: { user: freshUser } })
					})
			}
		]);

		await gotoHydrated(page, '/auth/magic-link/consume?token=abc123&intent=signup');
		await page.waitForURL('**/challenges/onboarding', { timeout: 5000 });
	});

	test('invalid token shows the error state with recovery buttons', async ({ page }) => {
		await mockApi(page, [
			{
				path: '/auth/magic-link/consume',
				handler: (route) =>
					route.fulfill({
						status: 400,
						contentType: 'application/json',
						body: JSON.stringify({
							error: { code: 'TOKEN_INVALID', message: 'Lien invalide ou expiré' }
						})
					})
			}
		]);

		await gotoHydrated(page, '/auth/magic-link/consume?token=bad');
		await expect(page.getByText(/Lien invalide ou expiré/i)).toBeVisible({ timeout: 5000 });
		await expect(page.getByRole('link', { name: /Nouveau lien/i })).toBeVisible();
		await expect(page.getByRole('link', { name: /Mot de passe/i })).toBeVisible();
	});
});

// ---------------------------------------------------------------------------
// Verify email
// ---------------------------------------------------------------------------

test.describe('Verify email', () => {
	test('missing token shows the error state', async ({ page }) => {
		await gotoHydrated(page, '/auth/verify-email');
		await expect(page.getByText(/Lien de vérification invalide/i)).toBeVisible();
	});

	test('valid token shows the success state with a login button', async ({ page }) => {
		await mockApi(page, [
			{
				path: '/auth/verify-email',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({ data: { message: 'Email vérifié avec succès.' } })
					})
			}
		]);

		await gotoHydrated(page, '/auth/verify-email?token=abc123');
		// Both the heading and the backend message contain "Email verifie", so
		// anchor on the heading to stay unambiguous.
		await expect(page.getByRole('heading', { name: /Email vérifié/i })).toBeVisible({
			timeout: 5000
		});
		await expect(page.getByText(/Email vérifié avec succès/i)).toBeVisible();
		await expect(page.getByRole('link', { name: /Se connecter/i })).toBeVisible();
	});

	test('invalid token shows the error state', async ({ page }) => {
		await mockApi(page, [
			{
				path: '/auth/verify-email',
				handler: (route) =>
					route.fulfill({
						status: 400,
						contentType: 'application/json',
						body: JSON.stringify({
							error: { code: 'TOKEN_INVALID', message: 'Token invalide.' }
						})
					})
			}
		]);

		await gotoHydrated(page, '/auth/verify-email?token=bad');
		await expect(page.getByText(/Token invalide/i)).toBeVisible({ timeout: 5000 });
		await expect(page.getByRole('link', { name: /Retour à la connexion/i })).toBeVisible();
	});
});

// ---------------------------------------------------------------------------
// Change-email confirm
// ---------------------------------------------------------------------------

test.describe('Change email confirmation', () => {
	test('missing token shows the error state', async ({ page }) => {
		await gotoHydrated(page, '/auth/change-email/confirm');
		await expect(page.getByText(/Lien invalide/i)).toBeVisible();
	});

	test('valid token shows the confirmation and a sign-in-again button', async ({ page }) => {
		await mockApi(page, [
			{
				path: '/auth/change-email/confirm',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({ data: { message: 'Ton email a été mis à jour.' } })
					})
			}
		]);

		await gotoHydrated(page, '/auth/change-email/confirm?token=abc123');
		await expect(page.getByText(/Email confirmé/i)).toBeVisible({ timeout: 5000 });
		await expect(page.getByRole('button', { name: /Se reconnecter/i })).toBeVisible();
	});

	test('invalid token shows the error state with a back button', async ({ page }) => {
		await mockApi(page, [
			{
				path: '/auth/change-email/confirm',
				handler: (route) =>
					route.fulfill({
						status: 400,
						contentType: 'application/json',
						body: JSON.stringify({
							error: { code: 'TOKEN_EXPIRED', message: 'Lien expiré.' }
						})
					})
			}
		]);

		await gotoHydrated(page, '/auth/change-email/confirm?token=bad');
		await expect(page.getByRole('heading', { name: /Erreur/i })).toBeVisible({ timeout: 5000 });
		await expect(page.getByText(/Lien expiré/i)).toBeVisible();
		await expect(page.getByRole('button', { name: /Retour/i })).toBeVisible();
	});
});
