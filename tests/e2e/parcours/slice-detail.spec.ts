/**
 * P26 v2 SKI-93 — page /slices/[id] avec workflow claim/submit-pr.
 *
 * Skip tant que /api/slices/{id} n'est pas expose (SKI-72..91 en Todo).
 */
import { test, expect } from '@playwright/test';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);

test.describe('@parcours slice-detail', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL');

	test('page slice detail rendue', async ({ page }) => {
		test.skip(true, 'P26 v2 back not deployed: /api/slices/{id} SKI-72..91 en Todo');
		await page.goto('/slices/00000000-0000-0000-0000-000000000000');
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
	});
});
