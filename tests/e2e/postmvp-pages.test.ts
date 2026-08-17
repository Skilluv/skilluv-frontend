import { test, expect } from '@playwright/test';
import { gotoHydrated } from './utils/hydration';

/**
 * SKI-36 … SKI-47 — the public Post-MVP surfaces render and hydrate.
 *
 * Only the routes a signed-out visitor can reach are covered here: the
 * dashboard pages behind them need a session, which the legacy suite does not
 * carry. What this catches is the class of failure that matters at this stage —
 * a page that throws on mount, a missing i18n namespace, a broken import.
 */
test.describe('Post-MVP public pages', () => {
	test('cohorts discovery renders its heading and filters', async ({ page }) => {
		await gotoHydrated(page, '/cohorts');
		await expect(page.getByTestId('cohorts-page')).toBeVisible();
		await expect(page.locator('h1')).toBeVisible();
	});

	test('talent offers browse renders', async ({ page }) => {
		await gotoHydrated(page, '/talent-offers');
		await expect(page.getByTestId('talent-offers-page')).toBeVisible();
		await expect(page.locator('h1')).toBeVisible();
	});

	test('the assistant states its disclosure before any question is asked', async ({ page }) => {
		await gotoHydrated(page, '/assistant');
		await expect(page.getByTestId('assistant-page')).toBeVisible();
		// The disclosure is the point of the feature: it must be on screen
		// without scrolling past the form.
		const disclosure = page.locator('section[aria-label]').first();
		await expect(disclosure).toBeVisible();
	});

	test('cohort creation form is reachable', async ({ page }) => {
		await gotoHydrated(page, '/cohorts/new');
		await expect(page.getByTestId('cohort-new-page')).toBeVisible();
	});

	test('an i18n key never leaks as a raw dotted path', async ({ page }) => {
		for (const path of ['/cohorts', '/talent-offers', '/assistant']) {
			await gotoHydrated(page, path);
			const body = await page.locator('body').innerText();
			// A missing key falls back to the key itself, which is the only way
			// these namespaces fail silently.
			expect(body).not.toMatch(
				/\b(cohorts|talentOffers|assistant|skillTree|vouchings|goals|bookmarks)\.[a-zA-Z]+\.[a-zA-Z]/
			);
		}
	});
});
