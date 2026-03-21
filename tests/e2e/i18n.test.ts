import { test, expect } from '@playwright/test';

test.describe('Internationalization', () => {
	test('landing page defaults to French', async ({ page }) => {
		await page.goto('/');
		// Default locale is FR, check for French content
		const heading = await page.locator('h1').textContent();
		expect(heading).toContain('Prouve');
	});

	test('error page shows localized message', async ({ page }) => {
		await page.goto('/nonexistent-page-12345');
		await expect(page.locator('text=404')).toBeVisible();
	});
});
