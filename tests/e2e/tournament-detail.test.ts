/**
 * S7.5 (SKI-52) — /tournaments/[slug]: registration and standings.
 *
 * Only the listing was covered. The detail page, the registration call and the
 * already-registered state had none.
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

const DAY = 86_400_000;
const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * DAY).toISOString();

/** Dates relative to the run: a fixed window would eventually expire and the
 *  registration button would silently disappear. */
function tournament(overrides: Record<string, unknown> = {}) {
	return {
		id: 't-1',
		slug: 'skilluv-cup',
		season_id: 's-1',
		name: 'Skilluv Cup',
		description: 'Le tournoi de la saison.',
		skill_domain: 'code',
		starts_at: iso(-1),
		ends_at: iso(7),
		max_participants: 100,
		participants_count: 12,
		registered: false,
		...overrides
	};
}

const leaderboard = {
	data: {
		entries: [
			{ rank: 1, user_id: 'u-1', username: 'ama', display_name: 'Ama Doe', score: 320 },
			// Deliberately not the signed-in fixture: its name also sits in the navbar.
			{ rank: 2, user_id: 'u-2', username: 'yao', display_name: 'Yao Mensah', score: 180 }
		]
	}
};

function routes(extra: ApiRoute[] = []): ApiRoute[] {
	return [
		...extra,
		{ path: '/tournaments/skilluv-cup/leaderboard', handler: json(leaderboard) },
		{ path: '/tournaments/skilluv-cup', handler: json({ data: tournament() }) },
		{ path: '/users/me/capabilities', handler: json({ data: [] }) },
		{ path: '/users/me/orientations', handler: json({ data: [] }) }
	];
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
		{ name: 'access_token', value: 'challenger', domain: 'localhost', path: '/' }
	]);
});

test.describe('S7.5 tournament detail', () => {
	test('affiche le tournoi, ses participants et le classement', async ({ page }) => {
		await mockApi(page, routes());
		await gotoHydrated(page, '/tournaments/skilluv-cup');

		await expect(page.getByRole('heading', { name: 'Skilluv Cup' })).toBeVisible();
		await expect(page.getByText('Le tournoi de la saison.')).toBeVisible();
		// Count and cap share a single text node: "12 / 100".
		await expect(page.getByText(/12\s*\/\s*100/)).toBeVisible();
		await expect(page.getByText('Ama Doe')).toBeVisible();
		await expect(page.getByText('Yao Mensah')).toBeVisible();
	});

	test('un participant peut s inscrire', async ({ page }) => {
		let registerCalls = 0;
		await mockApi(
			page,
			routes([
				{
					path: '/tournaments/skilluv-cup/register',
					handler: (route) => {
						registerCalls++;
						return json({ data: { registered: true } })(route);
					}
				}
			])
		);
		await gotoHydrated(page, '/tournaments/skilluv-cup');

		await page.getByRole('button', { name: "S'inscrire" }).click();
		await expect(page.getByText('Inscrit·e au tournoi !')).toBeVisible();
		expect(registerCalls).toBe(1);
	});

	test('un participant deja inscrit ne revoit pas le bouton', async ({ page }) => {
		await mockApi(page, [
			{ path: '/tournaments/skilluv-cup/leaderboard', handler: json(leaderboard) },
			{ path: '/tournaments/skilluv-cup', handler: json({ data: tournament({ registered: true }) }) },
			{ path: '/users/me/capabilities', handler: json({ data: [] }) },
			{ path: '/users/me/orientations', handler: json({ data: [] }) }
		]);
		await gotoHydrated(page, '/tournaments/skilluv-cup');

		await expect(page.getByText('Inscrit·e', { exact: false })).toBeVisible();
		await expect(page.getByRole('button', { name: "S'inscrire" })).toHaveCount(0);
	});

	test('un tournoi termine ne propose plus l inscription', async ({ page }) => {
		await mockApi(page, [
			{ path: '/tournaments/skilluv-cup/leaderboard', handler: json(leaderboard) },
			{
				path: '/tournaments/skilluv-cup',
				handler: json({ data: tournament({ starts_at: iso(-30), ends_at: iso(-10) }) })
			},
			{ path: '/users/me/capabilities', handler: json({ data: [] }) },
			{ path: '/users/me/orientations', handler: json({ data: [] }) }
		]);
		await gotoHydrated(page, '/tournaments/skilluv-cup');

		await expect(page.getByRole('heading', { name: 'Skilluv Cup' })).toBeVisible();
		await expect(page.getByRole('button', { name: "S'inscrire" })).toHaveCount(0);
	});
});
