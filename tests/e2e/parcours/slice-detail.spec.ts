/**
 * P26 v2 SKI-93 — page /slices/[id].
 * Skip permanent : back non deploye (SKI-72..91 en Todo).
 */
import { test, expect } from '@playwright/test';

test.describe('@parcours slice-detail', () => {
	test('page slice detail rendue', async ({ page }) => {
		test.skip(true, 'P26 v2 back not deployed: /api/slices/{id} SKI-72..91 en Todo');
		await page.goto('/slices/00000000-0000-0000-0000-000000000000');
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
	});
});
