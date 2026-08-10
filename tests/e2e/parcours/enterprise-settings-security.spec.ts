/**
 * Parcours minimal — /enterprise/settings/security (2FA/sessions dans workspace).
 */
import { test, expect } from '@playwright/test';
import { enterpriseStoragePath } from './_helpers/enterprise-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = enterpriseStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours enterprise-settings-security', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL');
	test.skip(!HAS_STATE, 'requires enterprise-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });
	test.setTimeout(60_000);

	test('/enterprise/settings/security rend une page graceful (form ou login)', async ({ page }, testInfo) => {
		await page.goto('/enterprise/settings/security');
		await page.waitForLoadState('domcontentloaded');
		// Peut render soit le form settings, soit rediriger vers login (capability gate back).
		await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });
		await page.screenshot({ path: testInfo.outputPath('enterprise-security.png'), fullPage: true });
	});
});
