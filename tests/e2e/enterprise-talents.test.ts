/**
 * S6.5 (SKI-53) — /enterprise/talents: sourcing search.
 *
 * The whole recruiter pitch is "filter on proof, not on a resume", so the query
 * string actually leaving the browser is the thing worth pinning: a filter that
 * silently fails to be sent looks like an empty talent pool.
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

function talent(overrides: Record<string, unknown> = {}) {
	return {
		id: 'u-kofi',
		username: 'kofi',
		display_name: 'Kofi Adjovi',
		skill_domain: 'code',
		title: 'artisan',
		golden_stars: 1,
		total_fragments: 1200,
		streak_current: 12,
		country: 'Bénin',
		country_iso2: 'BJ',
		available_for_hire: true,
		looking_for: 'cdi',
		badge_count: 3,
		project_count: 2,
		last_activity_at: '2026-08-10T09:00:00Z',
		top_skills: [],
		is_bookmarked: false,
		...overrides
	};
}

function results(items: unknown[]) {
	return {
		data: items,
		pagination: { page: 1, per_page: 20, total: items.length, total_pages: 1 },
		meta: { request_id: 'r', timestamp: '2026-08-12' }
	};
}

const common: ApiRoute[] = [
	{ path: '/users/me/capabilities', handler: json({ data: [] }) },
	{ path: '/users/me/orientations', handler: json({ data: [] }) }
];

/** Captures every search query string so filters can be asserted. */
function searchRoute(seen: string[], items: unknown[] = [talent()]): ApiRoute {
	return {
		path: '/talents/search/v2',
		handler: (route) => {
			seen.push(new URL(route.request().url()).search);
			return json(results(items))(route);
		}
	};
}

test.beforeEach(async ({ page, context }) => {
	await page.addInitScript(() => {
		try {
			localStorage.setItem('skilluv-locale', 'fr');
		} catch {
			/* storage unavailable */
		}
	});
	await context.addCookies([
		{ name: 'access_token', value: 'recruiter', domain: 'localhost', path: '/' }
	]);
});

test.describe('S6.5 enterprise talent search', () => {
	test('affiche les talents et leurs preuves', async ({ page }) => {
		const seen: string[] = [];
		await mockApi(page, [searchRoute(seen), ...common]);
		await gotoHydrated(page, '/enterprise/talents');

		await expect(page.getByText('Kofi Adjovi').first()).toBeVisible();
		await expect(page.getByRole('link', { name: /Kofi Adjovi|kofi/ }).first()).toBeVisible();
	});

	test('une recherche texte part en parametre q', async ({ page }) => {
		const seen: string[] = [];
		await mockApi(page, [searchRoute(seen), ...common]);
		await gotoHydrated(page, '/enterprise/talents');

		await expect.poll(() => seen.length).toBeGreaterThan(0);
		const before = seen.length;

		await page.getByPlaceholder(/Rechercher —/).first().fill('rust');
		await page.getByRole('button', { name: 'Rechercher' }).click();

		await expect.poll(() => seen.length).toBeGreaterThan(before);
		expect(seen[seen.length - 1]).toContain('q=rust');
	});

	test('les filtres numeriques partent tels quels', async ({ page }) => {
		const seen: string[] = [];
		await mockApi(page, [searchRoute(seen), ...common]);
		await gotoHydrated(page, '/enterprise/talents');

		await expect.poll(() => seen.length).toBeGreaterThan(0);
		const before = seen.length;

		await page.locator('#mf').fill('500');
		await page.getByRole('button', { name: 'Rechercher' }).click();

		await expect.poll(() => seen.length).toBeGreaterThan(before);
		expect(seen[seen.length - 1]).toContain('min_fragments=500');
	});

	test('un filtre a zero n est pas envoye', async ({ page }) => {
		const seen: string[] = [];
		await mockApi(page, [searchRoute(seen), ...common]);
		await gotoHydrated(page, '/enterprise/talents');

		await expect.poll(() => seen.length).toBeGreaterThan(0);
		const before = seen.length;

		// Zero means "no filter", not "at least zero fragments".
		await page.locator('#mf').fill('0');
		await page.getByRole('button', { name: 'Rechercher' }).click();

		await expect.poll(() => seen.length).toBeGreaterThan(before);
		expect(seen[seen.length - 1]).not.toContain('min_fragments');
	});

	test('sans resultat, un etat vide propose d elargir', async ({ page }) => {
		const seen: string[] = [];
		await mockApi(page, [searchRoute(seen, []), ...common]);
		await gotoHydrated(page, '/enterprise/talents');

		await expect(page.getByText(/Aucun talent|No talent/i).first()).toBeVisible();
	});
});
