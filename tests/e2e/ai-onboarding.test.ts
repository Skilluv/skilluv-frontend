/**
 * `/ai/onboarding` — the wizard rendered from what the backend serves.
 *
 * The whole point of the surface is that it ships no vocabulary: the mocks
 * below are the *backend's* answer, and the page has to render whatever comes
 * back, including a value it has no translation for.
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

const questions = {
	data: [
		{
			key: 'level',
			answer: 'single',
			allowed: ['debutant', 'practitioner', 'researcher'],
			max_selections: null,
			max_len: null
		},
		{
			key: 'main_frameworks',
			answer: 'multi',
			allowed: ['pytorch', 'jax', 'tensorflow'],
			max_selections: 2,
			max_len: null
		},
		{
			key: 'huggingface_username',
			answer: 'text',
			allowed: [],
			max_selections: null,
			max_len: 60
		},
		{
			key: 'preferred_families',
			answer: 'multi',
			// A vocabulary from the orientations table: no translation exists
			// for it, and the wizard has to show it anyway.
			allowed: ['llm-engineer', 'nlp-engineer'],
			max_selections: 2,
			max_len: null
		}
	]
};

const empty = { data: { domain: 'ai', answers: {} } };

test.describe('Le wizard IA', () => {
	test('rend les questions que le backend annonce, traduites ou non', async ({ page }) => {
		await mockApi(page, [
			{ path: '/domain-profile/ai/questions', handler: json(questions) },
			{ path: '/domain-profile/ai', handler: json(empty) }
		]);

		await gotoHydrated(page, '/ai/onboarding');

		await expect(page.getByTestId('ai-onboarding')).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Tu en es où ?' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Praticien' })).toBeVisible();
		await expect(page.getByText('Question 1 sur 4')).toBeVisible();
		// Déclaré, jamais une affirmation : c'est dit dès l'en-tête.
		await expect(page.getByText(/Déclaré, jamais une affirmation/)).toBeVisible();
	});

	test('une question multi respecte son plafond', async ({ page }) => {
		await mockApi(page, [
			{ path: '/domain-profile/ai/questions', handler: json(questions) },
			{ path: '/domain-profile/ai', handler: json(empty) }
		]);

		await gotoHydrated(page, '/ai/onboarding');
		await page.getByRole('button', { name: 'Praticien' }).click();
		await page.getByRole('button', { name: 'Suivant' }).click();

		await expect(page.getByText('Jusqu’à 2.')).toBeVisible();
		await page.getByRole('button', { name: 'PyTorch' }).click();
		await page.getByRole('button', { name: 'JAX' }).click();
		await page.getByRole('button', { name: 'TensorFlow' }).click();

		// Le plafond vient du backend, pas d'une constante du front.
		await expect(page.getByText(/2 réponses au maximum/)).toBeVisible();
		await expect(page.getByRole('button', { name: 'TensorFlow' })).toHaveAttribute(
			'aria-pressed',
			'false'
		);
	});

	test('un vocabulaire sans traduction s’affiche quand même', async ({ page }) => {
		await mockApi(page, [
			{ path: '/domain-profile/ai/questions', handler: json(questions) },
			{ path: '/domain-profile/ai', handler: json(empty) }
		]);

		await gotoHydrated(page, '/ai/onboarding');
		for (let i = 0; i < 3; i++) {
			await page.getByRole('button', { name: /Suivant|Passer celle-ci/ }).click();
		}

		// `preferred_families` vient de la table des orientations : aucune
		// traduction ne peut exister à l'avance, et un slug vaut mieux qu'une
		// puce vide que personne ne peut cliquer.
		await expect(page.getByRole('button', { name: 'llm-engineer' })).toBeVisible();
	});

	test('terminer envoie seulement ce qui a été répondu', async ({ page }) => {
		let saved: string | null = null;
		await mockApi(page, [
			{ path: '/domain-profile/ai/questions', handler: json(questions) },
			{
				path: '/domain-profile/ai',
				handler: (route) => {
					if (route.request().method() === 'PUT') {
						saved = route.request().postData();
						return json(empty)(route);
					}
					return json(empty)(route);
				}
			}
		]);

		await gotoHydrated(page, '/ai/onboarding');
		await page.getByRole('button', { name: 'Praticien' }).click();
		await page.getByRole('button', { name: 'Suivant' }).click();
		await page.getByRole('button', { name: 'PyTorch' }).click();
		await page.getByRole('button', { name: 'Suivant' }).click();
		await page.getByRole('button', { name: 'Passer celle-ci' }).click();
		await page.getByRole('button', { name: 'Terminer' }).click();

		await expect.poll(() => saved).not.toBeNull();
		// Une question sans réponse est passée, pas bloquée, et n'est pas
		// envoyée vide.
		expect(JSON.parse(saved as unknown as string)).toEqual({
			level: 'practitioner',
			main_frameworks: ['pytorch']
		});
	});

	test('tout passer est toujours à portée', async ({ page }) => {
		let skipped = false;
		await mockApi(page, [
			{ path: '/domain-profile/ai/questions', handler: json(questions) },
			{
				path: '/domain-profile/ai/skip',
				handler: (route) => {
					skipped = true;
					return route.fulfill({ status: 204, body: '' });
				}
			},
			{ path: '/domain-profile/ai', handler: json(empty) }
		]);

		await gotoHydrated(page, '/ai/onboarding');
		await page.getByRole('button', { name: 'Tout passer' }).click();
		await expect.poll(() => skipped).toBe(true);
	});
});
