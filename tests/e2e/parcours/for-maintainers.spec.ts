/**
 * P26 v2 SKI-105 — landing publique /for-maintainers.
 * Content marketing pur — aucun fetch back au premier render.
 */
import { test, expect } from '@playwright/test';
import { userStoragePath } from './_helpers/user-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = userStoragePath();
const HAS_STATE = fs.existsSync(STATE);
test.describe('@parcours for-maintainers', () => {
	// SKI-71: signed-in session through the shared helper, no skeleton fixture.
	// See tests/e2e/parcours/_helpers/user-session.ts.
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL + seeded back');
	test.skip(!HAS_STATE, 'requires user-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });
	test('landing accessible + form subscribe visible', async ({ page }) => {
		await page.goto('/for-maintainers');
		await page.waitForLoadState('domcontentloaded');
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
		// Form subscribe present.
		await expect(page.getByLabel(/GitHub|github/).first()).toBeVisible();
		await expect(page.getByLabel(/email/i).first()).toBeVisible();
	});
});
