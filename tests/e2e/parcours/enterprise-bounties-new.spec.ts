/**
 * Parcours minimal — /enterprise/bounties/new (legacy redirect vers listing).
 * Route conservee comme alias — verifie qu'elle ne crash pas.
 */
import { test, expect } from '@playwright/test';
import { enterpriseStoragePath } from './_helpers/enterprise-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = enterpriseStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours enterprise-bounties-new', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL');
	test.skip(!HAS_STATE, 'requires enterprise-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });
	test.setTimeout(60_000);

	test('/enterprise/bounties/new (legacy) redirige ou ouvre modal', async ({ page }, testInfo) => {
		await page.goto('/enterprise/bounties/new');
		await page.waitForLoadState('domcontentloaded');
		await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });
		await page.screenshot({ path: testInfo.outputPath('enterprise-bounties-new.png'), fullPage: true });
	});
});
