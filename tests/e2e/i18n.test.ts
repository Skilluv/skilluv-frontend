import { test, expect } from '@playwright/test';
import { gotoHydrated } from './utils/hydration';

/**
 * The language is NOT pinned to `fr`: `i18n.init()` reads
 * `localStorage.skilluv-locale` first, then falls back to `navigator.language`
 * (`fr` unless the browser language is `en`). These tests lock both branches.
 * The previous version assumed unconditional French and broke as soon as
 * Playwright ran with its default `en-US` locale.
 */
test.describe('Internationalization', () => {
	test.describe('navigateur francophone', () => {
		test.use({ locale: 'fr-FR' });

		test('landing page rendue en francais', async ({ page }) => {
			await gotoHydrated(page, '/');
			await expect(page.locator('h1').first()).toContainText('Prouve');
			await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
		});
	});

	test.describe('navigateur anglophone', () => {
		test.use({ locale: 'en-US' });

		test('landing page rendue en anglais', async ({ page }) => {
			await gotoHydrated(page, '/');
			await expect(page.locator('h1').first()).toContainText('Prove');
			await expect(page.locator('html')).toHaveAttribute('lang', 'en');
		});
	});

	test('la preference stockee prime sur la langue du navigateur', async ({ page }) => {
		await page.addInitScript(() => {
			try {
				localStorage.setItem('skilluv-locale', 'fr');
			} catch {
				/* storage unavailable */
			}
		});
		await gotoHydrated(page, '/');
		await expect(page.locator('h1').first()).toContainText('Prouve');
	});

	test('error page shows localized message', async ({ page }) => {
		await gotoHydrated(page, '/nonexistent-page-12345');
		await expect(page.locator('text=404').first()).toBeVisible();
	});
});
