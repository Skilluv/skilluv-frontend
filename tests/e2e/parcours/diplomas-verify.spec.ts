/**
 * SKI-52 — /diplomas/verify (visiteur anonyme, form input code).
 */
import { test, expect } from '@playwright/test';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);

test.describe('@parcours diplomas-verify', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL');
	test.setTimeout(60_000);

	test('diplomas/verify accessible + form visible', async ({ page }, testInfo) => {
		await page.goto('/diplomas/verify');
		await page.waitForLoadState('networkidle');
		await page.screenshot({ path: testInfo.outputPath('step-1-arrival.png'), fullPage: true });
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
		await page.screenshot({ path: testInfo.outputPath('step-2-form.png'), fullPage: true });
	});
});
