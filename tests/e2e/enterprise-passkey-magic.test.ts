import { test, expect, type Page, type Route } from '@playwright/test';

// Cover the two secondary login paths for enterprise accounts — passkey and
// magic link. The real ceremonies (WebAuthn, email delivery) are out of scope
// for a browser E2E; we mock everything at the network boundary and shim the
// WebAuthn browser API where necessary, then assert the important thing: the
// post-login redirect + session labeling reach `/enterprise/dashboard`
// instead of the candidate onboarding page.

test.beforeEach(async ({ page }) => {
	await page.addInitScript(() => {
		try {
			localStorage.setItem('skilluv-locale', 'fr');
		} catch {
			/* ignore */
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
		id: 'ent-1',
		email: 'owner@acme.com',
		username: 'acme_owner',
		first_name: 'Alice',
		last_name: 'Owner',
		display_name: 'Alice Owner',
		role: 'enterprise',
		skill_domain: 'code',
		profile_completed: true,
		title: 'apprenti',
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

// ─── Passkey login as strong factor (bypasses mandatory TOTP) ────

test.describe('Enterprise passkey bypasses TOTP', () => {
	test('enterprise passkey user without TOTP still lands on /enterprise/dashboard', async ({
		page
	}) => {
		// Same passkey shim as the main test.
		await page.addInitScript(() => {
			const fake = {
				id: 'fake',
				rawId: new ArrayBuffer(16),
				type: 'public-key',
				response: {
					authenticatorData: new ArrayBuffer(37),
					clientDataJSON: new TextEncoder().encode('{}').buffer,
					signature: new ArrayBuffer(64),
					userHandle: new ArrayBuffer(16)
				},
				getClientExtensionResults: () => ({}),
				toJSON: () => ({
					id: 'fake',
					rawId: 'AA',
					type: 'public-key',
					response: { authenticatorData: 'AA', clientDataJSON: 'AA', signature: 'AA', userHandle: 'AA' },
					clientExtensionResults: {}
				})
			};
			Object.defineProperty(window, 'PublicKeyCredential', {
				configurable: true,
				value: class {
					static isUserVerifyingPlatformAuthenticatorAvailable() {
						return Promise.resolve(true);
					}
				}
			});
			Object.defineProperty(navigator, 'credentials', {
				configurable: true,
				value: { get: () => Promise.resolve(fake), create: () => Promise.resolve(fake) }
			});
		});

		await mockApi(page, [
			{
				path: '/auth/webauthn/login/start',
				method: 'POST',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({
							data: {
								ceremony_handle: 'c1',
								publicKey: { challenge: 'YWJj', timeout: 60000, rpId: 'localhost', allowCredentials: [], userVerification: 'preferred' }
							},
							meta: { request_id: 'r1', timestamp: '' }
						})
					})
			},
			{
				path: '/auth/webauthn/login/finish',
				method: 'POST',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({
							data: {
								// Critical: totp_enabled=false. The old client-side guard
								// would have redirected to /settings/security ; the new
								// one honours login_method='webauthn' as a strong factor.
								user: enterpriseUser({ totp_enabled: false }),
								csrf_token: 'csrf',
								auth_method: 'passkey',
								login_method: 'webauthn'
							},
							meta: { request_id: 'r2', timestamp: '' }
						})
					})
			},
			{
				path: '/auth/me',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({
							data: {
								user: enterpriseUser({ totp_enabled: false }),
								login_method: 'webauthn',
								rank: { global: 0, domain: 0 }
							},
							meta: { request_id: 'r3', timestamp: '' }
						})
					})
			}
		]);

		await page.goto('/auth/login');
		await page.locator('input[autocomplete="username"]').fill('acme_owner');
		await page.getByRole('button', { name: /Se connecter avec une passkey/i }).click();

		// If the guard mistakenly runs, we'd end up at /settings/security. The
		// dashboard URL is the load-bearing assertion here.
		await page.waitForURL('**/enterprise/dashboard', { timeout: 5000 });
		expect(page.url()).toContain('/enterprise/dashboard');
	});
});

// ─── Passkey login ───────────────────────────────────────────────

test.describe('Enterprise passkey login', () => {
	test('successful passkey login lands enterprise on /enterprise/dashboard', async ({ page }) => {
		// Shim the WebAuthn browser API before any script on the page runs.
		// Real ceremonies talk to navigator.credentials.get() which returns a
		// PublicKeyCredential. Playwright ships without a virtual authenticator
		// by default, so we hand back a canned assertion — the backend accepts
		// anything since we mock /auth/webauthn/login/finish.
		await page.addInitScript(() => {
			const fakeAssertion = {
				id: 'fake-cred-id',
				rawId: new ArrayBuffer(16),
				type: 'public-key',
				response: {
					authenticatorData: new ArrayBuffer(37),
					clientDataJSON: new TextEncoder().encode(
						JSON.stringify({ type: 'webauthn.get', challenge: 'abc', origin: 'x' })
					).buffer,
					signature: new ArrayBuffer(64),
					userHandle: new ArrayBuffer(16)
				},
				clientExtensionResults: () => ({}),
				getClientExtensionResults: () => ({}),
				toJSON: () => ({
					id: 'fake-cred-id',
					rawId: 'ZmFrZS1jcmVkLWlk',
					type: 'public-key',
					response: {
						authenticatorData: 'AA',
						clientDataJSON: 'AA',
						signature: 'AA',
						userHandle: 'AA'
					},
					clientExtensionResults: {}
				})
			};
			Object.defineProperty(window, 'PublicKeyCredential', {
				configurable: true,
				value: class {
					static isUserVerifyingPlatformAuthenticatorAvailable() {
						return Promise.resolve(true);
					}
				}
			});
			Object.defineProperty(navigator, 'credentials', {
				configurable: true,
				value: {
					get: () => Promise.resolve(fakeAssertion),
					create: () => Promise.resolve(fakeAssertion)
				}
			});
		});

		await mockApi(page, [
			{
				path: '/auth/webauthn/login/start',
				method: 'POST',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({
							data: {
								ceremony_handle: 'ceremony-1',
								publicKey: {
									challenge: 'YWJj', // base64url("abc")
									timeout: 60000,
									rpId: 'localhost',
									allowCredentials: [],
									userVerification: 'preferred'
								}
							},
							meta: { request_id: 'r1', timestamp: '' }
						})
					})
			},
			{
				path: '/auth/webauthn/login/finish',
				method: 'POST',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({
							data: {
								user: enterpriseUser(),
								csrf_token: 'csrf-mock',
								auth_method: 'passkey'
							},
							meta: { request_id: 'r2', timestamp: '' }
						})
					})
			},
			{
				path: '/auth/me',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({
							data: { user: enterpriseUser(), rank: { global: 0, domain: 0 } },
							meta: { request_id: 'r3', timestamp: '' }
						})
					})
			}
		]);

		await page.goto('/auth/login');
		await page.locator('input[autocomplete="username"]').fill('acme_owner');
		// Passkey button lives just above the OAuth providers in the layout.
		await page.getByRole('button', { name: /Se connecter avec une passkey/i }).click();

		await page.waitForURL('**/enterprise/dashboard', { timeout: 5000 });
		expect(page.url()).toContain('/enterprise/dashboard');
	});
});

// ─── Magic link consume ──────────────────────────────────────────

test.describe('Enterprise magic link', () => {
	test('consuming a magic link as an enterprise user lands on the dashboard', async ({ page }) => {
		// The consume page (`/auth/magic-link/consume`) reads the token from the
		// URL and calls the backend to finalise the login. On success it
		// redirects like the regular login handler.
		await mockApi(page, [
			{
				path: '/auth/magic-link/consume',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({
							data: {
								user: enterpriseUser(),
								csrf_token: 'csrf-mock',
								auth_method: 'magic_link'
							},
							meta: { request_id: 'r4', timestamp: '' }
						})
					})
			},
			{
				path: '/auth/me',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({
							data: { user: enterpriseUser(), rank: { global: 0, domain: 0 } },
							meta: { request_id: 'r5', timestamp: '' }
						})
					})
			}
		]);

		await page.goto('/auth/magic-link/consume?token=fake-magic-token');

		await page.waitForURL('**/enterprise/dashboard', { timeout: 5000 });
		expect(page.url()).toContain('/enterprise/dashboard');
	});
});
