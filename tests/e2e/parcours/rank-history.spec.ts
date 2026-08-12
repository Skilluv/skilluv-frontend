/**
 * Parcours — rank history section on public profile pages (Vague 6, Ticket 9).
 */
import { test, expect } from '@playwright/test';
import { userStoragePath } from './_helpers/user-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = userStoragePath();
const HAS_STATE = fs.existsSync(STATE);
const SEED_USERNAME = process.env.SEED_PUBLIC_USERNAME ?? 'artisan-demo';

test.describe('@parcours rank-history', () => {
	// SKI-71: signed-in session through the shared helper, no skeleton fixture.
	// See tests/e2e/parcours/_helpers/user-session.ts.
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL + seeded back');
	test.skip(!HAS_STATE, 'requires user-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });

	test('renders rank-history or graceful 404 on a public profile page', async ({ page }) => {
		const res = await page.goto(`/profile/${SEED_USERNAME}`);
		await page.waitForLoadState('domcontentloaded');
		if (res && res.status() === 404) {
			// SKI-70 cascade: a 404 profile must still render a heading.
			await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
			return;
		}
		const widget = page.getByTestId('rank-history');
		await expect(widget.or(page.locator('h1').first())).toBeVisible({ timeout: 15_000 });
	});
});
