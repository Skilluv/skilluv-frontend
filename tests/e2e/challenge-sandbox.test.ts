/**
 * S2.3 (SKI-50) — /challenges/[id]/sandbox: run then submit.
 *
 * The most valuable page of the product had no coverage at all: nothing checked
 * that running code surfaces its output, nor that a submission renders the
 * success or the failure screen.
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

const challenge = {
	id: 'ch-1',
	title: 'Inverser une chaine',
	description: 'Ecris une fonction qui inverse une chaine.',
	instructions: 'Lis stdin, ecris la chaine inversee sur stdout.',
	skill_domain: 'code',
	difficulty: 2,
	mode: 'solo',
	duration_minutes: 30,
	ai_allowed: false,
	tone: 'serious',
	language: 'python',
	prerequisite_fragments: 0,
	reward_fragments: 50,
	is_onboarding: false,
	status: 'published',
	is_community: false,
	featured: false,
	vote_count: 0,
	test_cases: null,
	// Deliberately different from the stdout the tests return, so an assertion
	// on the run output cannot accidentally match the expected-output block.
	expected_output: 'valeur attendue',
	created_by: 'skilluv',
	created_at: '2026-07-01',
	updated_at: '2026-07-01'
};

/** Routes every sandbox test needs, plus the per-test overrides. */
function baseRoutes(extra: ApiRoute[] = []): ApiRoute[] {
	return [
		...extra,
		{
			path: '/challenges/ch-1/timer',
			handler: json({
				data: {
					submission_id: 'sub-0',
					started_at: '2026-08-11T10:00:00Z',
					expires_at: null,
					remaining_seconds: null,
					expired: false,
					has_timer: false
				}
			})
		},
		{ path: '/challenges/ch-1', handler: json({ data: { challenge } }) },
		{
			path: '/sandbox/languages',
			handler: json({ data: [{ id: 71, name: 'Python (3.8.1)', slug: 'python' }] })
		},
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

test.describe('S2.3 challenge sandbox', () => {
	test('affiche les instructions et les actions', async ({ page }) => {
		await mockApi(page, baseRoutes());
		await gotoHydrated(page, '/challenges/ch-1/sandbox');

		await expect(page.getByRole('heading', { name: 'Instructions' })).toBeVisible();
		await expect(page.getByText('Lis stdin, ecris la chaine inversee sur stdout.')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Tester' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Soumettre' })).toBeVisible();
	});

	test('tester affiche la sortie standard', async ({ page }) => {
		await mockApi(
			page,
			baseRoutes([
				{
					path: '/sandbox/execute',
					handler: json({
						data: {
							execution: {
								stdout: 'olleh',
								stderr: null,
								compile_output: null,
								time: '0.01',
								memory: 3200,
								status: { id: 3, description: 'Accepted' }
							},
							matches_expected: true
						}
					})
				}
			])
		);
		await gotoHydrated(page, '/challenges/ch-1/sandbox');

		await page.getByRole('button', { name: 'Tester' }).click();
		await expect(page.getByText('olleh', { exact: true })).toBeVisible();
	});

	test('tester remonte stderr sans masquer l erreur', async ({ page }) => {
		await mockApi(
			page,
			baseRoutes([
				{
					path: '/sandbox/execute',
					handler: json({
						data: {
							execution: {
								stdout: null,
								stderr: 'NameError: name x is not defined',
								compile_output: null,
								time: '0.01',
								memory: 3200,
								status: { id: 11, description: 'Runtime Error' }
							},
							matches_expected: false
						}
					})
				}
			])
		);
		await gotoHydrated(page, '/challenges/ch-1/sandbox');

		await page.getByRole('button', { name: 'Tester' }).click();
		await expect(page.getByText(/NameError: name x is not defined/)).toBeVisible();
	});

	test('une soumission reussie affiche les fragments gagnes', async ({ page }) => {
		await mockApi(
			page,
			baseRoutes([
				{
					path: '/challenges/ch-1/submit',
					handler: json({
						data: {
							submission: { id: 'sub-1', challenge_id: 'ch-1', status: 'passed' },
							fragments_earned: 50,
							perseverance_bonus: 0,
							profile_activated: false,
							message: 'Bravo'
						}
					})
				}
			])
		);
		await gotoHydrated(page, '/challenges/ch-1/sandbox');

		await page.getByRole('button', { name: 'Soumettre' }).click();
		await expect(page.getByRole('heading', { name: 'Challenge réussi !' })).toBeVisible();
		await expect(page.getByText('+50 fragments')).toBeVisible();
	});

	test('une soumission echouee propose de retenter', async ({ page }) => {
		await mockApi(
			page,
			baseRoutes([
				{
					path: '/challenges/ch-1/submit',
					handler: json({
						data: {
							submission: { id: 'sub-2', challenge_id: 'ch-1', status: 'failed' },
							fragments_earned: 0,
							perseverance_bonus: 5,
							profile_activated: false,
							message: 'Pas encore'
						}
					})
				}
			])
		);
		await gotoHydrated(page, '/challenges/ch-1/sandbox');

		await page.getByRole('button', { name: 'Soumettre' }).click();
		await expect(page.getByRole('heading', { name: 'Pas encore.' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Retenter' })).toBeVisible();
	});

	test('la premiere reussite active le profil et salue l apprenti', async ({ page }) => {
		await mockApi(
			page,
			baseRoutes([
				{
					path: '/challenges/ch-1/submit',
					handler: json({
						data: {
							submission: { id: 'sub-3', challenge_id: 'ch-1', status: 'passed' },
							fragments_earned: 50,
							perseverance_bonus: 0,
							profile_activated: true,
							message: 'Bienvenue'
						}
					})
				}
			])
		);
		await gotoHydrated(page, '/challenges/ch-1/sandbox');

		await page.getByRole('button', { name: 'Soumettre' }).click();
		await expect(page.getByRole('heading', { name: /Bienvenue, Apprenti/ })).toBeVisible();
	});
});
