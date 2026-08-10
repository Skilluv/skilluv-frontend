/**
 * P26 v2 SKI-95 — validator queue + review.
 * Skip permanent : back non deploye.
 */
import { test, expect } from '@playwright/test';

test.describe('@parcours validations-queue', () => {
	test('page validations/queue accessible', async ({ page }) => {
		test.skip(true, 'P26 v2 back not deployed: /api/me/validation/queue SKI-86 en Todo');
		await page.goto('/validations/queue');
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
	});
});
