/**
 * SKI-53 — S6.2 profil entreprise (édition).
 *
 * Owner peut voir /enterprise/profile et l'éditer. On teste l'accès + rendu
 * (édition full non tentée pour ne pas casser d'autres tests si data partagée).
 */
import { test, expect } from '@playwright/test';
import { enterpriseStoragePath } from './_helpers/enterprise-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = enterpriseStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours enterprise-profile-settings', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL');
	test.skip(!HAS_STATE, 'requires enterprise-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });

	test('profile page accessible et rendu', async ({ page }) => {
		await page.goto('/enterprise/profile');
		await page.waitForLoadState('networkidle');
		await expect(
			page.getByRole('heading', { name: /profil entreprise|enterprise profile/i, level: 1 })
		).toBeVisible({ timeout: 15_000 });
	});
});
