/**
 * P26 v2 SKI-94 — dashboard "mes challenges" + reco feed.
 * Skip permanent : back P26 non deploye sur staging.
 */
import { test, expect } from '@playwright/test';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);

test.describe('@parcours dashboard-slices', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL');

	test('dashboard slices accessible', async ({ page }) => {
		test.skip(true, 'P26 v2 back not deployed: /api/me/feed/challenges (SKI-121) + /api/users/me/slices en Todo');
		await page.goto('/dashboard/slices');
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
	});
});
