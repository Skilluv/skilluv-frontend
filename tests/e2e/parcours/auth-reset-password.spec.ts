/**
 * Parcours minimal — /auth/reset-password (nouveau mot de passe via token).
 * Token bogus juste pour verifier rendu — pas de mutation.
 */
import { test, expect } from '@playwright/test';
import { ANONYMOUS_STATE } from './_helpers/user-session';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);

test.describe('@parcours auth-reset-password', () => {
	// SKI-71: explicit session posture. The subject of this test IS the
	// anonymous visitor, so no session must leak in from another spec.
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL + app server');
	test.use({ storageState: ANONYMOUS_STATE });
	test.setTimeout(60_000);

	test('/auth/reset-password rend le formulaire nouveau mdp', async ({ page }, testInfo) => {
		await page.goto('/auth/reset-password?token=bogus');
		await page.waitForLoadState('domcontentloaded');
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
		await page.screenshot({ path: testInfo.outputPath('auth-reset.png'), fullPage: true });
	});
});
