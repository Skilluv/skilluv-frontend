/**
 * P26 v2 SKI-96 — flow candidature validateur.
 * Skip permanent : back P26 non deploye sur staging.
 */
import { test, expect } from '@playwright/test';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);

test.describe('@parcours validator-application', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL');

	test('page candidature validateur accessible', async ({ page }) => {
		test.skip(true, 'P26 v2 back not deployed: /api/me/apply-as-validator SKI-81 en Todo');
		await page.goto('/settings/validator-application/new');
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
	});

	test('page my-validator-applications accessible', async ({ page }) => {
		test.skip(true, 'P26 v2 back not deployed: /api/me/validator-applications SKI-81 en Todo');
		await page.goto('/settings/my-validator-applications');
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
	});
});
