import { test, expect } from '@playwright/test';

/**
 * Every page names one canonical address.
 *
 * The app answers on more than one origin — the apex and `www` both resolve
 * and both return 200 — so the same page exists at two URLs with no way for a
 * crawler to tell they are the same thing. `rel="canonical"` is what settles
 * it, and the failure it prevents is silent: nothing breaks, the two hosts
 * simply compete with each other in search results.
 *
 * These run against the mocked server, where `PUBLIC_CANONICAL_ORIGIN` is
 * unset, so the assertions cover the self-canonical branch. The production
 * branch is the same expression with a different origin.
 */
test.describe('Canonical URL', () => {
	test('the landing page declares itself canonical', async ({ page }) => {
		await page.goto('/');
		const href = await page.locator('link[rel="canonical"]').getAttribute('href');
		expect(href).toBe(`${new URL(page.url()).origin}/`);
	});

	test('there is exactly one canonical per page', async ({ page }) => {
		// Two would be worse than none: a crawler picks arbitrarily, and the
		// layout renders on every route, so a page adding its own would double up.
		await page.goto('/pricing');
		await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
	});

	test('it follows the route, not just the origin', async ({ page }) => {
		await page.goto('/pricing');
		const href = await page.locator('link[rel="canonical"]').getAttribute('href');
		expect(href).toContain('/pricing');
	});

	test('it keeps a query string that selects content', async ({ page }) => {
		// Dropping the query is the usual advice and would be wrong here: it
		// collapses ?page=2 onto the first page and tells a crawler that two
		// different listings are the same document.
		await page.goto('/challenges?page=2');
		const href = await page.locator('link[rel="canonical"]').getAttribute('href');
		expect(href).toContain('page=2');
	});
});
