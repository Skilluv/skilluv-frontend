/**
 * P26 v2 SKI-95 — validator queue + review pages.
 * Skip permanent : back P26 non deploye sur staging.
 */
import { test, expect } from '@playwright/test';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);

test.describe('@parcours validations-queue', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL');

	test('page validations/queue accessible', async ({ page }) => {
		test.skip(true, 'P26 v2 back not deployed: /api/me/validation/queue SKI-86 en Todo');
		await page.goto('/validations/queue');
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
	});
});
