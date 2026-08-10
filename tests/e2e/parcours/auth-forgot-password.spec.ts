/**
 * Parcours minimal — /auth/forgot-password (formulaire reset).
 */
import { test, expect } from '@playwright/test';

test.describe('@parcours auth-forgot-password', () => {
	test.setTimeout(60_000);

	test('/auth/forgot-password rend le formulaire', async ({ page }, testInfo) => {
		await page.goto('/auth/forgot-password');
		await page.waitForLoadState('domcontentloaded');
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
		await expect(page.locator('input[type="email"]').first()).toBeVisible();
		await page.screenshot({ path: testInfo.outputPath('auth-forgot.png'), fullPage: true });
	});
});
