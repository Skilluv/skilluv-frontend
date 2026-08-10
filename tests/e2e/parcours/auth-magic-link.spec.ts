/**
 * Parcours minimal — /auth/magic-link (demande lien magique).
 */
import { test, expect } from '@playwright/test';

test.describe('@parcours auth-magic-link', () => {
	test.setTimeout(60_000);

	test('/auth/magic-link rend le formulaire demande', async ({ page }, testInfo) => {
		await page.goto('/auth/magic-link');
		await page.waitForLoadState('domcontentloaded');
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
		await page.screenshot({ path: testInfo.outputPath('auth-magic-link.png'), fullPage: true });
	});
});
