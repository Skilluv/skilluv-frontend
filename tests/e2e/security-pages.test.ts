import { test, expect } from '@playwright/test';
import { gotoHydrated } from './utils/hydration';

/**
 * The Skilluv Cyber surfaces render and hydrate with no backend.
 *
 * Three of these pages are public and unauthenticated by design — the scope,
 * the hall of fame and a finding's card — so they have to survive their own
 * endpoints answering 404 without falling back to an error screen. The rest
 * need a session, which in this suite means 401, and must render a page rather
 * than a stack trace.
 */

const PUBLIC_PAGES = [
	'/security',
	'/security/hall-of-fame',
	'/trust',
	'/ctf',
	'/blue-lab',
	'/security/bounties',
	'/security/missions'
];

const SESSION_PAGES = [
	'/security/missions/does-not-exist/workspace',
	'/settings/portfolios',
	'/security/report',
	'/security/reports',
	'/security/research-mode',
	'/settings/credentials'
];

test.describe('Skilluv Cyber pages', () => {
	test('the scope page shows both halves, in and out', async ({ page }) => {
		await gotoHydrated(page, '/security');
		await expect(page.getByTestId('security-scope-page')).toBeVisible();
		await expect(page.locator('h1')).toBeVisible();
	});

	test('the hall of fame renders its empty state rather than an error', async ({ page }) => {
		await gotoHydrated(page, '/security/hall-of-fame');
		await expect(page.getByTestId('security-hall-of-fame-page')).toBeVisible();
		await expect(page.locator('h1')).toBeVisible();
	});

	test('the trust centre renders', async ({ page }) => {
		await gotoHydrated(page, '/trust');
		await expect(page.getByTestId('trust-page')).toBeVisible();
	});

	test('the CTF page shows both the ranges and the board', async ({ page }) => {
		await gotoHydrated(page, '/ctf');
		await expect(page.getByTestId('ctf-page')).toBeVisible();
		// Listable since `security_kind` is serialised: the page asks for
		// ranges rather than for every security challenge and hoping.
		await expect(page.getByTestId('ctf-ranges')).toBeVisible();
		await expect(page.getByTestId('ctf-scoreboard')).toBeVisible();
	});

	test('the blue lab lists and says the analysis stays on your machine', async ({ page }) => {
		await gotoHydrated(page, '/blue-lab');
		await expect(page.getByTestId('blue-lab-page')).toBeVisible();
		// Where somebody decides whether to start: only the answers come back.
		await expect(page.getByTestId('blue-lab-offline-note')).toBeVisible();
	});

	test('the report form refuses an empty submission', async ({ page }) => {
		await gotoHydrated(page, '/security/report');
		await expect(page.getByTestId('security-report-page')).toBeVisible();
		await expect(page.getByTestId('report-submit')).toBeDisabled();
	});

	test('research mode leads with what the token does not grant', async ({ page }) => {
		await gotoHydrated(page, '/security/research-mode');
		await expect(page.getByTestId('research-mode-page')).toBeVisible();
		// The sentence sits next to the token, not in a footnote: this is where
		// somebody forms the belief that loses them the safe harbour.
		await expect(page.getByTestId('research-grants-nothing')).toBeVisible();
	});

	test('an unknown finding renders its own page, not an error screen', async ({ page }) => {
		await gotoHydrated(page, '/security/findings/00000000-0000-0000-0000-000000000000');
		await expect(page.getByTestId('security-finding-page')).toBeVisible();
	});

	test('the credentials page refuses an incomplete declaration', async ({ page }) => {
		await gotoHydrated(page, '/settings/credentials');
		await expect(page.getByTestId('credentials-page')).toBeVisible();
		await expect(page.getByRole('button', { name: /enregistrer|record it/i })).toBeDisabled();
	});

	test('the cyber onboarding wizard opens', async ({ page }) => {
		await gotoHydrated(page, '/security/onboarding');
		await expect(page.getByTestId('security-onboarding')).toBeVisible();
	});

	test('the cyber mission board renders', async ({ page }) => {
		await gotoHydrated(page, '/security/missions');
		await expect(page.getByTestId('security-missions-page')).toBeVisible();
	});

	test('a CTF target offers the flag form, a lab offers its artefact', async ({ page }) => {
		// Both submission surfaces existed as components and were mounted
		// nowhere: /ctf and /blue-lab linked to a challenge page that could not
		// take an answer. Which panel renders is read from `security_kind`, so
		// a challenge with no kind still gets the plain page it always had.
		await gotoHydrated(page, '/challenges/00000000-0000-0000-0000-000000000000');
		await expect(page.getByTestId('security-submit-flag')).toHaveCount(0);
		await expect(page.getByTestId('lab-artifact')).toHaveCount(0);
	});

	test('the cyber mission workspace renders for an unknown slug', async ({ page }) => {
		// Same shape as the design one: every panel loads with `allSettled`, so
		// a mission that does not exist must leave a page rather than a stack
		// trace. It exists at all because the delivery endpoints were never
		// design-specific — only the page was.
		await gotoHydrated(page, '/security/missions/does-not-exist/workspace');
		await expect(page.locator('h1')).toBeVisible();
	});

	test('the portfolio settings page renders and leads with the declared line', async ({ page }) => {
		// `portfoliosApi` was written and mounted nowhere, so every seeded
		// security platform — HackTheBox, TryHackMe, CTFtime, Intigriti,
		// YesWeHack — had no surface at all.
		await gotoHydrated(page, '/settings/portfolios');
		await expect(page.getByTestId('portfolio-settings-page')).toBeVisible();
		// Above the form on purpose: read before typing a follower count.
		await expect(page.getByTestId('portfolio-declared-note')).toBeVisible();
	});

	test('the cyber onboarding offers what to do next and who to ask', async ({ page }) => {
		// Both endpoints are domain-parameterised and had a design-only caller.
		await gotoHydrated(page, '/security/onboarding');
		await expect(page.getByTestId('security-next-steps')).toBeVisible();
	});

	test('the hall of fame carries the researcher of the week without inventing one', async ({
		page
	}) => {
		// The block is mounted, and renders *nothing* between weeks rather than
		// an empty "featured" heading — a distinction with nobody in it is
		// noise. With no backend that is the branch taken, so what this asserts
		// is that mounting it left the page intact.
		await gotoHydrated(page, '/security/hall-of-fame');
		await expect(page.getByTestId('security-hall-of-fame-page')).toBeVisible();
		await expect(page.getByTestId('security-featured')).toHaveCount(0);
	});

	test('no i18n key leaks as a raw dotted path on any cyber page', async ({ page }) => {
		for (const path of [...PUBLIC_PAGES, ...SESSION_PAGES]) {
			await gotoHydrated(page, path);
			const body = await page.locator('body').innerText();
			expect(body, `raw i18n key leaked on ${path}`).not.toMatch(
				/\b(securityScope|securityReport|securityMyReports|securityFinding|securityHallOfFame|securityTrust|securityPractice|securityResearch|securityBounties|securityCredentials|blueLab|missionWork|portfolioSettings|nextChallenges|mentorMatches|featuredTalent)\.[a-zA-Z]+/
			);
		}
	});

	test('every cyber page renders exactly one h1', async ({ page }) => {
		for (const path of [...PUBLIC_PAGES, ...SESSION_PAGES]) {
			await gotoHydrated(page, path);
			await expect(page.locator('h1'), `h1 count on ${path}`).toHaveCount(1);
		}
	});
});
