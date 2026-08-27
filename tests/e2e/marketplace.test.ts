/**
 * `/marketplace` and `/marketplace/[id]`.
 *
 * A whole pillar of the business model, served and unreachable.
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

const item = {
	id: 'i1',
	slug: 'sveltekit-starter',
	creator_user_id: 'someone-else',
	item_type: 'boilerplate',
	skill_domain: 'code',
	title: 'SvelteKit starter',
	description_md: '# Ce que ça contient\nUn squelette **prêt**.',
	thumbnail_url: 'https://cdn.test/thumb.png',
	preview_urls: [],
	license_type: 'commercial',
	license_summary: 'Utilisable en clientèle, pas revendable tel quel.',
	price: '24.00',
	currency: 'EUR',
	downloads_count: 12,
	rating_avg: '4.5',
	rating_count: 4,
	status: 'published'
};

test.describe('Le catalogue', () => {
	test('montre le prix, la licence et la note', async ({ page }) => {
		await mockApi(page, [{ path: '/marketplace/items', handler: json({ data: { items: [item] } }) }]);

		await gotoHydrated(page, '/marketplace');

		await expect(page.getByRole('heading', { name: 'Marché des créateurs' })).toBeVisible();
		await expect(page.getByText('SvelteKit starter')).toBeVisible();
		// La licence est sur la carte, pas enfouie dans la description.
		await expect(page.getByText('Usage commercial').first()).toBeVisible();
		await expect(page.getByText('4.5')).toBeVisible();
		// La commission est dite au lecteur, pas seulement au vendeur.
		await expect(page.getByText(/Skilluv garde 20%/)).toBeVisible();
	});

	test('filtrer par discipline redemande la liste', async ({ page }) => {
		const asked: string[] = [];
		await mockApi(page, [
			{
				path: '/marketplace/items',
				handler: (route) => {
					asked.push(route.request().url());
					return json({ data: { items: [item] } })(route);
				}
			}
		]);

		await gotoHydrated(page, '/marketplace');
		await page.getByRole('button', { name: 'Code' }).click();

		await expect.poll(() => asked.length).toBeGreaterThan(1);
		expect(new URL(asked[asked.length - 1]).searchParams.get('domain')).toBe('code');
	});

	test('un catalogue vide se lit comme tel', async ({ page }) => {
		await mockApi(page, [{ path: '/marketplace/items', handler: json({ data: { items: [] } }) }]);

		await gotoHydrated(page, '/marketplace');
		await expect(page.getByText('Rien en vente')).toBeVisible();
	});
});

test.describe('Une fiche', () => {
	test('imprime la licence en toutes lettres et le partage de la vente', async ({ page }) => {
		await mockApi(page, [
			{
				path: '/marketplace/items/i1',
				handler: json({
					data: { item, creator_receives: '20.40', platform_commission: '3.60' }
				})
			}
		]);

		await gotoHydrated(page, '/marketplace/i1');

		await expect(page.getByTestId('marketplace-item')).toBeVisible();
		await expect(page.getByRole('heading', { name: 'SvelteKit starter' })).toBeVisible();
		// Le backend refuse un résumé de licence trop court : donc on l'imprime.
		await expect(page.getByText('Utilisable en clientèle, pas revendable tel quel.')).toBeVisible();
		// Le partage, visible avant d'acheter comme avant de vendre.
		await expect(page.getByText(/Le créateur touche/)).toBeVisible();
		await expect(page.getByText(/Skilluv garde/)).toBeVisible();
		// Le markdown est rendu, pas affiché brut.
		await expect(page.getByRole('heading', { name: 'Ce que ça contient' })).toBeVisible();
		await expect(page.getByText('# Ce que ça contient')).toBeHidden();
	});

	test('acheter rend un jeton avec sa durée, pas un fichier', async ({ page }) => {
		await mockApi(page, [
			{
				path: '/marketplace/items/i1/purchase',
				handler: json({
					data: {
						purchase_id: 'p1',
						download_url: '/api/marketplace/downloads/tok123',
						valid_for_hours: 48,
						downloads_allowed: 10
					}
				})
			},
			{
				path: '/marketplace/items/i1',
				handler: json({
					data: { item, creator_receives: '20.40', platform_commission: '3.60' }
				})
			}
		]);

		await gotoHydrated(page, '/marketplace/i1');
		await page.getByRole('button', { name: 'Acheter' }).click();

		await expect(page.getByText('Acheté', { exact: true })).toBeVisible();
		// Les deux chiffres viennent de la réponse, pas d'une constante du front.
		await expect(page.getByText(/vit 48 heures/)).toBeVisible();
		await expect(page.getByText(/utilisé 10 fois/)).toBeVisible();
	});

	test('récupérer les fichiers dit honnêtement que ce ne sont pas des liens', async ({ page }) => {
		await mockApi(page, [
			{
				path: '/marketplace/downloads/tok123',
				handler: json({ data: { files: ['marketplace/ab/cd/kit.zip'] } })
			},
			{
				path: '/marketplace/items/i1/purchase',
				handler: json({
					data: {
						purchase_id: 'p1',
						download_url: '/api/marketplace/downloads/tok123',
						valid_for_hours: 48,
						downloads_allowed: 10
					}
				})
			},
			{
				path: '/marketplace/items/i1',
				handler: json({
					data: { item, creator_receives: '20.40', platform_commission: '3.60' }
				})
			}
		]);

		await gotoHydrated(page, '/marketplace/i1');
		await page.getByRole('button', { name: 'Acheter' }).click();
		await page.getByRole('button', { name: 'Récupérer les fichiers' }).click();

		await expect(page.getByText('marketplace/ab/cd/kit.zip')).toBeVisible();
		// SKI-330 : des clés de stockage, pas des liens. On le dit au lieu de
		// poser un bouton mort.
		await expect(page.getByText(/pas encore des liens/)).toBeVisible();
	});

	test('un item inconnu le dit', async ({ page }) => {
		await mockApi(page, [
			{
				path: '/marketplace/items/nope',
				handler: json({ error: { code: 'RESOURCE_NOT_FOUND', message: 'x' }, meta: {} }, 404)
			}
		]);

		await gotoHydrated(page, '/marketplace/nope');
		await expect(page.getByRole('link', { name: 'Tous les items' })).toBeVisible();
		await expect(page.getByText("Cet item n'existe pas, ou n'est pas publié.")).toBeVisible();
	});
});
