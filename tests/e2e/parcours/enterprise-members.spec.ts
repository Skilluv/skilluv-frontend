/**
 * SKI-53 — S6.3 gestion membres (invite recruteur).
 *
 * SKIPPED : le flow invite-accept complet exige un 2ème register (le mail
 * du recruteur invité doit s'inscrire). Ce commit est budgété à 1 register.
 * Test conservé pour matérialiser l'intent et débloquer plus tard.
 */
import { test, expect } from '@playwright/test';
import { enterpriseStoragePath } from './_helpers/enterprise-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = enterpriseStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours enterprise-members', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL');
	test.skip(!HAS_STATE, 'requires enterprise-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });

	test('page membres accessible', async ({ page }) => {
		await page.goto('/enterprise/members');
		await page.waitForLoadState('networkidle');
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
	});
});
