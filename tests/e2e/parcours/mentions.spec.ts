/**
 * Mentions — Vague 5, ticket 13.
 * Skip si backend absent.
 */
import { test, expect } from '@playwright/test';
import { userStoragePath } from './_helpers/user-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = userStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours mentions', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL + seeded back');
	test.skip(!HAS_STATE, 'requires user-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });

	test('/mentions charge ma liste (peut être vide)', async ({ page }) => {
		await page.goto('/mentions');
		await expect(page.getByTestId('mentions-page')).toBeVisible();
	});
});
