/**
 * S4.6 (SKI-52) — /diplomas/verify/[code]: public diploma verification.
 *
 * This is the page a recruiter opens to check a credential. Only the search
 * form at /diplomas/verify was covered; the verdict page itself had none, so
 * nothing proved a valid diploma renders as valid — or that a revoked one is
 * not silently shown as fine.
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

const CODE = 'SKV-2026-ABCD';

function diploma(overrides: Record<string, unknown> = {}) {
	return {
		verification_code: CODE,
		status: 'valid',
		holder: { username: 'ama', display_name: 'Ama Doe' },
		certification: { title: 'Rust Backend', skill_domain: 'code', level: 'advanced' },
		issued_at: '2026-06-01T09:00:00Z',
		expires_at: '2029-06-01T09:00:00Z',
		revoked_at: null,
		revoke_reason: null,
		...overrides
	};
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

test.describe('S4.6 public diploma verification', () => {
	// Deliberately anonymous: a recruiter checking a credential has no account.
	test('un diplome valide affiche son titulaire et sa certification', async ({ page }) => {
		await mockApi(page, [
			{ path: `/diplomas/verify/${CODE}`, handler: json({ data: diploma() }) }
		]);
		await gotoHydrated(page, `/diplomas/verify/${CODE}`);

		await expect(page.getByText('Ama Doe')).toBeVisible();
		await expect(page.getByText('Rust Backend')).toBeVisible();
		await expect(page.getByText('✓ Valide', { exact: true })).toBeVisible();
	});

	test('un diplome revoque est annonce comme tel', async ({ page }) => {
		await mockApi(page, [
			{
				path: `/diplomas/verify/${CODE}`,
				handler: json({
					data: diploma({
						status: 'revoked',
						revoked_at: '2026-07-01T09:00:00Z',
						revoke_reason: 'Plagiat avere'
					})
				})
			}
		]);
		await gotoHydrated(page, `/diplomas/verify/${CODE}`);

		await expect(page.getByText(/Révoqué/).first()).toBeVisible();
		await expect(page.getByText('Plagiat avere')).toBeVisible();
	});

	test('un diplome expire est distingue d un diplome valide', async ({ page }) => {
		await mockApi(page, [
			{
				path: `/diplomas/verify/${CODE}`,
				handler: json({ data: diploma({ status: 'expired', expires_at: '2026-01-01T09:00:00Z' }) })
			}
		]);
		await gotoHydrated(page, `/diplomas/verify/${CODE}`);

		await expect(page.getByText(/Expiré/).first()).toBeVisible();
	});

	test('un code inconnu affiche un ecran introuvable, jamais une page vide', async ({ page }) => {
		await mockApi(page, [
			{
				path: `/diplomas/verify/${CODE}`,
				handler: json(
					{
						error: { code: 'RESOURCE_NOT_FOUND', message: 'Diploma not found' },
						meta: { request_id: 'r', timestamp: '2026-08-12' }
					},
					404
				)
			}
		]);
		await gotoHydrated(page, `/diplomas/verify/${CODE}`);

		await expect(page.getByRole('heading', { name: 'Diplôme introuvable' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Réessayer' })).toBeVisible();
	});
});
