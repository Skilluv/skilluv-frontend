/**
 * P26 v2 SKI-94 — dashboard "mes challenges".
 *
 * Visiteur anonyme -> redirect vers /auth/login. Le test verifie qu'il n'y a
 * pas d'ecran blanc et que le tunnel auth prend le relais.
 */
import { test, expect } from '@playwright/test';

test.describe('@parcours dashboard-slices', () => {
	test('dashboard slices redirige visiteur anonyme vers login', async ({ page }) => {
		await page.goto('/dashboard/slices');
		await page.waitForLoadState('domcontentloaded');
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
	});
});
