/**
 * SKI-287 — /mentions.
 *
 * The list is a routing surface: each item links to the backend-built
 * source_url. Getting that wrong sends the user nowhere, so the href is
 * asserted rather than just the presence of a row.
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

function mention(overrides: Record<string, unknown> = {}) {
	return {
		id: 'mt-1',
		source_type: 'forum_post',
		source_id: 'f-1',
		source_url: '/forum/f-1',
		excerpt: 'on devrait demander a @kofi de relire ce patch',
		author: {
			user_id: 'u-ama',
			username: 'ama',
			display_name: 'Ama Doe',
			avatar_url: null
		},
		read_at: null,
		created_at: '2026-08-11T10:00:00Z',
		...overrides
	};
}

function paginated(items: unknown[], totalPages = 1) {
	return {
		data: items,
		pagination: { page: 1, per_page: 20, total: items.length, total_pages: totalPages },
		meta: { request_id: 'r', timestamp: '2026-08-12' }
	};
}

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

test.describe('SKI-287 mentions', () => {
	test('chaque mention pointe vers la source construite par le back', async ({ page }) => {
		await mockApi(page, [
			{ path: '/users/me/mentions', handler: json(paginated([mention()])) },
			...common
		]);
		await gotoHydrated(page, '/mentions');

		await expect(page.getByTestId('mentions-page')).toBeVisible();
		await expect(page.getByText('Ama Doe')).toBeVisible();
		await expect(page.getByText(/relire ce patch/)).toBeVisible();
		await expect(page.getByTestId('mention-item')).toHaveAttribute('href', '/forum/f-1');
	});

	test('une liste vide explique comment on est cite', async ({ page }) => {
		await mockApi(page, [
			{ path: '/users/me/mentions', handler: json(paginated([])) },
			...common
		]);
		await gotoHydrated(page, '/mentions');

		await expect(page.getByText('Personne ne t’a encore cité.')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Tout marquer comme lu' })).toHaveCount(0);
	});

	test('tout marquer comme lu appelle le back et retire le bouton', async ({ page }) => {
		let readAllCalls = 0;
		await mockApi(page, [
			{
				path: '/users/me/mentions/read-all',
				handler: (route) => {
					readAllCalls++;
					return json({ data: { marked: 2 } })(route);
				}
			},
			{
				path: '/users/me/mentions',
				handler: json(paginated([mention(), mention({ id: 'mt-2', source_url: '/forum/f-2' })]))
			},
			...common
		]);
		await gotoHydrated(page, '/mentions');

		await page.getByRole('button', { name: 'Tout marquer comme lu' }).click();

		await expect(page.getByRole('button', { name: 'Tout marquer comme lu' })).toHaveCount(0);
		await expect.poll(() => readAllCalls).toBe(1);
	});

	test('une liste deja lue n offre pas le bouton', async ({ page }) => {
		await mockApi(page, [
			{
				path: '/users/me/mentions',
				handler: json(paginated([mention({ read_at: '2026-08-11T12:00:00Z' })]))
			},
			...common
		]);
		await gotoHydrated(page, '/mentions');

		await expect(page.getByTestId('mention-item')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Tout marquer comme lu' })).toHaveCount(0);
	});

	test('un back en erreur propose de reessayer', async ({ page }) => {
		let calls = 0;
		await mockApi(page, [
			{
				path: '/users/me/mentions',
				handler: (route) => {
					calls++;
					if (calls === 1) {
						return json(
							{
								error: { code: 'INTERNAL_ERROR', message: 'boom' },
								meta: { request_id: 'r', timestamp: '2026-08-12' }
							},
							500
						)(route);
					}
					return json(paginated([mention()]))(route);
				}
			},
			...common
		]);
		await gotoHydrated(page, '/mentions');

		await expect(page.getByText('Impossible de charger tes mentions.')).toBeVisible();
		await page.getByRole('button', { name: 'Réessayer' }).click();
		await expect(page.getByTestId('mention-item')).toBeVisible();
	});
});
