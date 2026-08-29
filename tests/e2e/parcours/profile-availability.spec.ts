/**
 * Parcours authentifié — /settings/profile/availability (Vague 2, Ticket 10).
 */
import { test, expect } from '@playwright/test';
import { userStoragePath } from './_helpers/user-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = userStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours profile-availability', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL + seeded back');
	test.skip(!HAS_STATE, 'requires user-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });

	test('affiche le formulaire availability (no mutation on shared fixture)', async ({ page }) => {
		await page.goto('/settings/profile/availability');

		await expect(page.getByTestId('availability-open')).toBeVisible();
		// data-testid spread on the <input> by Input.svelte — locate directly.
		await expect(page.getByTestId('availability-salary-min')).toBeVisible();
		await expect(page.getByTestId('availability-salary-max')).toBeVisible();
		await expect(page.getByTestId('availability-save-btn')).toBeVisible();
	});
});
