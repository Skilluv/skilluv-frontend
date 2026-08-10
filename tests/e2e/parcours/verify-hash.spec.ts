/**
 * P26 v2 SKI-103 — page publique /verify/[hash].
 *
 * Skip permanent tant que le back n'expose pas /verify/{hash} (SKI-115 en Todo).
 * A reactiver quand le back staging repond a l'endpoint.
 */
import { test, expect } from '@playwright/test';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);

test.describe('@parcours verify-hash', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL');

	test('page verify accessible + rend etat invalid pour hash bidon', async ({ page }) => {
		test.skip(true, 'P26 v2 back not deployed: /verify/{hash} endpoint SKI-115 en Todo');
		await page.goto('/verify/deadbeef');
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
	});
});
