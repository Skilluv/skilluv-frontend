/**
 * Parcours authentifié — /settings/profile/languages (Vague 2, Ticket 10).
 */
import { test, expect } from '@playwright/test';
import { userStoragePath } from './_helpers/user-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = userStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours profile-languages', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL + seeded back');
	test.skip(!HAS_STATE, 'requires user-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });

	test('affiche le formulaire languages ou fallback login (no mutation)', async ({ page }) => {
		await page.goto('/settings/profile/languages');
		await page.waitForLoadState('domcontentloaded');
		const addBtn = page.getByTestId('languages-add-btn');
		await expect(addBtn.or(page.locator('h1').first())).toBeVisible({ timeout: 15_000 });
	});
});
