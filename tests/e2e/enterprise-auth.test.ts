import { test, expect, type Page, type Route } from '@playwright/test';

// ─── Test helpers ────────────────────────────────────────────────

test.beforeEach(async ({ page }) => {
	// Force FR locale for deterministic text assertions (login / register copy).
	await page.addInitScript(() => {
		try {
			localStorage.setItem('skilluv-locale', 'fr');
		} catch {
			// storage may not be available in some contexts
		}
	});
});

type ApiRoute = { path: string; method?: string; handler: (route: Route) => Promise<void> | void };

async function mockApi(page: Page, routes: ApiRoute[]) {
	await page.route('**/api/**', async (route) => {
		const url = new URL(route.request().url());
		const method = route.request().method();
		const match = routes.find(
			(r) => url.pathname.endsWith(r.path) && (!r.method || r.method === method)
		);
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

function enterpriseUser(overrides: Partial<Record<string, unknown>> = {}) {
	return {
		id: 'ent-user-1',
		email: 'owner@acme.com',
		username: 'acme_owner',
		first_name: 'Alice',
		last_name: 'Owner',
		display_name: 'Alice Owner',
		role: 'enterprise',
		skill_domain: 'code',
		profile_completed: true,
		title: 'apprenti', // default gamification tier — should NOT be shown for enterprises
		golden_stars: 0,
		total_fragments: 0,
		streak_current: 0,
		trust_score: 1.0,
		country: null,
		city: null,
		bio: null,
		avatar_url: null,
		github: null,
		linkedin: null,
		website: null,
		twitter: null,
		email_verified: true,
		totp_enabled: true,
		email_2fa_enabled: false,
		profile_active: false,
		created_at: '2026-01-01T00:00:00Z',
		...overrides
	};
}

// ─── Register: 3 steps ───────────────────────────────────────────

test.describe('Enterprise register', () => {
	test('step 1 shows personal info form and OAuth options', async ({ page }) => {
		await page.goto('/enterprise/register');
		await expect(page.locator('input[autocomplete="given-name"]')).toBeVisible();
		await expect(page.locator('input[autocomplete="family-name"]')).toBeVisible();
		await expect(page.locator('input[autocomplete="username"]')).toBeVisible();
		await expect(page.locator('input[type="email"]')).toBeVisible();
		await expect(page.locator('input[type="password"]')).toBeVisible();
		// OAuth entry points still offered on the personal step
		await expect(page.getByRole('link', { name: 'Google' })).toBeVisible();
	});

	test('strict password policy is enforced client-side', async ({ page }) => {
		await page.goto('/enterprise/register');
		await page.locator('input[autocomplete="given-name"]').fill('Alice');
		await page.locator('input[autocomplete="family-name"]').fill('Owner');
		await page.locator('input[autocomplete="username"]').fill('acme_owner');
		await page.locator('input[type="email"]').fill('owner@acme.com');
		// 8 chars, no uppercase, no digit → should be rejected
		await page.locator('input[type="password"]').fill('weakpass');
		await page.getByRole('button', { name: /Continuer/i }).click();
		await expect(
			page.getByText(/Au moins 10 caractères/i).first()
		).toBeVisible();
	});

	test('valid step 1 → step 2 → terms required → step 3 with dual gate', async ({ page }) => {
		await mockApi(page, [
			{
				path: '/enterprise/register',
				method: 'POST',
				handler: (route) =>
					route.fulfill({
						status: 201,
						contentType: 'application/json',
						body: JSON.stringify({
							data: {
								user: enterpriseUser({ email_verified: false, totp_enabled: false }),
								enterprise: { id: 'ent-1', company_name: 'Acme Corp' },
								csrf_token: 'csrf-mock',
								requires_totp_setup: true,
								message: 'Enterprise account created.'
							},
							meta: { request_id: 'r1', timestamp: '' }
						})
					})
			}
		]);

		await page.goto('/enterprise/register');

		// Step 1
		await page.locator('input[autocomplete="given-name"]').fill('Alice');
		await page.locator('input[autocomplete="family-name"]').fill('Owner');
		await page.locator('input[autocomplete="username"]').fill('acme_owner');
		await page.locator('input[type="email"]').fill('owner@acme.com');
		await page.locator('input[type="password"]').fill('StrongPass123!');
		await page.getByRole('button', { name: /Continuer/i }).click();

		// Step 2 — find the company name field by placeholder (unique to step 2
		// and cheaper than fighting the label wiring of the Input component).
		const companyNameInput = page.getByPlaceholder('Skilluv Inc.');
		await expect(companyNameInput).toBeVisible({ timeout: 5000 });
		await companyNameInput.fill('Acme Corp');

		// Try to submit without terms → blocked
		await page.getByRole('button', { name: /Créer/i }).click();
		await expect(
			page.getByText(/Vous devez accepter les CGU/i)
		).toBeVisible();

		// Accept terms + submit → step 3
		await page.getByRole('checkbox').last().check(); // last checkbox = terms
		await page.getByRole('button', { name: /Créer/i }).click();

		// Step 3 — dual gate: verify email + set up 2FA
		await expect(page.getByText(/Vérifie ton email/i)).toBeVisible();
		await expect(page.getByText(/Active ton 2FA/i)).toBeVisible();
		await expect(
			page.getByRole('link', { name: /Configurer mon 2FA/i })
		).toHaveAttribute('href', /\/enterprise\/onboarding/);
	});
});

// ─── Login: role-aware redirect + navbar polish ──────────────────

test.describe('Enterprise login', () => {
	test('login as enterprise → /enterprise/dashboard (not /challenges/onboarding)', async ({ page }) => {
		await mockApi(page, [
			{
				path: '/auth/login',
				method: 'POST',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({
							data: {
								user: enterpriseUser(),
								csrf_token: 'csrf-mock',
								requires_totp_setup: false
							},
							meta: { request_id: 'r2', timestamp: '' }
						})
					})
			},
			{
				path: '/auth/me',
				method: 'GET',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({
							data: { user: enterpriseUser(), rank: { global: 0, domain: 0 } },
							meta: { request_id: 'r3', timestamp: '' }
						})
					})
			},
			{
				path: '/enterprise/profile',
				method: 'GET',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({
							data: { enterprise: { company_name: 'Acme Corp' }, member_count: 1 },
							meta: { request_id: 'r4', timestamp: '' }
						})
					})
			},
			{
				path: '/enterprise/stats',
				method: 'GET',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({
							data: {
								bookmarks: 0,
								talent_lists: 0,
								pending_requests: 0,
								accepted_requests: 0,
								conversations: 0
							},
							meta: { request_id: 'r5', timestamp: '' }
						})
					})
			}
		]);

		await page.goto('/auth/login');
		await page.locator('input[autocomplete="username"]').fill('acme_owner');
		await page.locator('input[type="password"]').fill('StrongPass123!');
		// Multiple buttons match "Se connecter" (passkey + password submit). We
		// want the form submit — target it by type.
		await page.locator('button[type="submit"]').click();

		// The old code sent enterprise/recruiter users to /challenges/onboarding,
		// the candidate onboarding page. Now the login helper picks the right
		// shell based on role.
		await page.waitForURL('**/enterprise/dashboard', { timeout: 5000 });
		expect(page.url()).toContain('/enterprise/dashboard');
	});

	test('AUTH_SSO_REQUIRED redirect uses start_url from the error payload', async ({ page }) => {
		await mockApi(page, [
			{
				path: '/auth/login',
				method: 'POST',
				handler: (route) =>
					route.fulfill({
						status: 403,
						contentType: 'application/json',
						body: JSON.stringify({
							error: {
								code: 'AUTH_SSO_REQUIRED',
								message: 'SSO login is required for this account',
								start_url: '/api/enterprise/sso/acme/start'
							},
							meta: { request_id: 'r6', timestamp: '' }
						})
					})
			},
			{
				path: '/enterprise/sso/acme/start',
				handler: (route) =>
					route.fulfill({ status: 200, contentType: 'text/plain', body: 'ok' })
			}
		]);

		await page.goto('/auth/login');
		await page.locator('input[autocomplete="username"]').fill('recruiter@acme.com');
		await page.locator('input[type="password"]').fill('SomePass123!');
		// Multiple buttons match "Se connecter" (passkey + password submit). We
		// want the form submit — target it by type.
		await page.locator('button[type="submit"]').click();

		// The page should navigate to the SSO start URL rather than showing an error.
		await page.waitForURL('**/enterprise/sso/acme/start', { timeout: 5000 });
		expect(page.url()).toContain('/enterprise/sso/acme/start');
	});
});

// ─── Navbar: no gamification badge for enterprise roles ──────────

test.describe('Enterprise UI polish', () => {
	test('enterprise navbar hides the apprenti gamification badge', async ({ page }) => {
		await mockApi(page, [
			{
				path: '/auth/me',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({
							data: { user: enterpriseUser(), rank: { global: 0, domain: 0 } },
							meta: { request_id: 'r7', timestamp: '' }
						})
					})
			}
		]);

		// Preseed auth state so the navbar renders the "signed in" branch.
		await page.addInitScript((user) => {
			(window as unknown as { __PRESEED_USER__?: unknown }).__PRESEED_USER__ = user;
		}, enterpriseUser());

		await page.goto('/');

		// The badge is a small pill with the title in uppercase. On enterprise
		// accounts it must not appear.
		const badges = page.locator('span.uppercase', { hasText: /APPRENTI/i });
		await expect(badges).toHaveCount(0);
	});
});
