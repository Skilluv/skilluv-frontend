import { test, expect } from '@playwright/test';
import { gotoHydrated } from './utils/hydration';

test.describe('Challenge pages', () => {
	test('challenges page renders catalogue', async ({ page }) => {
		await gotoHydrated(page, '/challenges');
		await expect(page.locator('h1')).toBeVisible();
	});

	test('leaderboards page renders', async ({ page }) => {
		await gotoHydrated(page, '/leaderboards');
		await expect(page.locator('h1')).toBeVisible();
		// Should show domain filter buttons
		const buttons = page.locator('button').filter({ hasText: /global|code|design/i });
		await expect(buttons.first()).toBeVisible();
	});
});
