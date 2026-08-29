/**
 * S4.5 (SKI-52) — /certifications/attempts/[id]: start, submit, verdict.
 *
 * A paid, credential-issuing flow that had no coverage: nothing verified the
 * pass screen, the verification code, or the failure and overtime verdicts.
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

/** Deadline relative to the run, otherwise the attempt reads as overtime. */
const startPayload = {
	data: {
		attempt_id: 'att-1',
		challenge_ids: ['ch-1', 'ch-2'],
		duration_minutes: 60,
		deadline: new Date(Date.now() + 60 * 60_000).toISOString()
	}
};

function verdict(overrides: Record<string, unknown> = {}) {
	return {
		data: {
			attempt_id: 'att-1',
			status: 'passed',
			score: 82,
			passing_score: 70,
			passed: true,
			overtime: false,
			certification_title: 'Rust Backend',
			diploma_id: 'dip-1',
			verification_code: 'SKV-2026-ABCD',
			...overrides
		}
	};
}

const common: ApiRoute[] = [
	{ path: '/users/me/capabilities', handler: json({ data: [] }) },
	{ path: '/users/me/orientations', handler: json({ data: [] }) }
];

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

test.describe('S4.5 certification attempt', () => {
	test('propose de demarrer la tentative', async ({ page }) => {
		await mockApi(page, common);
		await gotoHydrated(page, '/certifications/attempts/att-1');

		await expect(page.getByText('Paiement confirmé')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Démarrer maintenant' })).toBeVisible();
	});

	test('demarrer affiche le temps restant et le bouton de soumission', async ({ page }) => {
		await mockApi(page, [
			{ path: '/certifications/attempts/att-1/start', handler: json(startPayload) },
			...common
		]);
		await gotoHydrated(page, '/certifications/attempts/att-1');

		await page.getByRole('button', { name: 'Démarrer maintenant' }).click();
		await expect(page.getByText('Temps restant')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Terminer et soumettre' })).toBeVisible();
	});

	test('une reussite affiche le score et le code de verification', async ({ page }) => {
		await mockApi(page, [
			{ path: '/certifications/attempts/att-1/start', handler: json(startPayload) },
			{ path: '/certifications/attempts/att-1/submit', handler: json(verdict()) },
			...common
		]);
		await gotoHydrated(page, '/certifications/attempts/att-1');

		await page.getByRole('button', { name: 'Démarrer maintenant' }).click();
		await page.getByRole('button', { name: 'Terminer et soumettre' }).click();

		await expect(page.getByText('Certification obtenue')).toBeVisible();
		await expect(page.getByText('82')).toBeVisible();
		await expect(page.getByText('SKV-2026-ABCD')).toBeVisible();
		await expect(page.getByRole('link', { name: 'Voir mes diplômes' })).toBeVisible();
	});

	test('un score insuffisant ne delivre pas de code', async ({ page }) => {
		await mockApi(page, [
			{ path: '/certifications/attempts/att-1/start', handler: json(startPayload) },
			{
				path: '/certifications/attempts/att-1/submit',
				handler: json(
					verdict({
						status: 'failed',
						score: 41,
						passed: false,
						diploma_id: null,
						verification_code: null
					})
				)
			},
			...common
		]);
		await gotoHydrated(page, '/certifications/attempts/att-1');

		await page.getByRole('button', { name: 'Démarrer maintenant' }).click();
		await page.getByRole('button', { name: 'Terminer et soumettre' }).click();

		await expect(page.getByRole('heading', { name: 'Score insuffisant.' })).toBeVisible();
		await expect(page.getByText('Code de vérification')).toHaveCount(0);
		await expect(page.getByRole('link', { name: 'Réessayer plus tard' })).toBeVisible();
	});

	test('un depassement de temps est annonce comme tel', async ({ page }) => {
		await mockApi(page, [
			{ path: '/certifications/attempts/att-1/start', handler: json(startPayload) },
			{
				path: '/certifications/attempts/att-1/submit',
				handler: json(
					verdict({
						status: 'failed',
						score: 75,
						passed: false,
						overtime: true,
						diploma_id: null,
						verification_code: null
					})
				)
			},
			...common
		]);
		await gotoHydrated(page, '/certifications/attempts/att-1');

		await page.getByRole('button', { name: 'Démarrer maintenant' }).click();
		await page.getByRole('button', { name: 'Terminer et soumettre' }).click();

		await expect(page.getByRole('heading', { name: 'Temps écoulé.' })).toBeVisible();
	});
});
