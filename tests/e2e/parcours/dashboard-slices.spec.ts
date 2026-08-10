/**
 * P26 v2 SKI-94 — dashboard "mes challenges" + reco feed.
 * Skip permanent : back non deploye.
 */
import { test, expect } from '@playwright/test';

test.describe('@parcours dashboard-slices', () => {
	test('dashboard slices accessible', async ({ page }) => {
		test.skip(true, 'P26 v2 back not deployed: /api/me/feed/challenges (SKI-121) + /api/users/me/slices en Todo');
		await page.goto('/dashboard/slices');
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
	});
});
