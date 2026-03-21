import { test, expect } from '@playwright/test';

test.describe('Challenge pages', () => {
	test('challenges page renders catalogue', async ({ page }) => {
		await page.goto('/challenges');
		await expect(page.locator('h1')).toBeVisible();
	});

	test('leaderboards page renders', async ({ page }) => {
		await page.goto('/leaderboards');
		await expect(page.locator('h1')).toBeVisible();
		// Should show domain filter buttons
		const buttons = page.locator('button').filter({ hasText: /global|code|design/i });
		await expect(buttons.first()).toBeVisible();
	});
});
