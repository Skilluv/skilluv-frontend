/**
 * S6.6 (SKI-53) — /enterprise/pipeline: recruitment board.
 *
 * This is the recruiter's working surface. What matters is that a talent can be
 * added, annotated and removed, and that removing one asks first: the board is
 * shared with the whole workspace.
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

function entry(overrides: Record<string, unknown> = {}) {
	return {
		id: 'pe-1',
		talent_id: 'u-kofi',
		username: 'kofi',
		display_name: 'Kofi Adjovi',
		skill_domain: 'code',
		title: 'artisan',
		total_fragments: 1200,
		stage: 'to_contact',
		position: 0,
		notes: null,
		salary_proposed_eur: null,
		last_action_at: null,
		created_at: '2026-08-01T09:00:00Z',
		updated_at: '2026-08-01T09:00:00Z',
		...overrides
	};
}

const common: ApiRoute[] = [
	{ path: '/users/me/capabilities', handler: json({ data: [] }) },
	{ path: '/users/me/orientations', handler: json({ data: [] }) }
];

function pipelineRoute(entries: unknown[]): ApiRoute {
	return { path: '/enterprise/pipeline', handler: json({ data: { entries } }) };
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

test.describe('S6.6 enterprise pipeline', () => {
	// Six kanban columns side by side; a narrower viewport pushes cards out of
	// view and every card-level action becomes unreachable.
	test.use({ viewport: { width: 1600, height: 1000 } });

	test('affiche les talents du board et propose l export CSV', async ({ page }) => {
		await mockApi(page, [pipelineRoute([entry()]), ...common]);
		await gotoHydrated(page, '/enterprise/pipeline');

		await expect(page.getByText('Kofi Adjovi').first()).toBeVisible();
		await expect(page.getByRole('link', { name: /Export/i })).toHaveAttribute(
			'href',
			'/api/enterprise/pipeline/export.csv'
		);
	});

	test('ajouter un talent resout le pseudo puis poste son id', async ({ page }) => {
		let added: Record<string, unknown> | null = null;
		await mockApi(page, [
			{
				path: '/enterprise/pipeline',
				handler: (route) => {
					if (route.request().method() === 'POST') {
						added = route.request().postDataJSON();
						return json({ data: entry() })(route);
					}
					return json({ data: { entries: [] } })(route);
				}
			},
			{
				path: '/profile/kofi',
				handler: json({
					data: {
						user: { id: 'u-kofi', username: 'kofi', display_name: 'Kofi Adjovi' },
						stats: { challenges_completed: 0, total_fragments: 0, streak_current: 0, trust_score: 0 }
					}
				})
			},
			...common
		]);
		await gotoHydrated(page, '/enterprise/pipeline');

		await page.getByRole('button', { name: /Ajouter/i }).first().click();
		await page.getByPlaceholder('kofi_dev').fill('kofi');
		await page.getByRole('button', { name: 'Ajouter', exact: true }).last().click();

		await expect.poll(() => added).not.toBeNull();
		expect(added).toMatchObject({ talent_id: 'u-kofi', stage: 'to_contact' });
	});

	test('un pseudo inconnu est explique, pas avale', async ({ page }) => {
		await mockApi(page, [pipelineRoute([]), ...common]);
		await gotoHydrated(page, '/enterprise/pipeline');

		await page.getByRole('button', { name: /Ajouter/i }).first().click();
		await page.getByPlaceholder('kofi_dev').fill('inconnu');
		await page.getByRole('button', { name: 'Ajouter', exact: true }).last().click();

		await expect(page.getByText(/pseudo|talent/i).last()).toBeVisible();
	});

	test('un pseudo vide ne declenche aucun appel', async ({ page }) => {
		let posts = 0;
		await mockApi(page, [
			{
				path: '/enterprise/pipeline',
				handler: (route) => {
					if (route.request().method() === 'POST') posts++;
					return json({ data: { entries: [] } })(route);
				}
			},
			...common
		]);
		await gotoHydrated(page, '/enterprise/pipeline');

		await page.getByRole('button', { name: /Ajouter/i }).first().click();
		await page.getByRole('button', { name: 'Ajouter', exact: true }).last().click();

		await expect(page.getByText('Renseigne un pseudo')).toBeVisible();
		expect(posts).toBe(0);
	});

	test('editer une fiche enregistre notes et salaire propose', async ({ page }) => {
		let updated: Record<string, unknown> | null = null;
		await mockApi(page, [
			{
				path: '/enterprise/pipeline/pe-1',
				handler: (route) => {
					updated = route.request().postDataJSON();
					return json({ data: entry({ notes: 'Dispo en septembre' }) })(route);
				}
			},
			pipelineRoute([entry()]),
			...common
		]);
		await gotoHydrated(page, '/enterprise/pipeline');

		await page.getByRole('button', { name: 'Modifier' }).first().click();
		await expect(page.getByRole('heading', { name: /Modifier|Éditer/ })).toBeVisible();
		await page.getByPlaceholder(/Notes internes/).fill('Dispo en septembre');
		await page.getByPlaceholder('55000').fill('55000');
		await page.getByRole('button', { name: 'Enregistrer' }).click();

		await expect.poll(() => updated).not.toBeNull();
		// Regression: a numeric salary used to make the whole save throw.
		expect(updated).toMatchObject({
			notes: 'Dispo en septembre',
			salary_proposed_eur: 55000
		});
	});

	test('retirer un talent demande confirmation', async ({ page }) => {
		let removed = 0;
		await mockApi(page, [
			{
				path: '/enterprise/pipeline/pe-1',
				handler: (route) => {
					if (route.request().method() === 'DELETE') removed++;
					return json({ data: { ok: true } })(route);
				}
			},
			pipelineRoute([entry()]),
			...common
		]);
		await gotoHydrated(page, '/enterprise/pipeline');

		await page.getByRole('button', { name: /Retirer|Supprimer/i }).first().click();
		expect(removed).toBe(0);

		await page.getByRole('button', { name: /Retirer|Supprimer/i }).last().click();
		await expect.poll(() => removed).toBe(1);
	});
});
