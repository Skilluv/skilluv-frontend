/**
 * P26 v2 SKI-103 — page publique /verify/[hash].
 * Skip permanent : back P26 non deploye sur staging.
 * A reactiver quand le back staging repond a /verify/{hash} (SKI-115).
 */
import { test, expect } from '@playwright/test';

test.describe('@parcours verify-hash', () => {
	test('page verify accessible + rend etat invalid pour hash bidon', async ({ page }) => {
		test.skip(true, 'P26 v2 back not deployed: /verify/{hash} endpoint SKI-115 en Todo');
		await page.goto('/verify/deadbeef');
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
	});
});
