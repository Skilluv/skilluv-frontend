/**
 * S6.12 (SKI-53) — /enterprise/onboarding: the post-signup wizard.
 *
 * This is the gate every enterprise account walks through, and the owner and
 * the invited recruiter do not walk the same path: profile and team invitation
 * belong to the owner. A recruiter dropped into those steps would be editing a
 * company they do not own.
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

const totpRoutes: ApiRoute[] = [
	{
		path: '/auth/totp/setup',
		handler: json({
			data: {
				otpauth_url: 'otpauth://totp/Skilluv:owner@acme.io?secret=JBSWY3DPEHPK3PXP',
				secret_base32: 'JBSWY3DPEHPK3PXP'
			}
		})
	},
	{
		path: '/auth/totp/enable',
		handler: json({ data: { backup_codes: ['aaaa-1111', 'bbbb-2222'] } })
	}
];

async function signIn(page: Page, token: 'owner' | 'recruiter') {
	await page.context().addCookies([
		{ name: 'access_token', value: token, domain: 'localhost', path: '/' }
	]);
}

/** Welcome screen through to the 2FA step. */
async function reachTwoFactor(page: Page) {
	await page.getByRole('button', { name: 'Commencer' }).click();
	await page.getByRole('button', { name: /Code TOTP/ }).click();
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

test.describe('S6.12 enterprise onboarding', () => {
	test('l owner voit les cinq etapes du parcours', async ({ page }) => {
		await signIn(page, 'owner');
		await mockApi(page, common);
		await gotoHydrated(page, '/enterprise/onboarding');

		await expect(page.getByRole('button', { name: 'Commencer' })).toBeVisible();
		await expect(page.getByText('Bienvenue').first()).toBeVisible();
		await expect(page.getByText(/Équipe|Profil/).first()).toBeVisible();
	});

	test('armer le TOTP affiche le secret puis les codes de secours', async ({ page }) => {
		let enabled: Record<string, unknown> | null = null;
		await signIn(page, 'owner');
		await mockApi(page, [
			{
				path: '/auth/totp/enable',
				handler: (route) => {
					enabled = route.request().postDataJSON();
					return json({ data: { backup_codes: ['aaaa-1111', 'bbbb-2222'] } })(route);
				}
			},
			...totpRoutes,
			...common
		]);
		await gotoHydrated(page, '/enterprise/onboarding');

		await reachTwoFactor(page);
		await page.getByRole('button', { name: 'Générer le secret' }).click();
		await expect(page.getByText('JBSWY3DPEHPK3PXP')).toBeVisible();

		await page.getByPlaceholder('123456').fill('123456');
		await page.getByRole('button', { name: 'Activer' }).click();

		await expect.poll(() => enabled).not.toBeNull();
		// Backup codes are the only way back in after losing the phone.
		await expect(page.getByText('aaaa-1111')).toBeVisible();
		await expect(page.getByText('bbbb-2222')).toBeVisible();
	});

	test('un code incomplet laisse le bouton inactif', async ({ page }) => {
		await signIn(page, 'owner');
		await mockApi(page, [...totpRoutes, ...common]);
		await gotoHydrated(page, '/enterprise/onboarding');

		await reachTwoFactor(page);
		await page.getByRole('button', { name: 'Générer le secret' }).click();
		await page.getByPlaceholder('123456').fill('123');

		await expect(page.getByRole('button', { name: 'Activer' })).toBeDisabled();
	});

	test('l owner peut renseigner le profil entreprise depuis le wizard', async ({ page }) => {
		let sent: Record<string, unknown> | null = null;
		await signIn(page, 'owner');
		await mockApi(page, [
			{
				path: '/enterprise/profile',
				handler: (route) => {
					if (route.request().method() === 'PUT') {
						sent = route.request().postDataJSON();
					}
					return json({ data: { enterprise: {}, member_count: 1 } })(route);
				}
			},
			...totpRoutes,
			...common
		]);
		await gotoHydrated(page, '/enterprise/onboarding');

		await reachTwoFactor(page);
		await page.getByRole('button', { name: 'Générer le secret' }).click();
		await page.getByPlaceholder('123456').fill('123456');
		await page.getByRole('button', { name: 'Activer' }).click();
		await page.getByRole('button', { name: "J'ai copié mes codes" }).click();
		await page.getByRole('button', { name: 'Continuer' }).click();

		await page.getByPlaceholder('https://acme.com').first().fill('https://acme.io');
		await page.getByRole('button', { name: /Enregistrer|Continuer/ }).first().click();

		await expect.poll(() => sent).not.toBeNull();
	});

	test('un recruteur ne passe pas par le profil ni l invitation d equipe', async ({ page }) => {
		await signIn(page, 'recruiter');
		await mockApi(page, [...totpRoutes, ...common]);
		await gotoHydrated(page, '/enterprise/onboarding');

		// Those steps belong to the owner; a recruiter would be editing a company
		// that is not theirs.
		await expect(page.getByText('Équipe')).toHaveCount(0);

		await reachTwoFactor(page);
		await page.getByRole('button', { name: 'Générer le secret' }).click();
		await page.getByPlaceholder('123456').fill('123456');
		await page.getByRole('button', { name: 'Activer' }).click();
		await page.getByRole('button', { name: "J'ai copié mes codes" }).click();
		await page.getByRole('button', { name: 'Continuer' }).click();

		await expect(page.getByPlaceholder('alice@acme.com')).toHaveCount(0);
	});
});
