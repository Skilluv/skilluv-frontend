/**
 * `/guides` and `/guides/[slug]`.
 *
 * The backend served `/api/guides` for all eleven disciplines and no page
 * called it, so every onboarding guide, toolkit and template seeded since
 * migration 0199 was unreachable.
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

const listing = {
	data: [
		{
			slug: 'onboarding-audio-composition',
			kind: 'onboarding',
			skill_domain: 'audio',
			reviewer_group: 'composition',
			locale: 'fr',
			title: 'Débuter en composition',
			summary: 'Ce que le brief impose, ce qu’il laisse.'
		},
		{
			slug: 'toolkit-ai',
			kind: 'toolkit',
			skill_domain: 'ai',
			reviewer_group: null,
			locale: 'en',
			title: 'AI toolkit',
			summary: 'What to install and what you can reach for free.'
		},
		{
			slug: 'brief-audio-score',
			kind: 'brief_template',
			skill_domain: 'audio',
			reviewer_group: null,
			locale: 'fr',
			title: 'Brief — musique originale',
			summary: 'Pour l’entreprise qui commande.'
		}
	]
};

test.describe('Catalogue des guides', () => {
	test('les guides sont groupés par discipline, briefs exclus par défaut', async ({ page }) => {
		await mockApi(page, [{ path: '/guides', handler: json(listing) }]);

		await gotoHydrated(page, '/guides');

		await expect(page.getByRole('heading', { name: 'Guides et modèles' })).toBeVisible();
		await expect(page.getByText('Débuter en composition')).toBeVisible();
		await expect(page.getByText('AI toolkit')).toBeVisible();
		// A brief is written by whoever commissions the work; this listing is
		// read by contributors, so it is off until asked for.
		await expect(page.getByText('Brief — musique originale')).toBeHidden();
	});

	test('demander les briefs les fait apparaître, avec la mise en garde', async ({ page }) => {
		await mockApi(page, [{ path: '/guides', handler: json(listing) }]);

		await gotoHydrated(page, '/guides');
		await page.getByRole('button', { name: 'Modèle de brief' }).click();

		await expect(page.getByText('Brief — musique originale')).toBeVisible();
		await expect(page.getByText(/celui qui commande le travail/)).toBeVisible();
		await expect(page.getByText('Débuter en composition')).toBeHidden();
	});

	test('filtrer par discipline redemande la liste au backend', async ({ page }) => {
		const asked: string[] = [];
		await mockApi(page, [
			{
				path: '/guides',
				handler: (route) => {
					asked.push(route.request().url());
					return json(listing)(route);
				}
			}
		]);

		await gotoHydrated(page, '/guides');
		await page.getByRole('button', { name: 'Audio' }).click();

		await expect.poll(() => asked.length).toBeGreaterThan(1);
		expect(new URL(asked[asked.length - 1]).searchParams.get('domain')).toBe('audio');
		// The locale header is the whole reason a French reader sees French.
		expect(asked.length).toBeGreaterThan(0);
	});

	test('un catalogue vide se lit comme tel', async ({ page }) => {
		await mockApi(page, [{ path: '/guides', handler: json({ data: [] }) }]);

		await gotoHydrated(page, '/guides');
		await expect(page.getByText('Aucun guide ici pour l’instant')).toBeVisible();
	});
});

const guide = {
	data: {
		slug: 'onboarding-audio-composition',
		kind: 'onboarding',
		skill_domain: 'audio',
		reviewer_group: 'composition',
		locale: 'fr',
		title: 'Débuter en composition',
		summary: 'Ce que le brief impose.',
		body_md: [
			'# Débuter en composition',
			'',
			'La contrainte arrive **en premier**.',
			'',
			'## Les trente premiers jours',
			'1. Le premier morceau court.',
			'2. La boucle.',
			'',
			'| Nom | Type |',
			'|---|---|',
			'| durée | secondes |'
		].join('\n')
	}
};

test.describe('Un guide', () => {
	test('le markdown est rendu, pas affiché brut', async ({ page }) => {
		await mockApi(page, [{ path: '/guides/onboarding-audio-composition', handler: json(guide) }]);

		await gotoHydrated(page, '/guides/onboarding-audio-composition');

		await expect(page.getByRole('heading', { name: 'Débuter en composition', level: 1 })).toBeVisible();
		// The `#` heading of the body becomes a section heading under the page
		// title, and the markers themselves never reach the reader.
		await expect(
			page.getByRole('heading', { name: 'Les trente premiers jours' })
		).toBeVisible();
		await expect(page.getByText('en premier', { exact: true })).toBeVisible();
		await expect(page.locator('[data-testid="guide-article"] ol li')).toHaveCount(2);
		await expect(page.locator('[data-testid="guide-article"] table')).toBeVisible();
		await expect(page.getByText('## Les trente premiers jours')).toBeHidden();
	});

	test('un slug inconnu le dit', async ({ page }) => {
		await mockApi(page, [
			{
				path: '/guides/nope',
				handler: json(
					{ error: { code: 'RESOURCE_NOT_FOUND', message: 'not found' }, meta: {} },
					404
				)
			}
		]);

		await gotoHydrated(page, '/guides/nope');
		// Asserted against the guide page's own chrome, not only the message:
		// the app's 404 copy also contains "n'existe pas", so a missing route
		// would otherwise pass this test.
		await expect(page.getByRole('link', { name: 'Tous les guides' })).toBeVisible();
		await expect(page.getByText("Ce guide n'existe pas, ou n'est pas publié.")).toBeVisible();
	});
});
