import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
	test('shows landing page for visitors', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('h1')).toBeVisible();
		await expect(page.getByRole('link', { name: /commencer|get started/i })).toBeVisible();
	});

	test('has correct meta tags', async ({ page }) => {
		await page.goto('/');
		const title = await page.title();
		expect(title).toContain('Skilluv');
	});

	test('navigation links work', async ({ page }) => {
		await page.goto('/');
		await page.click('a[href="/auth/register"]');
		await expect(page).toHaveURL('/auth/register');
	});
});
