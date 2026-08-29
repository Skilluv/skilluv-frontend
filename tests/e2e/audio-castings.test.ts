/**
 * `/audio/castings` and `/audio/castings/[id]`.
 *
 * The audio domain shipped a full backend — files, sources, castings, credits
 * — and the front had no page for any of it. Castings are the part a visitor
 * can act on without uploading a master.
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

const listing = {
	data: [
		{
			id: 'c1',
			slice_id: 's1',
			character_brief_md: '# Le gardien\nGrave, lent, jamais pressé.',
			sample_line_text: 'On ne passe pas.',
			target_language: 'fr-BE',
			max_audition_seconds: 90,
			is_blind: true,
			audition_deadline: '2027-01-01T00:00:00Z',
			status: 'open'
		}
	]
};

test.describe('Castings ouverts', () => {
	test('la liste montre la langue, l’aveugle et la réplique', async ({ page }) => {
		await mockApi(page, [{ path: '/audio/castings', handler: json(listing) }]);

		await gotoHydrated(page, '/audio/castings');

		await expect(page.getByRole('heading', { name: 'Castings voix' })).toBeVisible();
		await expect(page.getByText('fr-BE')).toBeVisible();
		await expect(page.getByText('À l’aveugle')).toBeVisible();
		await expect(page.getByText('On ne passe pas.')).toBeVisible();
		await expect(page.getByText('90s max')).toBeVisible();
	});

	test('le filtre de langue est passé tel quel au backend', async ({ page }) => {
		const asked: string[] = [];
		await mockApi(page, [
			{
				path: '/audio/castings',
				handler: (route) => {
					asked.push(route.request().url());
					return json(listing)(route);
				}
			}
		]);

		await gotoHydrated(page, '/audio/castings');
		await page.getByLabel('Langue').fill('fr-BE');
		await page.getByRole('button', { name: 'Filtrer' }).click();

		await expect.poll(() => asked.length).toBeGreaterThan(1);
		// `fr` ne répond pas pour `fr-BE` : l'accent fait partie du brief.
		expect(new URL(asked[asked.length - 1]).searchParams.get('language')).toBe('fr-BE');
	});

	test('aucun casting ouvert se lit comme tel', async ({ page }) => {
		await mockApi(page, [{ path: '/audio/castings', handler: json({ data: [] }) }]);

		await gotoHydrated(page, '/audio/castings');
		await expect(page.getByText('Aucun casting ouvert')).toBeVisible();
	});
});

const detail = {
	data: {
		casting: listing.data[0],
		blind: true,
		auditions: [
			{
				id: 'a1',
				voice: 'voix 1',
				notes_md: null,
				duration_ms: 41000,
				submitted_at: '2026-08-01T00:00:00Z'
			},
			{
				id: 'a2',
				voice: 'voix 2',
				notes_md: 'plus bas sur la fin',
				duration_ms: 38000,
				submitted_at: '2026-08-02T00:00:00Z'
			}
		]
	}
};

test.describe('Un casting', () => {
	test('le brief est rendu, les prises sont numérotées tant que c’est aveugle', async ({ page }) => {
		await mockApi(page, [{ path: '/audio/castings/c1', handler: json(detail) }]);

		await gotoHydrated(page, '/audio/castings/c1');

		await expect(page.getByRole('heading', { name: 'Le gardien' })).toBeVisible();
		await expect(page.getByText('Grave, lent, jamais pressé.')).toBeVisible();
		await expect(page.getByText('Prises (2)')).toBeVisible();
		await expect(page.getByText('voix 1')).toBeVisible();
		await expect(page.getByText('voix 2')).toBeVisible();
		await expect(page.getByText(/Les noms sont retenus/)).toBeVisible();
		// Not this viewer's casting: no decision action anywhere.
		await expect(page.getByRole('button', { name: 'Choisir cette voix' })).toHaveCount(0);
	});

	test('envoyer une prise poste le lien et prévient du remplacement', async ({ page }) => {
		let posted: string | null = null;
		await mockApi(page, [
			{
				path: '/audio/castings/c1/auditions',
				handler: (route) => {
					posted = route.request().postData();
					return json({ data: { id: 'a9' } })(route);
				}
			},
			{ path: '/audio/castings/c1', handler: json(detail) }
		]);

		await gotoHydrated(page, '/audio/castings/c1');
		await page.getByRole('button', { name: 'Envoyer une prise' }).click();

		await expect(page.getByText(/Une deuxième prise remplace la première/)).toBeVisible();
		await page.getByLabel('Lien vers la prise').fill('https://example.test/take.wav');
		await page.getByRole('button', { name: 'Envoyer', exact: true }).click();

		await expect.poll(() => posted).not.toBeNull();
		expect(JSON.parse(posted as unknown as string)).toMatchObject({
			audition_url: 'https://example.test/take.wav'
		});
	});

	test('un casting inconnu le dit', async ({ page }) => {
		await mockApi(page, [
			{
				path: '/audio/castings/nope',
				handler: json({ error: { code: 'RESOURCE_NOT_FOUND', message: 'x' }, meta: {} }, 404)
			}
		]);

		await gotoHydrated(page, '/audio/castings/nope');
		// Asserted against this page's own chrome too: the app 404 copy would
		// otherwise be close enough to pass.
		await expect(page.getByRole('link', { name: 'Tous les castings' })).toBeVisible();
		await expect(page.getByText("Ce casting n'existe pas.")).toBeVisible();
	});
});
