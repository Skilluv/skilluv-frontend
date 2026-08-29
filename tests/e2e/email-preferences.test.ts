/**
 * SKI-286 — /settings/email-preferences.
 *
 * Marketing opt-in is a GDPR obligation, so the save payload is asserted field
 * by field: a partial body would be read as "false" by the backend, silently
 * unsubscribing the user from categories they never touched.
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

const prefs = {
	digest_weekly: true,
	streak_reminder: true,
	marketing: false,
	updated_at: '2026-08-11T10:00:00Z'
};

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
		{ name: 'access_token', value: 'challenger', domain: 'localhost', path: '/' }
	]);
});

test.describe('SKI-286 email preferences', () => {
	test('affiche les 3 categories dans l etat renvoye par le back', async ({ page }) => {
		await mockApi(page, [
			{ path: '/users/me/email-preferences', handler: json({ data: prefs }) },
			...common
		]);
		await gotoHydrated(page, '/settings/email-preferences');

		await expect(page.getByTestId('email-pref-digest_weekly')).toBeChecked();
		await expect(page.getByTestId('email-pref-streak_reminder')).toBeChecked();
		await expect(page.getByTestId('email-pref-marketing')).not.toBeChecked();
	});

	test('sauvegarder envoie les trois booleens et confirme', async ({ page }) => {
		let sent: Record<string, unknown> | null = null;
		await mockApi(page, [
			{
				path: '/users/me/email-preferences',
				handler: (route) => {
					if (route.request().method() === 'PUT') {
						sent = route.request().postDataJSON();
						return json({ data: { ...prefs, marketing: true } })(route);
					}
					return json({ data: prefs })(route);
				}
			},
			...common
		]);
		await gotoHydrated(page, '/settings/email-preferences');

		await page.getByTestId('email-pref-marketing').setChecked(true);
		await page.getByRole('button', { name: 'Sauvegarder' }).click();

		await expect(page.getByText('Préférences enregistrées')).toBeVisible();
		expect(sent).toEqual({ digest_weekly: true, streak_reminder: true, marketing: true });
	});

	test('rappelle que les emails transactionnels restent envoyes', async ({ page }) => {
		await mockApi(page, [
			{ path: '/users/me/email-preferences', handler: json({ data: prefs }) },
			...common
		]);
		await gotoHydrated(page, '/settings/email-preferences');

		await expect(page.getByText(/reçus de paiement/)).toBeVisible();
	});

	test('un back en erreur laisse l ecran utilisable sur les defauts', async ({ page }) => {
		await mockApi(page, [
			{
				path: '/users/me/email-preferences',
				handler: json(
					{
						error: { code: 'INTERNAL_ERROR', message: 'boom' },
						meta: { request_id: 'r', timestamp: '2026-08-12' }
					},
					500
				)
			},
			...common
		]);
		await gotoHydrated(page, '/settings/email-preferences');

		// Documented defaults: digest and streak on, marketing off (GDPR opt-in).
		await expect(page.getByTestId('email-pref-digest_weekly')).toBeChecked();
		await expect(page.getByTestId('email-pref-marketing')).not.toBeChecked();
		await expect(page.getByRole('button', { name: 'Sauvegarder' })).toBeEnabled();
	});

	test('le hub reglages mene a la page', async ({ page }) => {
		await mockApi(page, common);
		await gotoHydrated(page, '/settings');

		await expect(page.getByTestId('settings-link-email-prefs')).toHaveAttribute(
			'href',
			'/settings/email-preferences'
		);
	});
});
