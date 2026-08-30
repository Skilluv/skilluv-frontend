import { test, expect, type Page, type Route } from '@playwright/test';
import { gotoHydrated } from './utils/hydration';

/**
 * Discord on the account surface.
 *
 * The assertions that matter are about the unlink guard, not the button. The
 * settings page refuses to unlink a provider when it is the only way back in,
 * and Discord cannot sign anyone in — so counting it gets the guard wrong in
 * both directions. The dangerous direction is Google + Discord: two links, one
 * real door, and a naive count happily offers to remove the door.
 */

type ApiRoute = { path: string; handler: (route: Route) => Promise<void> | void };

/**
 * Only the routes named here are intercepted; everything else reaches the mock
 * backend. A catch-all would also swallow `/auth/me`, leaving the page with no
 * user and redirecting it to sign-in before any of this could be asserted.
 */
async function mockApi(page: Page, routes: ApiRoute[]) {
	await page.route('**/api/**', async (route) => {
		const url = new URL(route.request().url());
		const match = routes.find((r) => url.pathname.endsWith(r.path));
		if (match) return match.handler(route);
		await route.continue();
	});
}

function json(body: unknown, status = 200) {
	return (route: Route) =>
		route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

function provider(name: string) {
	return {
		id: `link-${name}`,
		user_id: 'u-1',
		provider: name,
		provider_user_id: `${name}-1`,
		email: `me@${name}.test`,
		display_name: 'Me',
		avatar_url: null,
		linked_at: '2026-01-01T00:00:00.000Z'
	};
}

function providersRoute(names: string[]): ApiRoute {
	return {
		path: '/auth/me/oauth-providers',
		handler: json({ data: { providers: names.map(provider) } })
	};
}

test.beforeEach(async ({ page }) => {
	await page.context().addCookies([
		// A candidate, not an enterprise owner: an enterprise session is routed
		// to /enterprise/settings/security, which does not carry this component.
		{ name: 'access_token', value: 'challenger', domain: 'localhost', path: '/' }
	]);
});

test.describe('Linked accounts — Discord', () => {
	test('offers Discord when it is not linked', async ({ page }) => {
		await mockApi(page, [providersRoute(['google'])]);
		await gotoHydrated(page, '/settings/security');
		await expect(page.getByTestId('linked-accounts')).toContainText(/discord/i);
	});

	test('a lone Discord link can be removed', async ({ page }) => {
		// One provider, but not a way in — refusing here would block a harmless
		// action and leave somebody stuck with a link they want gone.
		await mockApi(page, [providersRoute(['discord'])]);
		await gotoHydrated(page, '/settings/security');
		await expect(page.getByTestId('unlink-provider')).toHaveCount(1);
	});

	test('the only sign-in provider is protected even when Discord is also linked', async ({
		page
	}) => {
		// The case a naive count gets wrong: two links, one real door. Only
		// Discord may be unlinked.
		await mockApi(page, [providersRoute(['google', 'discord'])]);
		await gotoHydrated(page, '/settings/security');
		await expect(page.getByTestId('unlink-provider')).toHaveCount(1);
		await expect(page.getByTestId('linked-accounts')).toContainText(/seul accès|only way in/i);
	});

	test('two sign-in providers are both removable', async ({ page }) => {
		await mockApi(page, [providersRoute(['google', 'linkedin'])]);
		await gotoHydrated(page, '/settings/security');
		await expect(page.getByTestId('unlink-provider')).toHaveCount(2);
	});

	test('says what unlinking Discord costs, before the click', async ({ page }) => {
		await mockApi(page, [providersRoute(['google', 'discord'])]);
		await gotoHydrated(page, '/settings/security');
		await expect(page.getByTestId('linked-accounts')).toContainText(/rôles|roles/i);
	});

	test('the page still renders when the provider list fails', async ({ page }) => {
		// A deployment without Discord configured answers 404 on the link
		// endpoint; the list itself failing must not take the page with it.
		await mockApi(page, [
			{ path: '/auth/me/oauth-providers', handler: json({ error: { message: 'nope' } }, 500) }
		]);
		await gotoHydrated(page, '/settings/security');
		await expect(page.getByTestId('linked-accounts')).toBeVisible();
	});
});
