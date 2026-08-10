/**
 * P26 v2 SKI-93 — page /slices/[id].
 *
 * Sans back : la route throw 404 au loader et rend `+error.svelte` (h1 "404").
 * Le test verifie que la page ne blanche pas et que l'error boundary rend bien.
 */
import { test, expect } from '@playwright/test';

test.describe('@parcours slice-detail', () => {
	test('page slice detail rend l\'error boundary sur id inexistant', async ({ page }) => {
		await page.goto('/slices/00000000-0000-0000-0000-000000000000');
		await page.waitForLoadState('domcontentloaded');
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
	});
});
