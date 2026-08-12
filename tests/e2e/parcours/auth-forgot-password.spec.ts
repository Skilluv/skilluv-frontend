/**
 * Parcours minimal — /auth/forgot-password (formulaire reset).
 */
import { test, expect } from '@playwright/test';
import { ANONYMOUS_STATE } from './_helpers/user-session';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);

test.describe('@parcours auth-forgot-password', () => {
	// SKI-71: explicit session posture. The subject of this test IS the
	// anonymous visitor, so no session must leak in from another spec.
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL + app server');
	test.use({ storageState: ANONYMOUS_STATE });
	test.setTimeout(60_000);

	test('/auth/forgot-password rend le formulaire', async ({ page }, testInfo) => {
		await page.goto('/auth/forgot-password');
		await page.waitForLoadState('domcontentloaded');
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
		await expect(page.locator('input[type="email"]').first()).toBeVisible();
		await page.screenshot({ path: testInfo.outputPath('auth-forgot.png'), fullPage: true });
	});
});
