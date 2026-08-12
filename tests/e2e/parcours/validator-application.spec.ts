/**
 * P26 v2 SKI-96 - validator application flow.
 *
 * Authenticated run: both application screens are reachable by a signed-in user
 * without bouncing to /auth/login. Form validation and thresholds are covered
 * on mocks in tests/e2e/p26-workflow.test.ts.
 */
import { test, expect } from '@playwright/test';
import { userStoragePath } from './_helpers/user-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = userStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours validator-application', () => {
	// SKI-71: signed-in session through the shared helper, no skeleton fixture.
	// See tests/e2e/parcours/_helpers/user-session.ts.
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL + seeded back');
	test.skip(!HAS_STATE, 'requires user-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });
	test.setTimeout(60_000);

	test('la page de candidature est atteinte par un user connecte', async ({ page }) => {
		await page.goto('/settings/validator-application/new');
		await page.waitForLoadState('domcontentloaded');

		await expect(page).toHaveURL(/\/settings\/validator-application\/new$/);
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 });
	});

	test('la liste de mes candidatures est atteinte par un user connecte', async ({ page }) => {
		await page.goto('/settings/my-validator-applications');
		await page.waitForLoadState('domcontentloaded');

		await expect(page).toHaveURL(/\/settings\/my-validator-applications$/);
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 });
	});
});
