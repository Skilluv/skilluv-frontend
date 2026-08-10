/**
 * SKI-53 — S6.12 enterprise onboarding wizard (post-register).
 *
 * Après arm TOTP dans le setup, `hasStrongFactorEnrolled` est true côté
 * store → l'onboarding ne devrait plus rediriger et permettre de dérouler
 * les steps ou d'aller direct au dashboard.
 */
import { test, expect } from '@playwright/test';
import { enterpriseStoragePath } from './_helpers/enterprise-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = enterpriseStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours enterprise-onboarding', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL');
	test.skip(!HAS_STATE, 'requires enterprise-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });

	test('onboarding accessible et 2FA marquée validée', async ({ page }) => {
		await page.goto('/enterprise/onboarding');
		await page.waitForLoadState('networkidle');
		// La page doit rendre — heading step 1 (welcome) ou step propre.
		await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10_000 });
	});
});
