import { test, expect } from '@playwright/test';
import { gotoHydrated } from './utils/hydration';

/**
 * The five business pillars of SKI-329, whose backends were served and whose
 * fronts did not exist.
 *
 * Every page here talks to endpoints the mock backend answers 404 or 401 for,
 * which is the point: each was built to render a page rather than a stack
 * trace when its listing comes back empty. A surface that only works with data
 * is a surface nobody can open on their first day.
 */

const PAGES = [
	'/requests',
	'/creator',
	'/work',
	'/settings/portfolios',
	'/security/competitions'
];

test.describe('Business pillar pages', () => {
	test('the solicitations inbox renders and says what it cannot list', async ({ page }) => {
		await gotoHydrated(page, '/requests');
		await expect(page.getByTestId('requests-page')).toBeVisible();
		// Consultations and engagements can be answered and not listed. An empty
		// shelf would read as "nobody asked you"; the sentence says otherwise.
		await expect(page.getByTestId('requests-unlisted-note')).toBeVisible();
	});

	test('the creator page renders', async ({ page }) => {
		await gotoHydrated(page, '/creator');
		await expect(page.getByTestId('creator-page')).toBeVisible();
	});

	test('the other-ways-to-work page renders', async ({ page }) => {
		await gotoHydrated(page, '/work');
		await expect(page.getByTestId('work-page')).toBeVisible();
	});

	test('the data consent panel leads the privacy page with its purposes', async ({ page }) => {
		await gotoHydrated(page, '/settings/privacy');
		await expect(page.getByTestId('data-consent-panel')).toBeVisible();
	});

	test('the wallet carries its advances', async ({ page }) => {
		await gotoHydrated(page, '/wallet');
		await expect(page.getByTestId('wallet-advances')).toBeVisible();
	});

	test('every pillar page renders exactly one h1', async ({ page }) => {
		for (const path of PAGES) {
			await gotoHydrated(page, path);
			await expect(page.locator('h1'), `h1 count on ${path}`).toHaveCount(1);
		}
	});

	test('no i18n key leaks as a raw dotted path on any pillar page', async ({ page }) => {
		for (const path of PAGES) {
			await gotoHydrated(page, path);
			const body = await page.locator('body').innerText();
			expect(body, `raw i18n key leaked on ${path}`).not.toMatch(
				/\b(requests|creator|work|advances|dataConsent|craftProfile|portfolioSettings)\.[a-zA-Z]+/
			);
		}
	});
});
