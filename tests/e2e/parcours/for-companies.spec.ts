/**
 * Parcours minimal — /for-companies (landing publique entreprises).
 */
import { test, expect } from '@playwright/test';

test.describe('@parcours for-companies', () => {
	test.setTimeout(60_000);

	test('/for-companies rend la landing entreprises', async ({ page }, testInfo) => {
		await page.goto('/for-companies');
		await page.waitForLoadState('domcontentloaded');
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
		await page.screenshot({ path: testInfo.outputPath('for-companies.png'), fullPage: true });
	});
});
