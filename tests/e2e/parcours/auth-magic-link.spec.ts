/**
 * Parcours minimal — /auth/magic-link (demande lien magique).
 */
import { test, expect } from '@playwright/test';
import { ANONYMOUS_STATE } from './_helpers/user-session';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);

test.describe('@parcours auth-magic-link', () => {
	// SKI-71: explicit session posture. The subject of this test IS the
	// anonymous visitor, so no session must leak in from another spec.
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL + app server');
	test.use({ storageState: ANONYMOUS_STATE });
	test.setTimeout(60_000);

	test('/auth/magic-link rend le formulaire demande', async ({ page }, testInfo) => {
		await page.goto('/auth/magic-link');
		await page.waitForLoadState('domcontentloaded');
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
		await page.screenshot({ path: testInfo.outputPath('auth-magic-link.png'), fullPage: true });
	});
});
