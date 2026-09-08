import { test, expect, type Page, type Route } from '@playwright/test';
import { gotoHydrated } from './utils/hydration';

/**
 * The bell, and the five rows behind it.
 *
 * It used to be a link: finding out whether anything had happened cost a page,
 * and the badge said how many without ever saying what.
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

/** Seven rows, so the panel has more than it shows. */
const ROWS = Array.from({ length: 7 }, (_, i) => ({
	id: `n${i + 1}`,
	user_id: 'u-challenger',
	notification_type: 'new_message',
	kind: null,
	title: `Notification ${i + 1}`,
	body: `Body of notification ${i + 1}`,
	data: null,
	read: i > 1,
	group_count: 1,
	group_actors: [],
	created_at: '2026-09-07T10:00:00Z',
	updated_at: '2026-09-07T10:00:00Z'
}));

function listRoute(seen: { perPage: string | null }): ApiRoute {
	return {
		path: '/notifications',
		handler: (route) => {
			const url = new URL(route.request().url());
			seen.perPage = url.searchParams.get('per_page');
			const size = Number(url.searchParams.get('per_page') ?? '20');
			return json({
				data: ROWS.slice(0, size),
				pagination: { page: 1, per_page: size, total: ROWS.length, total_pages: 2 }
			})(route);
		}
	};
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
});

test.describe('The notification bell', () => {
	test('counts the unread ones, in the badge and in its own name', async ({ page }) => {
		await mockApi(page, [
			{ path: '/notifications/unread-count', handler: json({ data: { unread_count: 2 } }) }
		]);
		await gotoHydrated(page, '/challenges');

		await expect(page.getByTestId('notification-count')).toHaveText('2');
		// The number is on a coloured disc, which says nothing to a screen
		// reader. It is in the accessible name too.
		await expect(page.getByTestId('notification-bell')).toHaveAttribute(
			'aria-label',
			/2 non lues/
		);
	});

	test('shows the five most recent, and asks for exactly five', async ({ page }) => {
		const seen = { perPage: null as string | null };
		await mockApi(page, [
			{ path: '/notifications/unread-count', handler: json({ data: { unread_count: 2 } }) },
			listRoute(seen)
		]);
		await gotoHydrated(page, '/challenges');

		// Nothing is fetched until somebody asks: this renders on every
		// authenticated page, and most visits never open it.
		expect(seen.perPage).toBeNull();

		await page.getByTestId('notification-bell').click();
		await expect(page.getByTestId('notification-panel')).toBeVisible();
		await expect.poll(() => seen.perPage).toBe('5');

		const rows = page.getByTestId('notification-panel').getByRole('menuitem');
		// Five rows plus the way through to the rest.
		await expect(rows).toHaveCount(6);
		await expect(rows.filter({ hasText: 'Notification 1' })).toHaveCount(1);
		await expect(rows.filter({ hasText: 'Notification 5' })).toHaveCount(1);
		await expect(rows.filter({ hasText: 'Notification 6' })).toHaveCount(0);
	});

	test('leads to the full page', async ({ page }) => {
		await mockApi(page, [
			{ path: '/notifications/unread-count', handler: json({ data: { unread_count: 0 } }) },
			listRoute({ perPage: null })
		]);
		await gotoHydrated(page, '/challenges');
		await page.getByTestId('notification-bell').click();
		await page.getByTestId('notification-see-all').click();
		await expect(page).toHaveURL(/\/notifications$/);
	});

	test('reading one marks it read, opening the panel does not', async ({ page }) => {
		const marked: string[] = [];
		await mockApi(page, [
			{ path: '/notifications/unread-count', handler: json({ data: { unread_count: 2 } }) },
			{
				path: '/n1/read',
				handler: (route) => {
					marked.push('n1');
					return json({ data: { message: 'ok' } })(route);
				}
			},
			listRoute({ perPage: null })
		]);
		await gotoHydrated(page, '/challenges');
		await page.getByTestId('notification-bell').click();
		await expect(page.getByTestId('notification-panel')).toBeVisible();

		// Seeing that something exists is not reading it. Marking the five read
		// on open would empty the badge for somebody who glanced and moved on.
		expect(marked).toEqual([]);

		await page
			.getByTestId('notification-panel')
			.getByRole('menuitem')
			.first()
			.click();
		await expect.poll(() => marked).toEqual(['n1']);
	});

	test('says it could not look, rather than that nothing happened', async ({ page }) => {
		await mockApi(page, [
			{ path: '/notifications/unread-count', handler: json({ data: { unread_count: 1 } }) },
			{ path: '/notifications', handler: json({ error: { code: 'INTERNAL' } }, 500) }
		]);
		await gotoHydrated(page, '/challenges');
		await page.getByTestId('notification-bell').click();

		// An empty panel on a failed request tells the reader there is nothing
		// waiting for them, which may be false.
		await expect(page.getByText(/Impossible de charger/i)).toBeVisible();
		await expect(page.getByText(/Aucune notification/i)).toHaveCount(0);
	});
});
