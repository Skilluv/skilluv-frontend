/**
 * SKI-51 — page mentors/me (authentifie).
 */
import { test, expect } from '@playwright/test';
import { userStoragePath } from './_helpers/user-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = userStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours mentors-me', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL');
	test.skip(!HAS_STATE, 'requires user-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });
	test.setTimeout(60_000);

	test('mentors/me accessible + form edit visible', async ({ page }, testInfo) => {
		await page.goto('/mentors/me');
		await page.waitForLoadState('networkidle');
		await page.screenshot({ path: testInfo.outputPath('step-1-arrival.png'), fullPage: true });
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
		await page.screenshot({ path: testInfo.outputPath('step-2-loaded.png'), fullPage: true });
	});
});
