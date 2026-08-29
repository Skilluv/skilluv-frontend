/**
 * `/ai` and `/ai/missions`.
 *
 * The backend served `/ai/artifacts` and `/ai/competitions` and nothing called
 * them, and the mission board existed only for design even though `/missions`
 * has always been one endpoint for every domain.
 */
import { test, expect, type Page, type Route } from '@playwright/test';
import { gotoHydrated } from './utils/hydration';

test.beforeEach(async ({ page }) => {
	await page.addInitScript(() => {
		try {
			localStorage.setItem('skilluv-locale', 'fr');
		} catch {
			// storage unavailable
		}
	});
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

const artifacts = {
	data: {
		artifacts: [
			{
				slice_id: 's1',
				title: 'Segmentation temps réel',
				ai_subtype: 'ml_model',
				ai_frameworks: ['pytorch', 'onnx'],
				hosting_url: 'https://huggingface.co/x/y',
				model_size_params: 7_000_000_000,
				author_username: 'ada',
				orientation_slug: 'ml-engineer',
				downloads_recent: null,
				likes_count: 12
			}
		]
	}
};

const competitions = {
	data: {
		competitions: [
			{
				id: 'c1',
				platform: 'Kaggle',
				title: 'Calibration benchmark',
				url: 'https://kaggle.test/x',
				why_this_one: 'La seule qui note la calibration et pas seulement l’exactitude.',
				deadline: null,
				prize_note: null,
				orientation_slugs: ['ml-engineer']
			}
		]
	}
};

test.describe('La page IA', () => {
	test('montre les artefacts vérifiés et les compétitions curées', async ({ page }) => {
		await mockApi(page, [
			{ path: '/ai/artifacts', handler: json(artifacts) },
			{ path: '/ai/competitions', handler: json(competitions) }
		]);

		await gotoHydrated(page, '/ai');

		await expect(page.getByRole('heading', { name: 'L’IA sur Skilluv' })).toBeVisible();
		await expect(page.getByText('Segmentation temps réel')).toBeVisible();
		// 7 milliards de paramètres se lit « 7B », pas 7000000000.
		await expect(page.getByText('7B')).toBeVisible();
		await expect(page.getByText('pytorch')).toBeVisible();

		// Une plateforme qui ne publie aucun chiffre reste muette : un 0 se
		// lirait comme un verdict.
		await expect(page.getByText('Calibration benchmark')).toBeVisible();
		// Un classement en continu n'a pas de date, et en inventer une serait
		// une invention.
		await expect(page.getByText('En continu')).toBeVisible();
		await expect(page.getByText(/pas seulement l’exactitude/)).toBeVisible();
	});

	test('filtrer par sous-type redemande la liste', async ({ page }) => {
		const asked: string[] = [];
		await mockApi(page, [
			{
				path: '/ai/artifacts',
				handler: (route) => {
					asked.push(route.request().url());
					return json(artifacts)(route);
				}
			},
			{ path: '/ai/competitions', handler: json(competitions) }
		]);

		await gotoHydrated(page, '/ai');
		await page.getByRole('button', { name: 'Jeu de données' }).click();

		await expect.poll(() => asked.length).toBeGreaterThan(1);
		expect(new URL(asked[asked.length - 1]).searchParams.get('subtype')).toBe('dataset');
	});

	test('sans artefact publié, la section le dit', async ({ page }) => {
		await mockApi(page, [
			{ path: '/ai/artifacts', handler: json({ data: { artifacts: [] } }) },
			{ path: '/ai/competitions', handler: json({ data: { competitions: [] } }) }
		]);

		await gotoHydrated(page, '/ai');
		await expect(page.getByText('Rien de publié pour l’instant')).toBeVisible();
		await expect(page.getByText('Rien d’ouvert en ce moment.')).toBeVisible();
	});
});

test.describe('Le board de missions IA', () => {
	test('interroge /missions filtré sur le domaine, pas une route par domaine', async ({ page }) => {
		let browsed = '';
		await mockApi(page, [
			{ path: '/missions/types', handler: json({ data: { mission_types: [] } }) },
			{
				path: '/missions',
				handler: (route) => {
					browsed = route.request().url();
					return json({ data: { missions: [] } })(route);
				}
			}
		]);

		await gotoHydrated(page, '/ai/missions');

		await expect(page.getByTestId('ai-missions-page')).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Missions IA' })).toBeVisible();
		await expect.poll(() => browsed).not.toBe('');
		// Le même endpoint que le board design : c'est ce qui fait qu'une
		// mission IA et une mission design partagent workflow, commission et
		// voie de litige.
		expect(new URL(browsed).pathname).toBe('/api/missions');
		expect(new URL(browsed).searchParams.get('skill_domain')).toBe('ai');
	});
});
