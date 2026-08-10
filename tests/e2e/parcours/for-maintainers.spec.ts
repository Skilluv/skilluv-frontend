/**
 * P26 v2 SKI-105 — landing publique /for-maintainers.
 * Page publique standalone — pas de dependance back critique pour le rendu.
 */
import { test, expect } from '@playwright/test';

test.describe('@parcours for-maintainers', () => {
	test('landing for-maintainers accessible + form subscribe visible', async ({ page }) => {
		await page.goto('/for-maintainers');
		await page.waitForLoadState('domcontentloaded');
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
	});
});
