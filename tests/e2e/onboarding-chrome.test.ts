import { test, expect, type Page, type Route } from '@playwright/test';
import { gotoHydrated } from './utils/hydration';

/**
 * Onboarding has no chrome.
 *
 * The enlistment already had none, because it lives under `/auth`. Everything
 * after the account exists and before the person is onboarded did — completing
 * the profile, picking the trades, the first act — and those steps are not
 * optional. A navbar on a mandatory step is a way out of it: somebody halfway
 * through picking trades could wander into the leaderboards and never come
 * back, holding an account with neither a discipline nor a consent recorded.
 */

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

/** The first act only renders its states once the challenge itself loaded. */
async function mockRiteChallenge(page: Page) {
	await page.route('**/api/challenges/onboarding**', (route) =>
		json({
			data: {
				challenge: {
					id: 'c1',
					title: 'Ton premier commit',
					description: 'On te fork un starter.',
					instructions: '1. Lance le rite.',
					skill_domain: 'code',
					reward_fragments: 10,
					duration_minutes: null,
					is_domain_rite: true,
					is_onboarding: true,
					language: null,
					test_cases: null
				}
			}
		})(route)
	);
}

test.beforeEach(async ({ page, context }) => {
	await context.addCookies([
		{ name: 'access_token', value: 'challenger', domain: 'localhost', path: '/' }
	]);
	await page.addInitScript(() => {
		try {
			localStorage.setItem('skilluv-locale', 'fr');
		} catch {
			/* storage unavailable */
		}
	});
	await page.setViewportSize({ width: 1440, height: 900 });
	await mockApi(page, [
		{ path: '/notifications/unread-count', handler: json({ data: { unread_count: 3 } }) },
		{ path: '/users/me/orientations', handler: json({ data: { orientations: [] } }) }
	]);
});

/** Everything the reader must not be offered mid-onboarding. */
async function chrome(page: Page) {
	return {
		navbar: await page.locator('header nav').count(),
		bell: await page.getByTestId('notification-bell').count(),
		footer: await page.locator('footer').count(),
		// The rank pill lives in the user menu button beside the name.
		userPill: await page.locator('header [data-user-dropdown]').count(),
		prompt: await page.getByText(/Choisis tes orientations métier/i).count()
	};
}

test.describe('The onboarding steps', () => {
	for (const path of [
		'/onboarding/complete-profile',
		'/onboarding/orientations',
		'/challenges/onboarding'
	]) {
		test(`${path} carries no navbar, bell, user pill or footer`, async ({ page }) => {
			await gotoHydrated(page, path);
			expect(await chrome(page)).toEqual({
				navbar: 0,
				bell: 0,
				footer: 0,
				userPill: 0,
				prompt: 0
			});
		});
	}

	test('the prompt never flashes before the answer is in', async ({ page }) => {
		// `user.orientations` is undefined until the fetch lands, and "not asked
		// yet" was read as "has none": on every reload the banner appeared for a
		// moment and vanished as the answer arrived, telling somebody to choose
		// the trades they had already chosen.
		let release: (() => void) | undefined;
		const held = new Promise<void>((r) => (release = r));
		await page.route('**/api/users/me/orientations', async (route) => {
			await held;
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					data: {
						orientations: [
							{
								orientation_slug: 'dev-backend',
								orientation_name: 'Dev backend',
								mode: 'active',
								is_primary: true,
								started_at: '2026-01-01',
								ended_at: null,
								working_languages: ['fr']
							}
						]
					}
				})
			});
		});

		await gotoHydrated(page, '/challenges');
		// The request is still in flight and the banner must stay away.
		await page.waitForTimeout(600);
		await expect(page.getByText(/Choisis tes orientations métier/i)).toHaveCount(0);

		release?.();
		// And it stays away, because the answer says there is a trade.
		await page.waitForTimeout(600);
		await expect(page.getByText(/Choisis tes orientations métier/i)).toHaveCount(0);
	});

	test('the first act asks for a trade before offering to start', async ({ page }) => {
		// The API answers 400 when no trade is declared — the starter that gets
		// forked is chosen from it. A refusal you could have predicted is one
		// you should have prevented, so the button is not offered at all.
		await page.route('**/api/onboarding/bonjour-skilluv/status', (route) =>
			json({
				data: {
					started: false,
					onboarding: null,
					rite: { domain: 'code', form: 'fork', requires_github: true }
				}
			})(route)
		);
		await page.route('**/api/users/me/orientations', (route) =>
			json({ data: { orientations: [] } })(route)
		);

		await mockRiteChallenge(page);
		await gotoHydrated(page, '/challenges/onboarding');
		await expect(page.getByText(/Choisis d’abord un métier/i)).toBeVisible();
		await expect(page.getByTestId('rite-start')).toHaveCount(0);
	});

	test('with a trade but no GitHub, it asks to link the account first', async ({ page }) => {
		await page.route('**/api/onboarding/bonjour-skilluv/status', (route) =>
			json({
				data: {
					started: false,
					onboarding: null,
					rite: { domain: 'code', form: 'fork', requires_github: true }
				}
			})(route)
		);
		await page.route('**/api/users/me/orientations', (route) =>
			json({
				data: {
					orientations: [
						{
							orientation_slug: 'dev-backend',
							orientation_name: 'Dev backend',
							mode: 'active',
							is_primary: true,
							started_at: '2026-01-01',
							ended_at: null,
							working_languages: []
						}
					]
				}
			})(route)
		);
		await page.route('**/api/auth/me/oauth-providers', (route) =>
			json({ data: { providers: [] } })(route)
		);

		await mockRiteChallenge(page);
		await gotoHydrated(page, '/challenges/onboarding');
		await expect(page.getByText(/Ce rite se joue sur GitHub/i)).toBeVisible();
		await expect(page.getByTestId('rite-start')).toHaveCount(0);

		// Into GitHub and back here, not out to the settings page. Onboarding
		// lost its chrome so nobody wanders off it; sending them to a fully
		// chromed screen to do one thing would reopen that door, and they would
		// have to find their own way back to a step they were in the middle of.
		const link = page.getByRole('link', { name: /GitHub/i }).last();
		const href = await link.getAttribute('href');
		expect(href, 'the link must start the OAuth dance').toContain('/auth/github/start');
		expect(href, 'and come back to the step it left').toContain(
			`return_to=${encodeURIComponent('/challenges/onboarding')}`
		);
		expect(href, 'settings is not part of onboarding').not.toContain('/settings');
	});

	/** A started fork rite, with whatever the automatic check has written on it. */
	async function mockForkRite(page: Page, over: Record<string, unknown> = {}): Promise<void> {
		await page.route('**/api/onboarding/bonjour-skilluv/status', (route) =>
			json({
				data: {
					started: true,
					onboarding: {
						rite_form: 'fork',
						challenge_id: 'c1',
						starter_slug: 'starter-backend',
						fork_full_name: 'kofi/starter-backend',
						fork_html_url: 'https://github.com/kofi/starter-backend',
						status: 'pr_opened',
						pr_number: 7,
						pr_url: 'https://github.com/kofi/starter-backend/pull/7',
						check_refused_reason: null,
						check_ran_at: null,
						...over
					},
					rite: { domain: 'code', form: 'fork', requires_github: true }
				}
			})(route)
		);
	}

	test('a fork rite promises a verdict on the spot, not a reviewer', async ({ page }) => {
		// The five checks run on the webhook and write `completed` themselves.
		// There is no `rite_reviewer:code` capability any more, so the screen
		// must not tell anybody to wait for one.
		await mockForkRite(page, { check_ran_at: '2026-09-18T20:00:00Z' });

		await mockRiteChallenge(page);
		await gotoHydrated(page, '/challenges/onboarding');
		await expect(page.getByTestId('rite-fork-link')).toHaveAttribute(
			'href',
			'https://github.com/kofi/starter-backend'
		);
		await expect(page.getByText(/Pull request ouverte/i)).toBeVisible();
		await expect(page.getByText(/validé sur-le-champ/i)).toBeVisible();
		await expect(page.getByText(/relecteur/i)).toHaveCount(0);
	});

	test('an unchecked pull request reads as handed to a reviewer, not as pending', async ({
		page
	}) => {
		// The checks run inside the webhook handler and write `pr_opened` and
		// `check_ran_at` in one transaction, so this combination is never a
		// fork rite mid-check. It is the safety net: the row predates the
		// checks, or the starter's reference HELLO.md could not be read, and a
		// person has it either way.
		await mockForkRite(page);

		await mockRiteChallenge(page);
		await gotoHydrated(page, '/challenges/onboarding');
		await expect(page.getByText(/passée à un relecteur/i)).toBeVisible();
		// And the label follows: this one really is awaiting review.
		await expect(page.getByText(/en attente de relecture/i)).toBeVisible();
		// The promise of an immediate verdict is not made where it cannot be kept.
		await expect(page.getByText(/sur-le-champ/i)).toHaveCount(0);
	});

	test('a refused check names what is missing and invites another commit', async ({ page }) => {
		// A refusal is not terminal: the row stays at `forked` and the next
		// commit on the same pull request replays the checks. The screen has to
		// read as an invitation, which means the way forward is on it.
		await mockForkRite(page, {
			status: 'forked',
			check_refused_reason: 'the introduction is 2 characters; 30 is the least this asks for.',
			check_ran_at: '2026-09-18T20:00:00Z'
		});

		await mockRiteChallenge(page);
		await gotoHydrated(page, '/challenges/onboarding');
		await expect(page.getByText(/30 is the least this asks for/i)).toBeVisible();
		await expect(page.getByText(/pousse un nouveau commit/i)).toBeVisible();
		// Nothing that reads as an ending.
		await expect(page.getByText(/Rite abandonné/i)).toHaveCount(0);
	});

	test('the catalogue keeps its chrome: /challenges is not an onboarding step', async ({
		page
	}) => {
		// `/challenges/onboarding` is matched on the whole segment. Matching it as
		// a prefix would strip the navbar from the public catalogue.
		await gotoHydrated(page, '/challenges');
		const c = await chrome(page);
		expect(c.navbar).toBeGreaterThan(0);
		expect(c.bell).toBe(1);
		expect(c.footer).toBeGreaterThan(0);
	});
});
