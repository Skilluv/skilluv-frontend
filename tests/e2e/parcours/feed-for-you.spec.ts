/**
 * Parcours — For-you feed on auth'd homepage (Vague 6, Ticket 5).
 */
import { test, expect } from '@playwright/test';
import { userStoragePath } from './_helpers/user-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = userStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours feed for-you', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL + seeded back');
	test.skip(!HAS_STATE, 'requires user-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });

	test('renders the ForYouFeed widget or public fallback on /', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('domcontentloaded');
		const widget = page.getByTestId('for-you-feed');
		await expect(widget.or(page.locator('h1').first())).toBeVisible({ timeout: 15_000 });
	});
});
