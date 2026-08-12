import { test, expect } from '@playwright/test';
import { gotoHydrated } from './utils/hydration';

test.describe('Landing page', () => {
	test('shows landing page for visitors', async ({ page }) => {
		await gotoHydrated(page, '/');
		await expect(page.locator('h1')).toBeVisible();
		// Both the navbar and the hero expose a signup CTA, so take the first
		// rather than requiring a unique match (strict mode).
		await expect(
			page.getByRole('link', { name: /commencer|get started/i }).first()
		).toBeVisible();
	});

	test('has correct meta tags', async ({ page }) => {
		await gotoHydrated(page, '/');
		const title = await page.title();
		expect(title).toContain('Skilluv');
	});

	test('navigation links work', async ({ page }) => {
		await gotoHydrated(page, '/');
		await page.click('a[href="/auth/register"]');
		await expect(page).toHaveURL('/auth/register');
	});
});
