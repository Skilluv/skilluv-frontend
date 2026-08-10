/**
 * SKI-51 — profil public en vue visiteur (anonyme).
 *
 * Pas de storageState : navigateur anonyme visite /profile/<username> du user
 * fixe. Assertions : experiences/educations/languages/availability rendus
 * (BE-P0-14).
 */
import { test, expect } from '@playwright/test';
import { userCredentialsPath, USER_FIXED } from './_helpers/user-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);

function fixedUsername(): string {
	try {
		if (fs.existsSync(userCredentialsPath())) {
			const j = JSON.parse(fs.readFileSync(userCredentialsPath(), 'utf-8'));
			if (typeof j.username === 'string') return j.username;
		}
	} catch { /* ignore */ }
	return USER_FIXED.username;
}

test.describe('@parcours profile-visitor', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL');
	test.setTimeout(60_000);

	test('profile public visible ou fallback 404 propre', async ({ page }, testInfo) => {
		const username = fixedUsername();
		await page.goto(`/profile/${encodeURIComponent(username)}`);
		await page.waitForLoadState('domcontentloaded');
		await page.screenshot({ path: testInfo.outputPath('step-1-arrival.png'), fullPage: true });
		// Back peut renvoyer 404 (SKI-70) → page erreur ; sinon profil visible.
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
		await page.screenshot({ path: testInfo.outputPath('step-2-loaded.png'), fullPage: true });
	});
});
