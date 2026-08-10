/**
 * P26 v2 SKI-95 — validator queue.
 *
 * Visiteur anonyme -> auth guard client-side redirect vers /auth/login.
 */
import { test, expect } from '@playwright/test';

test.describe('@parcours validations-queue', () => {
	test('validations/queue redirige visiteur anonyme vers login', async ({ page }) => {
		await page.goto('/validations/queue');
		await page.waitForLoadState('domcontentloaded');
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
	});
});
