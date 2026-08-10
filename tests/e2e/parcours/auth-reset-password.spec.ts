/**
 * Parcours minimal — /auth/reset-password (nouveau mot de passe via token).
 * Token bogus juste pour verifier rendu — pas de mutation.
 */
import { test, expect } from '@playwright/test';

test.describe('@parcours auth-reset-password', () => {
	test.setTimeout(60_000);

	test('/auth/reset-password rend le formulaire nouveau mdp', async ({ page }, testInfo) => {
		await page.goto('/auth/reset-password?token=bogus');
		await page.waitForLoadState('domcontentloaded');
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
		await page.screenshot({ path: testInfo.outputPath('auth-reset.png'), fullPage: true });
	});
});
