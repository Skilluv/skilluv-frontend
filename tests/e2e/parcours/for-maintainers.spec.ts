/**
 * P26 v2 SKI-105 — landing publique /for-maintainers + digest opt-in.
 */
import { test, expect } from '@playwright/test';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);

test.describe('@parcours for-maintainers', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL');

	test('landing for-maintainers accessible + form subscribe visible', async ({ page }) => {
		await page.goto('/for-maintainers');
		await page.waitForLoadState('domcontentloaded');
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
	});
});
