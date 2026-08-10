/**
 * Parcours minimal — /moderation/plagiarism (queue moderation).
 * Requiert role moderateur — le compte user standard ne l'a pas.
 * Skip taggue: on garde le placeholder pour rappel quand un compte
 * moderator sera provisionne.
 */
import { test, expect } from '@playwright/test';
import { userStoragePath } from './_helpers/user-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = userStoragePath();
const HAS_STATE = fs.existsSync(STATE);
const HAS_MOD = Boolean(process.env.HAS_MODERATOR_ACCOUNT);

test.describe('@parcours moderation-plagiarism', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL');
	test.skip(!HAS_STATE, 'requires user-setup.spec.ts run first');
	test.skip(!HAS_MOD, 'requires HAS_MODERATOR_ACCOUNT=1 + role moderator on session');
	if (HAS_STATE) test.use({ storageState: STATE });
	test.setTimeout(60_000);

	test('/moderation/plagiarism rend la queue moderation', async ({ page }, testInfo) => {
		await page.goto('/moderation/plagiarism');
		await page.waitForLoadState('domcontentloaded');
		await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });
		await page.screenshot({ path: testInfo.outputPath('moderation-plagiarism.png'), fullPage: true });
	});
});
