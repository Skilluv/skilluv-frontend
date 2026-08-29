/**
 * Parcours minimal — /opportunities (feed offres cross entreprises).
 */
import { test, expect } from '@playwright/test';
import { userStoragePath } from './_helpers/user-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = userStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours opportunities', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL');
	test.skip(!HAS_STATE, 'requires user-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });
	test.setTimeout(60_000);

	test('/opportunities rend le feed', async ({ page }, testInfo) => {
		await page.goto('/opportunities');
		await page.waitForLoadState('domcontentloaded');
		await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });
		await page.screenshot({ path: testInfo.outputPath('opportunities.png'), fullPage: true });
	});
});
