/**
 * Parcours authentifié — /settings/profile (Ticket 15, Vague 1).
 * Voir tests/e2e/parcours/email-preferences.spec.ts pour les pré-requis.
 */
import { test, expect } from '@playwright/test';
import { userStoragePath } from './_helpers/user-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = userStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours settings-profile', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL + seeded back');
	test.skip(!HAS_STATE, 'requires user-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });

	test('affiche le formulaire display-name + domaine (fillable, no mutation on shared fixture)', async ({ page }) => {
		await page.goto('/settings/profile');

		// data-testid is spread onto the <input> element by Input.svelte — no need for .locator('input').
		const input = page.getByTestId('profile-display-name');
		await expect(input).toBeVisible();
		await expect(input).toBeEditable();
		await expect(page.getByTestId('profile-save-btn')).toBeVisible();
	});
});
