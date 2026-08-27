/**
 * `/dashboard/opportunities` and `/dashboard/trials/[id]` (SKI-324).
 *
 * The talent side of recruitment. Before this, somebody could publish a "job
 * wanted", receive pitches companies paid to send, and see none of them.
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

const emptyRest: ApiRoute[] = [
	{ path: '/users/me/reverse-recruitment', handler: json({ data: { posting: null } }) },
	{ path: '/users/me/recruitment-invitations', handler: json({ data: { invitations: [] } }) },
	{ path: '/users/me/interviews', handler: json({ data: { interviews: [] } }) },
	{ path: '/users/me/trials', handler: json({ data: { trials: [] } }) }
];

const pitch = {
	id: 'p1',
	posting_id: 'po1',
	enterprise_id: 'e1',
	company_name: 'Une boîte',
	pitch_md: '## Pourquoi toi\nOn a lu tes **livrables**.',
	offered_salary: '45000',
	currency: 'EUR',
	status: 'read',
	decline_reason: null,
	created_at: '2026-08-01T00:00:00Z'
};

test.describe('Ce qu’on te demande', () => {
	test('un pitch est lisible, rendu, et répondable', async ({ page }) => {
		let answered: string | null = null;
		await mockApi(page, [
			{ path: '/users/me/pitches', handler: json({ data: { pitches: [pitch] } }) },
			{
				path: '/pitches/p1/respond',
				handler: (route) => {
					answered = route.request().postData();
					return json({ data: {} })(route);
				}
			},
			...emptyRest
		]);

		await gotoHydrated(page, '/dashboard/opportunities');

		await expect(page.getByTestId('opportunities-page')).toBeVisible();
		await expect(page.getByText('Une boîte')).toBeVisible();
		// Le markdown du pitch est rendu, pas affiché brut.
		await expect(page.getByRole('heading', { name: 'Pourquoi toi' })).toBeVisible();
		await expect(page.getByText('## Pourquoi toi')).toBeHidden();
		// Ouvert n'est pas considéré : la page ne dit rien de plus.
		await expect(page.getByText('ouvert', { exact: true })).toBeVisible();

		await page.getByRole('button', { name: 'Ça m’intéresse' }).click();
		await expect.poll(() => answered).not.toBeNull();
		expect(JSON.parse(answered as unknown as string)).toEqual({ interested: true });
	});

	test('décliner n’exige pas de motif', async ({ page }) => {
		let answered: string | null = null;
		await mockApi(page, [
			{ path: '/users/me/pitches', handler: json({ data: { pitches: [pitch] } }) },
			{
				path: '/pitches/p1/respond',
				handler: (route) => {
					answered = route.request().postData();
					return json({ data: {} })(route);
				}
			},
			...emptyRest
		]);

		await gotoHydrated(page, '/dashboard/opportunities');
		await page.getByRole('button', { name: 'Pas intéressé' }).click();

		await expect(page.getByText(/Dix pitchs ne doivent pas dix explications/)).toBeVisible();
		await page.getByRole('button', { name: 'Décliner', exact: true }).click();

		await expect.poll(() => answered).not.toBeNull();
		// Pas de motif envoyé quand il n'y en a pas.
		expect(JSON.parse(answered as unknown as string)).toEqual({ interested: false });
	});

	test('un entretien propose ses créneaux, et en confirmer un les remplace', async ({ page }) => {
		let confirmed: string | null = null;
		await mockApi(page, [
			{ path: '/users/me/pitches', handler: json({ data: { pitches: [] } }) },
			{ path: '/users/me/reverse-recruitment', handler: json({ data: { posting: null } }) },
			{ path: '/users/me/recruitment-invitations', handler: json({ data: { invitations: [] } }) },
			{
				path: '/interviews/i1/confirm',
				handler: (route) => {
					confirmed = route.request().postData();
					return json({ data: { interview: {} } })(route);
				}
			},
			{
				path: '/users/me/interviews',
				handler: json({
					data: {
						interviews: [
							{
								id: 'i1',
								source_type: 'campaign',
								source_id: 'c1',
								talent_user_id: 'u1',
								enterprise_id: 'e1',
								proposed_slots: [
									{ start: '2026-09-01T09:00:00Z', end: '2026-09-01T09:45:00Z' },
									{ start: '2026-09-02T14:00:00Z', end: '2026-09-02T14:45:00Z' }
								],
								confirmed_slot: null,
								platform: 'meet',
								meeting_url: null,
								location: null,
								status: 'proposed',
								created_at: '2026-08-20T00:00:00Z'
							}
						]
					}
				})
			},
			{ path: '/users/me/trials', handler: json({ data: { trials: [] } }) }
		]);

		await gotoHydrated(page, '/dashboard/opportunities');

		await expect(page.getByTestId('opportunities-interviews')).toBeVisible();
		await expect(page.getByText('Choisis un créneau qui te va.')).toBeVisible();
		const slots = page.locator('[data-testid="opportunities-interviews"] button');
		await slots.first().click();

		await expect.poll(() => confirmed).not.toBeNull();
		// Les deux bornes partent, pas seulement le début.
		expect(JSON.parse(confirmed as unknown as string).slot).toEqual({
			start: '2026-09-01T09:00:00Z',
			end: '2026-09-01T09:45:00Z'
		});
	});

	test('un essai montre approuvé et en attente séparément', async ({ page }) => {
		await mockApi(page, [
			{ path: '/users/me/pitches', handler: json({ data: { pitches: [] } }) },
			{ path: '/users/me/reverse-recruitment', handler: json({ data: { posting: null } }) },
			{ path: '/users/me/recruitment-invitations', handler: json({ data: { invitations: [] } }) },
			{ path: '/users/me/interviews', handler: json({ data: { interviews: [] } }) },
			{
				path: '/users/me/trials',
				handler: json({
					data: {
						trials: [
							{
								id: 't1',
								enterprise_id: 'e1',
								talent_user_id: 'u1',
								username: 'ada',
								duration_weeks: 4,
								hourly_rate: '35',
								currency: 'EUR',
								platform_fee_percent: '10',
								converted_success_fee_percent: null,
								started_at: '2026-08-01T00:00:00Z',
								ends_at: '2026-09-01T00:00:00Z',
								ended_at: null,
								outcome: null,
								approved_hours: '32',
								pending_hours: '8'
							}
						]
					}
				})
			}
		]);

		await gotoHydrated(page, '/dashboard/opportunities');

		// Deux chiffres, jamais un : déclaré non approuvé n'est pas dû.
		await expect(page.getByText('32 h approuvées')).toBeVisible();
		await expect(page.getByText('8 h en attente')).toBeVisible();
	});

	test('rien à répondre se lit comme tel', async ({ page }) => {
		await mockApi(page, [
			{ path: '/users/me/pitches', handler: json({ data: { pitches: [] } }) },
			...emptyRest
		]);

		await gotoHydrated(page, '/dashboard/opportunities');
		await expect(page.getByText('Personne ne demande rien pour l’instant')).toBeVisible();
		// Sans annonce publiée, on dit quoi faire pour en recevoir.
		await expect(page.getByText(/Publie ce que tu cherches/)).toBeVisible();
	});
});

test.describe('Les journées d’un essai', () => {
	test('une journée refusée porte son motif', async ({ page }) => {
		await mockApi(page, [
			{
				path: '/trials/t1/hours',
				handler: json({
					data: {
						hours: [
							{
								id: 'h1',
								worked_on: '2026-08-03',
								hours: '7.5',
								summary: 'Migration du parser',
								approved_at: '2026-08-04T00:00:00Z',
								rejected_at: null,
								rejection_reason: null
							},
							{
								id: 'h2',
								worked_on: '2026-08-05',
								hours: '8',
								summary: 'Réunions',
								approved_at: null,
								rejected_at: '2026-08-06T00:00:00Z',
								rejection_reason: 'Hors périmètre de l’essai'
							}
						],
						approved_total: '7.5',
						pending_total: '0'
					}
				})
			}
		]);

		await gotoHydrated(page, '/dashboard/trials/t1');

		await expect(page.getByTestId('trial-hours-page')).toBeVisible();
		await expect(page.getByText('7.5 h approuvées')).toBeVisible();
		await expect(page.getByText('Approuvée', { exact: true })).toBeVisible();
		await expect(page.getByText('Refusée', { exact: true })).toBeVisible();
		// Ce sur quoi le client approuve, et pourquoi il a refusé.
		await expect(page.getByText('Motif : Hors périmètre de l’essai')).toBeVisible();
	});

	test('déclarer une journée envoie la date, les heures et le résumé', async ({ page }) => {
		let claimed: string | null = null;
		await mockApi(page, [
			{
				path: '/trials/t1/hours',
				handler: (route) => {
					if (route.request().method() === 'POST') {
						claimed = route.request().postData();
						return json({ data: { entry_id: 'h9' } })(route);
					}
					return json({ data: { hours: [], approved_total: '0', pending_total: '0' } })(route);
				}
			}
		]);

		await gotoHydrated(page, '/dashboard/trials/t1');
		await page.getByRole('button', { name: 'Déclarer une journée' }).first().click();

		await page.getByLabel('Jour travaillé').fill('2026-08-07');
		await page.getByLabel('Heures').fill('6.25');
		await page.getByLabel('Ce que tu as fait').fill('Correction du parser de dates');
		await page.getByRole('button', { name: 'Déclarer', exact: true }).click();

		await expect.poll(() => claimed).not.toBeNull();
		expect(JSON.parse(claimed as unknown as string)).toEqual({
			worked_on: '2026-08-07',
			hours: '6.25',
			summary: 'Correction du parser de dates'
		});
	});
});
