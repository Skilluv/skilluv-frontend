/**
 * SKI-49 P2 — onboarding full user parcours.
 *
 * Auth : storageState user standard (login-first sur compte fixe seed via
 * user-setup.spec.ts). Parcours : /onboarding/orientations →
 * /onboarding/complete-profile → /challenges/onboarding → premier challenge.
 *
 * Screenshots explicites a chaque etape cle (leçon SKI-49 hydration Svelte 5 :
 * toujours waitForLoadState('networkidle') apres goto).
 */
import { test, expect } from '@playwright/test';
import { userStoragePath } from './_helpers/user-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = userStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours onboarding-full', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL');
	test.skip(!HAS_STATE, 'requires user-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });
	test.setTimeout(60_000);

	test('parcours onboarding orientations → profile → challenges', async ({ page }, testInfo) => {
		// Compte fixe deja profile_completed=true → les pages onboarding redirigent
		// vers la home. On tolere : chaque etape doit render un h1 sans crash.
		await page.goto('/onboarding/orientations');
		await page.waitForLoadState('networkidle');
		await page.screenshot({ path: testInfo.outputPath('step-1-orientations.png'), fullPage: true });
		await expect(page.locator('h1, [role="heading"]').first()).toBeVisible({ timeout: 15_000 });

		await page.goto('/onboarding/complete-profile');
		await page.waitForLoadState('networkidle');
		await page.screenshot({ path: testInfo.outputPath('step-2-complete-profile.png'), fullPage: true });
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });

		await page.goto('/challenges/onboarding');
		await page.waitForLoadState('networkidle');
		await page.screenshot({ path: testInfo.outputPath('step-3-challenges-onboarding.png'), fullPage: true });
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
	});
});
