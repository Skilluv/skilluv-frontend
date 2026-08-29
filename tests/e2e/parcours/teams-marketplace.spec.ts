/**
 * Parcours minimal — /teams/marketplace (equipes recherche membres).
 */
import { test, expect } from '@playwright/test';
import { userStoragePath } from './_helpers/user-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = userStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours teams-marketplace', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL');
	test.skip(!HAS_STATE, 'requires user-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });
	test.setTimeout(60_000);

	test('/teams/marketplace rend la marketplace equipes', async ({ page }, testInfo) => {
		await page.goto('/teams/marketplace');
		await page.waitForLoadState('domcontentloaded');
		await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });
		await page.screenshot({ path: testInfo.outputPath('teams-marketplace.png'), fullPage: true });
	});
});
