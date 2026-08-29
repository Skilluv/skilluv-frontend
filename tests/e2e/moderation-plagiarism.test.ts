/**
 * Authorised branch of /moderation/plagiarism.
 *
 * The parcours spec covers the refusal against the real backend (the shared
 * test account has no `plagiarism_reviewer` grant). Here the capability is
 * granted through mocks so the queue itself gets covered.
 */
import { test, expect, type Page, type Route } from '@playwright/test';
import { gotoHydrated } from './utils/hydration';

test.beforeEach(async ({ page, context }) => {
	await page.addInitScript(() => {
		try {
			localStorage.setItem('skilluv-locale', 'fr');
		} catch {
			// storage unavailable
		}
	});
	// Auth is resolved during SSR; the cookie selects the mock-backend fixture.
	await context.addCookies([
		{ name: 'access_token', value: 'challenger', domain: 'localhost', path: '/' }
	]);
});

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

const flagged = {
	data: [
		{
			id: 'del-1',
			user_id: 'b2bd9174-0828-46b1-adc3-11aa70ffc9f3',
			verification_status: 'flagged',
			verification_signal: { plagiarism_score: 0.92, similar_to: 'del-0-original' },
			submitted_at: '2026-08-01T09:00:00Z'
		}
	],
	pagination: { page: 1, per_page: 50, total: 1, total_pages: 1 },
	meta: { request_id: 'r', timestamp: '2026-08-11' }
};

const reviewerCapability = {
	data: [{ capability: 'plagiarism_reviewer', granted_at: '2026-01-01', granted_reason: 'seed' }]
};

test.describe('Plagiarism queue', () => {
	test('un reviewer voit la file et ses scores', async ({ page }) => {
		await mockApi(page, [
			{ path: '/users/me/capabilities', handler: json(reviewerCapability) },
			{ path: '/users/me/orientations', handler: json({ data: [] }) },
			{ path: '/fraud/deliverables/flagged', handler: json(flagged) }
		]);

		await gotoHydrated(page, '/moderation/plagiarism');

		await expect(page.getByRole('heading', { name: 'File plagiat' })).toBeVisible();
		await expect(page.getByText('Score plagiat: 92%')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Marquer valide' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Révoquer' })).toBeVisible();
	});

	test('un reviewer sans rien a traiter voit un etat vide', async ({ page }) => {
		await mockApi(page, [
			{ path: '/users/me/capabilities', handler: json(reviewerCapability) },
			{ path: '/users/me/orientations', handler: json({ data: [] }) },
			{
				path: '/fraud/deliverables/flagged',
				handler: json({
					data: [],
					pagination: { page: 1, per_page: 50, total: 0, total_pages: 0 },
					meta: { request_id: 'r', timestamp: '2026-08-11' }
				})
			}
		]);

		await gotoHydrated(page, '/moderation/plagiarism');
		await expect(page.getByText('Aucun deliverable à examiner.')).toBeVisible();
	});

	test('sans la capability, la page refuse explicitement', async ({ page }) => {
		await mockApi(page, [
			{ path: '/users/me/capabilities', handler: json({ data: [] }) },
			{ path: '/users/me/orientations', handler: json({ data: [] }) }
		]);

		await gotoHydrated(page, '/moderation/plagiarism');
		await expect(page.getByRole('heading', { name: 'File plagiat' })).toBeVisible();
		await expect(page.getByText(/plagiarism_reviewer/)).toBeVisible();
	});
});
