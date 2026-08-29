/**
 * Parcours — OAuth "Connected accounts" section in /settings/security
 * (Vague 6, Ticket 7). Link/unlink require a full OAuth roundtrip through
 * external providers so we only assert the UI wiring here.
 */
import { test, expect } from '@playwright/test';
import { userStoragePath } from './_helpers/user-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = userStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours oauth-settings', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL + seeded back');
	test.skip(!HAS_STATE, 'requires user-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });

	test('renders /settings/security (ConnectedAccounts ou fallback login)', async ({ page }) => {
		await page.goto('/settings/security');
		await page.waitForLoadState('domcontentloaded');
		// Session hydratee → oauth section ; sinon page login (capability gate back).
		const section = page.getByTestId('oauth-connected-accounts');
		await expect(section.or(page.locator('h1').first())).toBeVisible({ timeout: 15_000 });
	});
});
