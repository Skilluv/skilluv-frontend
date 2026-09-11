/**
 * The onboarding workflow, end to end, for every discipline.
 *
 * One wizard serves all twelve now. What these cover is what a type-check
 * cannot: that a discipline which never had a page of its own is reachable and
 * renders its own vocabulary, that a question the backend serves as
 * several-free-text-answers can actually be answered, that finishing shows the
 * plan the save comes back with instead of discarding it, and that the index
 * tells the truth about where somebody stands.
 *
 * As in `ai-onboarding.test.ts`, the mocks are the *backend's* answer: the
 * page ships no vocabulary, so anything asserted here about the options had to
 * arrive over the wire.
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

/** A profile nobody has filled in. */
function emptyProfile(domain: string) {
	return { data: { domain, answers: {}, completed_at: null, skipped_at: null } };
}

/**
 * The code wizard, as `routes::domain_profile` serves it.
 *
 * Code asks the shared questions in its own words — `staff` is a rank the
 * design ladder has no word for — and `main_tools` is the open kind: the set
 * of things a developer works in is not a vocabulary the platform owns.
 */
const codeQuestions = {
	data: [
		{
			key: 'level',
			answer: 'single',
			allowed: ['beginner', 'junior', 'mid', 'senior', 'staff'],
			max_selections: null,
			max_len: null
		},
		{
			key: 'main_tools',
			answer: 'multi',
			allowed: [],
			max_selections: 3,
			max_len: 40
		}
	]
};

test.describe('every discipline has a wizard', () => {
	test('code is reachable and asks its own ladder, not the shared one', async ({ page }) => {
		await mockApi(page, [
			{ path: '/domain-profile/code/questions', handler: json(codeQuestions) },
			{ path: '/domain-profile/code', handler: json(emptyProfile('code')) }
		]);

		// `/code/onboarding` never existed. Code has a ladder, goals and a
		// tools question of its own server-side, and no way in from the front.
		await gotoHydrated(page, '/onboarding/domain/code');

		await expect(page.getByTestId('code-onboarding')).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Tu en es où ?' })).toBeVisible();
		// `staff` belongs to the code vocabulary alone.
		await expect(page.getByRole('button', { name: 'Staff' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Praticien' })).toHaveCount(0);
	});

	test('a slug the platform does not know is not a wizard', async ({ page }) => {
		await page.goto('/onboarding/domain/gardening');
		await expect(page.getByTestId('gardening-onboarding')).toHaveCount(0);
	});
});

test.describe('a question with no vocabulary can be answered', () => {
	test('several free-text answers commit as chips and are sent as a list', async ({ page }) => {
		let saved: string | null = null;
		await mockApi(page, [
			{ path: '/domain-profile/code/questions', handler: json(codeQuestions) },
			{
				path: '/domain-profile/code',
				handler: (route) => {
					if (route.request().method() === 'PUT') saved = route.request().postData();
					return json(emptyProfile('code'))(route);
				}
			}
		]);

		await gotoHydrated(page, '/onboarding/domain/code');
		await page.getByRole('button', { name: 'Staff' }).click();
		await page.getByRole('button', { name: 'Suivant' }).click();

		// Before the fix this question rendered a row of zero options: the
		// wizard iterated the vocabulary, and an open question has none. It
		// was on screen, captioned, and impossible to answer.
		const field = page.getByPlaceholder('Tape puis Entrée');
		await expect(field).toBeVisible();

		await field.fill('rust');
		await field.press('Enter');
		await field.fill('terraform');
		await field.press('Enter');
		await expect(page.getByTestId('tag-input-chips').getByText('rust')).toBeVisible();

		await page.getByRole('button', { name: 'Terminer' }).click();
		await expect.poll(() => saved).not.toBeNull();
		expect(JSON.parse(saved as unknown as string)).toEqual({
			level: 'staff',
			main_tools: ['rust', 'terraform']
		});
	});

	test('an answer to a question the domain has dropped is not sent back', async ({ page }) => {
		let saved: string | null = null;
		await mockApi(page, [
			{ path: '/domain-profile/code/questions', handler: json(codeQuestions) },
			{
				path: '/domain-profile/code',
				handler: (route) => {
					if (route.request().method() === 'PUT') {
						saved = route.request().postData();
						return json(emptyProfile('code'))(route);
					}
					// Answered before the wizard was reworded: `main_framework`
					// is stored and is no longer a question code asks.
					return json({
						data: {
							domain: 'code',
							answers: { level: 'senior', main_framework: 'pytorch' },
							completed_at: '2026-01-01T00:00:00Z',
							skipped_at: null
						}
					})(route);
				}
			}
		]);

		await gotoHydrated(page, '/onboarding/domain/code');
		// Prior answers come back so nobody refills a form they have filled.
		await expect(page.getByRole('button', { name: 'Senior' })).toHaveAttribute(
			'aria-pressed',
			'true'
		);

		await page.getByRole('button', { name: /Suivant|Passer celle-ci/ }).click();
		await page.getByRole('button', { name: 'Terminer' }).click();

		// The dead key must not ride along: an unknown key rejects the whole
		// body, so carrying it would lose every answer in the request.
		await expect.poll(() => saved).not.toBeNull();
		expect(JSON.parse(saved as unknown as string)).toEqual({ level: 'senior' });
	});

	test('the ceiling comes from the backend, and the field stops there', async ({ page }) => {
		await mockApi(page, [
			{ path: '/domain-profile/code/questions', handler: json(codeQuestions) },
			{ path: '/domain-profile/code', handler: json(emptyProfile('code')) }
		]);

		await gotoHydrated(page, '/onboarding/domain/code');
		// Nothing answered, so the forward button offers to skip rather than
		// to advance. Either wording moves on: a question with no answer is
		// skipped, not blocked.
		await page.getByRole('button', { name: /Suivant|Passer celle-ci/ }).click();

		const field = page.getByPlaceholder('Tape puis Entrée');
		for (const entry of ['rust', 'go', 'elixir']) {
			await field.fill(entry);
			await field.press('Enter');
		}

		// Three is what `max_selections` said, not a constant in the front.
		await expect(page.getByTestId('tag-input-chips').locator('li')).toHaveCount(3);
		await expect(field).toBeDisabled();
	});
});

test.describe('finishing the wizard shows what it bought', () => {
	const plan = {
		headline: 'Va aux missions, et garde un livrable public en parallèle.',
		because: 'Ton problème n’est pas d’apprendre le métier.',
		guides: ['toolkit-design'],
		feed_query: '/api/users/me/next-challenges?orientation=design-brand-identity',
		next_steps: ['Ouvre le tableau des missions.', 'Déclare tes portfolios existants.']
	};

	const designQuestions = {
		data: [
			{
				key: 'level',
				answer: 'single',
				allowed: ['debutant', 'senior'],
				max_selections: null,
				max_len: null
			}
		]
	};

	test('the plan replaces the questions instead of being toasted away', async ({ page }) => {
		await mockApi(page, [
			{ path: '/domain-profile/design/questions', handler: json(designQuestions) },
			{ path: '/guides/toolkit-design', handler: json({ data: { title: 'Toolkit design' } }) },
			{
				path: '/domain-profile/design',
				handler: (route) =>
					route.request().method() === 'PUT'
						? json({
								data: {
									domain: 'design',
									answers: {},
									completed_at: '2026-09-11T00:00:00Z',
									skipped_at: null,
									recommendation: plan
								}
							})(route)
						: json(emptyProfile('design'))(route)
			}
		]);

		await gotoHydrated(page, '/design/onboarding');
		await page.getByRole('button', { name: 'Senior' }).click();
		await page.getByRole('button', { name: 'Terminer' }).click();

		// The backend answers the wizard with a plan. The page used to toast
		// "Enregistré." and navigate away, discarding it — so six questions
		// bought a toast.
		const panel = page.getByTestId('wizard-recommendation');
		await expect(panel).toBeVisible();
		await expect(panel.getByRole('heading', { name: plan.headline })).toBeVisible();
		await expect(page.getByTestId('wizard-plan-steps').locator('li')).toHaveCount(2);

		// The guide is offered under its own title rather than its slug, and
		// points at the reader's route, not the API's.
		const guide = page.getByTestId('wizard-plan-guides').getByRole('link');
		await expect(guide).toHaveAttribute('href', '/guides/toolkit-design');
		await expect(guide).toHaveText(/Toolkit design/);

		// `feed_query` is an API path. Offering it as a link would hand
		// somebody raw JSON.
		await expect(page.getByRole('link', { name: /\/api\// })).toHaveCount(0);
	});
});

test.describe('the onboarding index', () => {
	test('lists every discipline and tells answered from dismissed', async ({ page }) => {
		await page.route('**/api/**', async (route) => {
			const path = new URL(route.request().url()).pathname;
			if (path.endsWith('/domain-profile/design')) {
				return json({
					data: {
						domain: 'design',
						answers: { level: 'senior' },
						completed_at: '2026-09-11T00:00:00Z',
						skipped_at: null
					}
				})(route);
			}
			if (path.endsWith('/domain-profile/game')) {
				return json({
					data: {
						domain: 'game',
						answers: {},
						completed_at: null,
						skipped_at: '2026-09-11T00:00:00Z'
					}
				})(route);
			}
			if (path.includes('/domain-profile/')) {
				const domain = path.split('/').pop() ?? '';
				return json(emptyProfile(domain))(route);
			}
			return json({ data: {} })(route);
		});

		await gotoHydrated(page, '/onboarding');

		// Twelve cards. Four of these disciplines have no hub of their own, so
		// a per-hub link could never have reached them.
		await expect(page.getByTestId('onboarding-index')).toBeVisible();
		await expect(page.locator('[data-testid^="onboarding-card-"]')).toHaveCount(12);

		// Answered and dismissed are different states, and the page says so:
		// merging them would be arguing with the person who dismissed it.
		await expect(page.getByTestId('onboarding-card-design')).toContainText('Répondu');
		await expect(page.getByTestId('onboarding-card-game')).toContainText(
			'Tu as demandé qu’on arrête'
		);
		await expect(page.getByTestId('onboarding-card-code')).toContainText('Pas encore répondu');
	});

	test('each card leads to that discipline’s wizard', async ({ page }) => {
		await mockApi(page, []);
		await gotoHydrated(page, '/onboarding');
		await expect(page.getByTestId('onboarding-card-audio')).toHaveAttribute(
			'href',
			'/onboarding/domain/audio'
		);
	});

	test('no i18n key leaks as a raw dotted path', async ({ page }) => {
		await mockApi(page, []);
		await gotoHydrated(page, '/onboarding');
		const body = await page.locator('body').innerText();
		expect(body).not.toMatch(/\b(onboardingIndex|domainWizard)\.[a-zA-Z]+/);
	});
});
