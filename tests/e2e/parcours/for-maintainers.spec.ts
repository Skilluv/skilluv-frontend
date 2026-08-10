/**
 * P26 v2 SKI-105 — landing publique /for-maintainers.
 * Content marketing pur — aucun fetch back au premier render.
 */
import { test, expect } from '@playwright/test';

test.describe('@parcours for-maintainers', () => {
	test('landing accessible + form subscribe visible', async ({ page }) => {
		await page.goto('/for-maintainers');
		await page.waitForLoadState('domcontentloaded');
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
		// Form subscribe present.
		await expect(page.getByLabel(/GitHub|github/).first()).toBeVisible();
		await expect(page.getByLabel(/email/i).first()).toBeVisible();
	});
});
