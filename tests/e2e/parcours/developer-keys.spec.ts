/**
 * Parcours minimal — /developer/keys (API keys developer portal).
 */
import { test, expect } from '@playwright/test';
import { userStoragePath } from './_helpers/user-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = userStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours developer-keys', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL');
	test.skip(!HAS_STATE, 'requires user-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });
	test.setTimeout(60_000);

	test('/developer/keys rend la page API keys', async ({ page }, testInfo) => {
		await page.goto('/developer/keys');
		await page.waitForLoadState('domcontentloaded');
		await expect(page.locator('main, body').first()).toBeVisible({ timeout: 15_000 });
		await expect(page.getByRole('button').first()).toBeVisible({ timeout: 15_000 });
		await page.screenshot({ path: testInfo.outputPath('developer-keys.png'), fullPage: true });
	});
});
