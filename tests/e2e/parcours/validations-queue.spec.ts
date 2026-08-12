/**
 * P26 v2 SKI-95 - validator queue.
 *
 * Authenticated run: a signed-in user reaches the queue without bouncing to
 * /auth/login. Depending on capabilities the page renders either the queue or
 * the invitation to apply (backend 403); both count as success here. Both
 * branches and the pick-up flow are covered in tests/e2e/p26-workflow.test.ts.
 */
import { test, expect } from '@playwright/test';
import { userStoragePath } from './_helpers/user-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = userStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours validations-queue', () => {
	// SKI-71: signed-in session through the shared helper, no skeleton fixture.
	// See tests/e2e/parcours/_helpers/user-session.ts.
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL + seeded back');
	test.skip(!HAS_STATE, 'requires user-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });
	test.setTimeout(60_000);

	test('un user connecte atteint la file de validation sans rebond login', async ({ page }) => {
		await page.goto('/validations/queue');
		await page.waitForLoadState('domcontentloaded');

		await expect(page).toHaveURL(/\/validations\/queue$/);
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 });
	});
});
