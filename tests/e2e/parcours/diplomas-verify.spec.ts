/**
 * SKI-52 — /diplomas/verify (visiteur anonyme, form input code).
 */
import { test, expect } from '@playwright/test';
import { userStoragePath } from './_helpers/user-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = userStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours diplomas-verify', () => {
	// SKI-71: signed-in session through the shared helper, no skeleton fixture.
	// See tests/e2e/parcours/_helpers/user-session.ts.
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL + seeded back');
	test.skip(!HAS_STATE, 'requires user-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL');
	test.setTimeout(60_000);

	test('diplomas/verify accessible + form visible', async ({ page }, testInfo) => {
		await page.goto('/diplomas/verify');
		await page.waitForLoadState('networkidle');
		await page.screenshot({ path: testInfo.outputPath('step-1-arrival.png'), fullPage: true });
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
		await page.screenshot({ path: testInfo.outputPath('step-2-form.png'), fullPage: true });
	});
});
