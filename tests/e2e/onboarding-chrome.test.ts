import { test, expect, type Page, type Route } from '@playwright/test';
import { gotoHydrated } from './utils/hydration';

/**
 * Onboarding has no chrome.
 *
 * The enlistment already had none, because it lives under `/auth`. Everything
 * after the account exists and before the person is onboarded did — completing
 * the profile, picking the trades, the first act — and those steps are not
 * optional. A navbar on a mandatory step is a way out of it: somebody halfway
 * through picking trades could wander into the leaderboards and never come
 * back, holding an account with neither a discipline nor a consent recorded.
 */

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

test.beforeEach(async ({ page, context }) => {
	await context.addCookies([
		{ name: 'access_token', value: 'challenger', domain: 'localhost', path: '/' }
	]);
	await page.addInitScript(() => {
		try {
			localStorage.setItem('skilluv-locale', 'fr');
		} catch {
			/* storage unavailable */
		}
	});
	await page.setViewportSize({ width: 1440, height: 900 });
	await mockApi(page, [
		{ path: '/notifications/unread-count', handler: json({ data: { unread_count: 3 } }) },
		{ path: '/users/me/orientations', handler: json({ data: { orientations: [] } }) }
	]);
});

/** Everything the reader must not be offered mid-onboarding. */
async function chrome(page: Page) {
	return {
		navbar: await page.locator('header nav').count(),
		bell: await page.getByTestId('notification-bell').count(),
		footer: await page.locator('footer').count(),
		// The rank pill lives in the user menu button beside the name.
		userPill: await page.locator('header [data-user-dropdown]').count(),
		prompt: await page.getByText(/Choisis tes orientations métier/i).count()
	};
}

test.describe('The onboarding steps', () => {
	for (const path of [
		'/onboarding/complete-profile',
		'/onboarding/orientations',
		'/challenges/onboarding'
	]) {
		test(`${path} carries no navbar, bell, user pill or footer`, async ({ page }) => {
			await gotoHydrated(page, path);
			expect(await chrome(page)).toEqual({
				navbar: 0,
				bell: 0,
				footer: 0,
				userPill: 0,
				prompt: 0
			});
		});
	}

	test('the catalogue keeps its chrome: /challenges is not an onboarding step', async ({
		page
	}) => {
		// `/challenges/onboarding` is matched on the whole segment. Matching it as
		// a prefix would strip the navbar from the public catalogue.
		await gotoHydrated(page, '/challenges');
		const c = await chrome(page);
		expect(c.navbar).toBeGreaterThan(0);
		expect(c.bell).toBe(1);
		expect(c.footer).toBeGreaterThan(0);
	});
});
