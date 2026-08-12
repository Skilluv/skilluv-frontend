import { expect, type Page } from '@playwright/test';

/**
 * Navigates, then waits for the app to be actually hydrated.
 *
 * A `click()` fired right after `page.goto()` can land before Svelte attached
 * its handlers. The click is then inert (no request, no screen change) and the
 * test waits for something that will never happen. Under load this hit a
 * different test on every run: one cause, many symptoms.
 *
 * The signal: `src/app.html` ships `<html lang="fr">` with no `dir` attribute,
 * and `i18n.init()` -> `applyDom()` sets `dir="ltr"` on the first client
 * effect. Its presence proves client code ran, without touching app code.
 */
export async function gotoHydrated(page: Page, path: string): Promise<void> {
	await page.goto(path);
	await expect(page.locator('html')).toHaveAttribute('dir', 'ltr', { timeout: 20_000 });
}
