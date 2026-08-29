/**
 * `/dashboard` — the home the namespace never had.
 *
 * Eight sub-pages, no entry point, because the five reads that belong on it
 * were served under `/users/me/**` and called by nothing.
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

const suggestions = {
	data: {
		suggestions: [
			{
				id: 's1',
				slug: null,
				title: 'Corriger le parsing des dates ISO',
				format: 'individual',
				orientation_slug: 'backend-engineer',
				family: 'backend',
				difficulty: 3,
				estimated_hours: 6,
				closes_at: null,
				score: 42,
				reasons: ['Ton dernier livrable touchait ce dépôt', 'Difficulté juste au-dessus']
			}
		],
		cached: true
	}
};

test.describe('Le tableau de bord', () => {
	test('les suggestions arrivent avec leurs raisons', async ({ page }) => {
		await mockApi(page, [
			{ path: '/users/me/next-challenges', handler: json(suggestions) },
			{ path: '/users/me/contest-invitations', handler: json({ data: { invitations: [] } }) },
			{ path: '/users/me/events', handler: json({ data: { events: [] } }) },
			{ path: '/users/me/mentor-subscriptions', handler: json({ data: { subscriptions: [] } }) },
			{ path: '/users/me/stewardships', handler: json({ data: { stewardships: [] } }) }
		]);

		await gotoHydrated(page, '/dashboard');

		await expect(page.getByTestId('dashboard-home')).toBeVisible();
		await expect(page.getByText('Corriger le parsing des dates ISO')).toBeVisible();
		// Le fond du truc : une recommandation qu'on ne peut pas discuter est
		// une recommandation en laquelle personne n'a confiance.
		await expect(page.getByText('— Ton dernier livrable touchait ce dépôt')).toBeVisible();
		// Le cache d'une heure est dit, pas laissé passer pour de l'obsolescence.
		await expect(page.getByText('Rafraîchi toutes les heures')).toBeVisible();
		await expect(page.getByText('Rien n’attend après toi.')).toBeVisible();
	});

	test('une invitation en attente remonte en tête, une acceptée non', async ({ page }) => {
		await mockApi(page, [
			{ path: '/users/me/next-challenges', handler: json({ data: { suggestions: [] } }) },
			{
				path: '/users/me/contest-invitations',
				handler: json({
					data: {
						invitations: [
							{
								contest_id: 'c1',
								slug: 'brief-du-mois',
								title: 'Brief du mois',
								kind: 'brief_contest',
								deadline: '2027-01-01T00:00:00Z',
								invited_at: '2026-08-01T00:00:00Z',
								accepted_at: null
							},
							{
								contest_id: 'c2',
								slug: 'deja-accepte',
								title: 'Déjà accepté',
								kind: 'hackathon',
								deadline: null,
								invited_at: '2026-07-01T00:00:00Z',
								accepted_at: '2026-07-02T00:00:00Z'
							}
						]
					}
				})
			},
			{ path: '/users/me/events', handler: json({ data: { events: [] } }) },
			{ path: '/users/me/mentor-subscriptions', handler: json({ data: { subscriptions: [] } }) },
			{ path: '/users/me/stewardships', handler: json({ data: { stewardships: [] } }) }
		]);

		await gotoHydrated(page, '/dashboard');

		await expect(page.getByTestId('dashboard-invitations')).toBeVisible();
		await expect(page.getByText('Brief du mois')).toBeVisible();
		await expect(page.getByText('Déjà accepté')).toHaveCount(0);
		await expect(page.getByText('1 chose attend une réponse de toi.')).toBeVisible();
	});

	test('un abonnement arrêté dit jusqu’à quand il court encore', async ({ page }) => {
		await mockApi(page, [
			{ path: '/users/me/next-challenges', handler: json({ data: { suggestions: [] } }) },
			{ path: '/users/me/contest-invitations', handler: json({ data: { invitations: [] } }) },
			{ path: '/users/me/events', handler: json({ data: { events: [] } }) },
			{
				path: '/users/me/mentor-subscriptions',
				handler: json({
					data: {
						subscriptions: [
							{
								id: 'sub1',
								mentor_user_id: 'someone',
								mentee_user_id: 'me',
								monthly_fee_cents: 9000,
								currency: 'EUR',
								platform_percent: '15.00',
								sessions_included: 2,
								current_period_end: '2026-09-01T00:00:00Z',
								auto_renew: false
							}
						]
					}
				})
			},
			{ path: '/users/me/stewardships', handler: json({ data: { stewardships: [] } }) }
		]);

		await gotoHydrated(page, '/dashboard');

		// Arrêté, mais ce qui a été payé court jusqu'à son terme.
		await expect(page.getByText('ne se renouvelle pas')).toBeVisible();
		await expect(page.getByText(/Court jusqu’au/)).toBeVisible();
	});

	test('sans discipline choisie, les suggestions le disent au lieu de rester vides', async ({
		page
	}) => {
		await mockApi(page, [
			{
				path: '/users/me/next-challenges',
				handler: json(
					{
						error: {
							code: 'VALIDATION_ERROR',
							message: 'name a domain: this account has not finished onboarding'
						},
						meta: {}
					},
					400
				)
			},
			{ path: '/users/me/contest-invitations', handler: json({ data: { invitations: [] } }) },
			{ path: '/users/me/events', handler: json({ data: { events: [] } }) },
			{ path: '/users/me/mentor-subscriptions', handler: json({ data: { subscriptions: [] } }) },
			{ path: '/users/me/stewardships', handler: json({ data: { stewardships: [] } }) }
		]);

		await gotoHydrated(page, '/dashboard');

		// « Aucune suggestion » serait une mauvaise lecture de ce refus.
		await expect(page.getByText(/has not finished onboarding/)).toBeVisible();
		await expect(page.getByRole('link', { name: 'Choisir un métier' })).toBeVisible();
	});

	test('une surface indisponible ne blanchit pas les quatre autres', async ({ page }) => {
		await mockApi(page, [
			{ path: '/users/me/next-challenges', handler: json(suggestions) },
			{
				path: '/users/me/stewardships',
				handler: json({ error: { code: 'INTERNAL', message: 'x' }, meta: {} }, 500)
			},
			{ path: '/users/me/contest-invitations', handler: json({ data: { invitations: [] } }) },
			{ path: '/users/me/events', handler: json({ data: { events: [] } }) },
			{ path: '/users/me/mentor-subscriptions', handler: json({ data: { subscriptions: [] } }) }
		]);

		await gotoHydrated(page, '/dashboard');
		await expect(page.getByText('Corriger le parsing des dates ISO')).toBeVisible();
	});
});
