/**
 * Parcours minimal — /developer/webhooks (webhooks developer portal).
 */
import { test, expect } from '@playwright/test';
import { userStoragePath } from './_helpers/user-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = userStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours developer-webhooks', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL');
	test.skip(!HAS_STATE, 'requires user-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });
	test.setTimeout(60_000);

	test('/developer/webhooks rend la page webhooks', async ({ page }, testInfo) => {
		await page.goto('/developer/webhooks');
		await page.waitForLoadState('domcontentloaded');
		await expect(page.locator('main, body').first()).toBeVisible({ timeout: 15_000 });
		await expect(page.getByRole('button').first()).toBeVisible({ timeout: 15_000 });
		await page.screenshot({ path: testInfo.outputPath('developer-webhooks.png'), fullPage: true });
	});
});
