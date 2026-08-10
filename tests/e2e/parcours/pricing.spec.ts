/**
 * Parcours minimal — /pricing (page publique tarifs).
 */
import { test, expect } from '@playwright/test';

test.describe('@parcours pricing', () => {
	test.setTimeout(60_000);

	test('/pricing rend la page tarifs publique', async ({ page }, testInfo) => {
		await page.goto('/pricing');
		await page.waitForLoadState('domcontentloaded');
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
		await page.screenshot({ path: testInfo.outputPath('pricing.png'), fullPage: true });
	});
});
