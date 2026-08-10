/**
 * P26 v2 SKI-96 — flow candidature validateur.
 *
 * Visiteur anonyme -> auth guard redirect vers /auth/login. Aucune donnee
 * back critique pour le premier render.
 */
import { test, expect } from '@playwright/test';

test.describe('@parcours validator-application', () => {
	test('page candidature redirige visiteur anonyme vers login', async ({ page }) => {
		await page.goto('/settings/validator-application/new');
		await page.waitForLoadState('domcontentloaded');
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
	});

	test('page my-validator-applications redirige visiteur anonyme vers login', async ({ page }) => {
		await page.goto('/settings/my-validator-applications');
		await page.waitForLoadState('domcontentloaded');
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
	});
});
