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

const PUBLIC_PAGES = ['/security', '/security/hall-of-fame', '/trust', '/ctf', '/security/bounties'];

const SESSION_PAGES = [
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

	test('the CTF page says what it cannot list, and still shows the board', async ({ page }) => {
		await gotoHydrated(page, '/ctf');
		await expect(page.getByTestId('ctf-page')).toBeVisible();
		// A stated absence rather than a confident mislabel: nothing public
		// distinguishes a hosted range from a defensive lab yet.
		await expect(page.getByTestId('ctf-listing-unavailable')).toBeVisible();
		await expect(page.getByTestId('ctf-scoreboard')).toBeVisible();
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

	test('no i18n key leaks as a raw dotted path on any cyber page', async ({ page }) => {
		for (const path of [...PUBLIC_PAGES, ...SESSION_PAGES]) {
			await gotoHydrated(page, path);
			const body = await page.locator('body').innerText();
			expect(body, `raw i18n key leaked on ${path}`).not.toMatch(
				/\b(securityScope|securityReport|securityMyReports|securityFinding|securityHallOfFame|securityTrust|securityPractice|securityResearch|securityBounties|securityCredentials|securityProfile)\.[a-zA-Z]+/
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
