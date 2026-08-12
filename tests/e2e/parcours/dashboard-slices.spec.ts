/**
 * P26 v2 SKI-94 - "my challenges" dashboard.
 *
 * Authenticated run against the test backend: a signed-in user reaches the page
 * without bouncing to /auth/login and sees the filter tabs. Fine-grained render
 * coverage lives in tests/e2e/p26-workflow.test.ts, on mocked payloads.
 */
import { test, expect } from '@playwright/test';
import { userStoragePath } from './_helpers/user-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = userStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours dashboard-slices', () => {
	// SKI-71: signed-in session through the shared helper, no skeleton fixture.
	// See tests/e2e/parcours/_helpers/user-session.ts.
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL + seeded back');
	test.skip(!HAS_STATE, 'requires user-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });
	test.setTimeout(60_000);

	test('un user connecte atteint son dashboard challenges sans rebond login', async ({ page }) => {
		await page.goto('/dashboard/slices');
		await page.waitForLoadState('domcontentloaded');

		await expect(page).toHaveURL(/\/dashboard\/slices$/);
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 });
		// The three status tabs are the page's stable skeleton whatever the test
		// account holds. `parcours/` specs do not force a locale, so the label
		// follows the browser language, hence the bilingual regex.
		await expect(page.getByRole('button', { name: /^(actifs|active)$/i })).toBeVisible();
	});
});
