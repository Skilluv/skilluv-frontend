/**
 * Parcours minimal — /settings (hub reglages).
 * Coverage route non testee jusque-la (audit 2026-08-06).
 */
import { test, expect } from '@playwright/test';
import { userStoragePath } from './_helpers/user-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = userStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours settings-root', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL');
	test.skip(!HAS_STATE, 'requires user-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });
	test.setTimeout(60_000);

	test('/settings rend le hub avec liens vers sous-pages', async ({ page }, testInfo) => {
		await page.goto('/settings');
		await page.waitForLoadState('domcontentloaded');
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
		await expect(page.getByTestId('settings-link-email-prefs')).toBeVisible();
		await page.screenshot({ path: testInfo.outputPath('settings-root.png'), fullPage: true });
	});
});
