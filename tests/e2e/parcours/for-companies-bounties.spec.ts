/**
 * Parcours minimal — /for-companies/bounties (landing publique bounties OSS).
 */
import { test, expect } from '@playwright/test';

test.describe('@parcours for-companies-bounties', () => {
	test.setTimeout(60_000);

	test('/for-companies/bounties rend la landing bounties', async ({ page }, testInfo) => {
		await page.goto('/for-companies/bounties');
		await page.waitForLoadState('domcontentloaded');
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
		await page.screenshot({ path: testInfo.outputPath('for-companies-bounties.png'), fullPage: true });
	});
});
