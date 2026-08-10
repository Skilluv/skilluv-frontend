/**
 * SKI-51 — listing mentors public (visiteur anonyme).
 */
import { test, expect } from '@playwright/test';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);

test.describe('@parcours mentors-listing', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL');
	test.setTimeout(60_000);

	test('mentors listing accessible', async ({ page }, testInfo) => {
		await page.goto('/mentors');
		await page.waitForLoadState('networkidle');
		await page.screenshot({ path: testInfo.outputPath('step-1-listing.png'), fullPage: true });
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
		await page.screenshot({ path: testInfo.outputPath('step-2-loaded.png'), fullPage: true });
	});
});
