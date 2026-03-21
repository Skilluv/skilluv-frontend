import { test, expect } from '@playwright/test';

test.describe('Auth pages', () => {
	test('register page shows domain selection', async ({ page }) => {
		await page.goto('/auth/register');
		await expect(page.locator('h1')).toBeVisible();
		// Should show 4 domain cards
		const cards = page.locator('button').filter({ hasText: /code|design|game|security/i });
		await expect(cards).toHaveCount(4);
	});

	test('register page step 2 shows form after domain selection', async ({ page }) => {
		await page.goto('/auth/register');
		await page.click('button:has-text("Code")');
		await expect(page.locator('input[autocomplete="username"]')).toBeVisible();
		await expect(page.locator('input[type="email"]')).toBeVisible();
		await expect(page.locator('input[type="password"]')).toBeVisible();
	});

	test('login page renders correctly', async ({ page }) => {
		await page.goto('/auth/login');
		await expect(page.locator('h1')).toBeVisible();
		await expect(page.locator('input[autocomplete="username"]')).toBeVisible();
		await expect(page.locator('input[type="password"]')).toBeVisible();
	});

	test('forgot password page renders', async ({ page }) => {
		await page.goto('/auth/forgot-password');
		await expect(page.locator('h1')).toBeVisible();
		await expect(page.locator('input[type="email"]')).toBeVisible();
	});

	test('login page links to register and forgot', async ({ page }) => {
		await page.goto('/auth/login');
		await expect(page.getByRole('link', { name: /register|créer|create/i })).toBeVisible();
		await expect(page.getByRole('link', { name: /forgot|oublié/i })).toBeVisible();
	});

	test('auth pages have no navbar', async ({ page }) => {
		await page.goto('/auth/login');
		await expect(page.locator('header nav')).not.toBeVisible();
	});
});
