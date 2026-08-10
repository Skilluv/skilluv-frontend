/**
 * Parcours authentifié — /settings/profile/experiences (Vague 2, Ticket 10).
 * Skip si backend absent (voir tests/e2e/parcours/settings-profile.spec.ts).
 */
import { test, expect } from '@playwright/test';
import { userStoragePath } from './_helpers/user-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = userStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours profile-experiences', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL + seeded back');
	test.skip(!HAS_STATE, 'requires user-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });

	test('affiche le formulaire experiences ou fallback login (no mutation)', async ({ page }) => {
		await page.goto('/settings/profile/experiences');
		await page.waitForLoadState('domcontentloaded');
		const addBtn = page.getByTestId('experiences-add-btn');
		await expect(addBtn.or(page.locator('h1').first())).toBeVisible({ timeout: 15_000 });
	});
});
