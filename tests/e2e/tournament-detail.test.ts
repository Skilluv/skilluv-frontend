/**
 * S7.5 (SKI-52) — /tournaments/[slug]: registration and standings.
 *
 * Only the listing was covered. The detail page, the registration call and the
 * already-registered state had none.
 *
 * The mocks here mirror the shapes the backend actually sends, which is not
 * what the first version of this file assumed:
 *
 * - `GET /tournaments/{slug}` answers `{data: {tournament: …}}` and
 *   `GET /tournaments/{slug}/leaderboard` answers `{data: {leaderboard: […]}}`.
 *   Both are wrapped in a named key; neither is the bare object.
 * - A standing row is a `tournament_participants` row — `participant_id`,
 *   `participant_type`, `score`, `rank`. `leaderboard_of` joins nothing, so
 *   there is no `username` and no `display_name` on it (SKI-302 tracks adding
 *   them). A test asserting on a displayed name asserts on something the page
 *   would have to invent.
 * - There is no `registered` flag and no participant counter on a tournament.
 *   Registration is a row in the standing, and the participant count is that
 *   list's length — which is why this file counts rows rather than reading a
 *   `12 / 100` that was never served.
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

/** The id the mock backend signs the `challenger` cookie in as. The page marks
 *  the reader's own row from it, so it decides "registered" here. */
const ME = 'u-challenger';

/** Dates relative to the run: a fixed window would eventually expire and the
 *  registration button would silently disappear. */
function tournament(overrides: Record<string, unknown> = {}) {
	return {
		id: 't-1',
		slug: 'skilluv-cup',
		season_id: 's-1',
		name: 'Skilluv Cup',
		description: 'Le tournoi de la saison.',
		kind: 'hackathon',
		format: 'solo',
		skill_domain: 'code',
		starts_at: iso(-1),
		ends_at: iso(7),
		status: 'active',
		prize_pool_fragments: 0,
		prize_pool_gp: 0,
		rules: {},
		scoring_direction: 'desc',
		...overrides
	};
}

/** One standing row, as `tournament_participants` serialises. */
function standing(participantId: string, rank: number, score: number) {
	return {
		tournament_id: 't-1',
		participant_type: 'user',
		participant_id: participantId,
		score,
		rank,
		prize_fragments_awarded: 0,
		prize_gp_awarded: 0,
		registered_at: iso(-1)
	};
}

/** Two entrants, neither of them the reader: nobody is registered. */
const leaderboard = {
	data: { leaderboard: [standing('u-1', 1, 320), standing('u-2', 2, 180)] }
};

/** The same, with the reader's own row in it — which is what registration is. */
const leaderboardWithMe = {
	data: { leaderboard: [standing('u-1', 1, 320), standing(ME, 2, 180)] }
};

function routes(extra: ApiRoute[] = []): ApiRoute[] {
	return [
		...extra,
		{ path: '/tournaments/skilluv-cup/leaderboard', handler: json(leaderboard) },
		{ path: '/tournaments/skilluv-cup', handler: json({ data: { tournament: tournament() } }) },
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
	test('affiche le tournoi et son classement', async ({ page }) => {
		await mockApi(page, routes());
		await gotoHydrated(page, '/tournaments/skilluv-cup');

		await expect(page.getByRole('heading', { name: 'Skilluv Cup' })).toBeVisible();
		await expect(page.getByText('Le tournoi de la saison.')).toBeVisible();
		// The participant count is the standing's length, not a served counter.
		await expect(page.getByTestId('leaderboard-row')).toHaveCount(2);
		await expect(page.getByText('#1')).toBeVisible();
		await expect(page.getByText('320')).toBeVisible();
	});

	test('une ligne de classement ne montre pas de nom, faute de jointure', async ({ page }) => {
		await mockApi(page, routes());
		await gotoHydrated(page, '/tournaments/skilluv-cup');

		// `leaderboard_of` joins no identity, so the page ranks by number and
		// says "Participant". Showing a name would mean inventing one.
		await expect(page.getByText('Participant').first()).toBeVisible();
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
			{ path: '/tournaments/skilluv-cup/leaderboard', handler: json(leaderboardWithMe) },
			{ path: '/tournaments/skilluv-cup', handler: json({ data: { tournament: tournament() } }) },
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
				handler: json({
					data: {
						tournament: tournament({
							starts_at: iso(-30),
							ends_at: iso(-10),
							status: 'concluded'
						})
					}
				})
			},
			{ path: '/users/me/capabilities', handler: json({ data: [] }) },
			{ path: '/users/me/orientations', handler: json({ data: [] }) }
		]);
		await gotoHydrated(page, '/tournaments/skilluv-cup');

		await expect(page.getByRole('heading', { name: 'Skilluv Cup' })).toBeVisible();
		await expect(page.getByRole('button', { name: "S'inscrire" })).toHaveCount(0);
	});
});
