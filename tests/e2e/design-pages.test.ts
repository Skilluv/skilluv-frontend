import { test, expect } from '@playwright/test';
import { gotoHydrated } from './utils/hydration';

/**
 * SKI-237, SKI-248, SKI-265 — the public design surfaces render and hydrate.
 *
 * No backend in this suite: every page has to survive its own endpoint
 * answering 404, which is the failure these catch — a page that throws on
 * mount, a missing i18n namespace, a broken import.
 */
test.describe('Skilluv Design pages', () => {
	test('the contest board renders its shelves', async ({ page }) => {
		await gotoHydrated(page, '/design/contests');
		await expect(page.getByTestId('design-contests-page')).toBeVisible();
		await expect(page.locator('h1')).toBeVisible();
	});

	test('the mission board renders with its how-it-works panel', async ({ page }) => {
		await gotoHydrated(page, '/design/missions');
		await expect(page.getByTestId('design-missions-page')).toBeVisible();
		await expect(page.locator('h1')).toBeVisible();
		// The commission is stated on the board, not discovered at payout.
		await expect(page.locator('aside')).toBeVisible();
	});

	test('the designer wizard opens on its first question', async ({ page }) => {
		await gotoHydrated(page, '/design/onboarding');
		await expect(page.getByTestId('design-onboarding')).toBeVisible();
		await expect(page.getByRole('progressbar')).toBeVisible();
	});

	test('the wizard walks forward and back without a backend', async ({ page }) => {
		await gotoHydrated(page, '/design/onboarding');
		const heading = page.locator('h2').first();
		const firstQuestion = await heading.innerText();

		await page.getByRole('button', { name: /suivant|next/i }).click();
		await expect(heading).not.toHaveText(firstQuestion);

		await page.getByRole('button', { name: /retour|back/i }).click();
		await expect(heading).toHaveText(firstQuestion);
	});

	test('no i18n key leaks as a raw dotted path', async ({ page }) => {
		for (const path of ['/design/contests', '/design/missions', '/design/onboarding']) {
			await gotoHydrated(page, path);
			const body = await page.locator('body').innerText();
			expect(body).not.toMatch(
				/\b(designContests|missions|designProfile|designWizard)\.[a-zA-Z]+\.[a-zA-Z]/
			);
		}
	});
});

test.describe('Issued attestation verification', () => {
	test('an unknown code renders the page rather than an error screen', async ({ page }) => {
		await gotoHydrated(page, '/attestations/verify/UNKNOWNCODE');
		await expect(page.getByTestId('attestation-verify-page')).toBeVisible();
		await expect(page.locator('h1')).toBeVisible();
	});

	test('no i18n key leaks on the verification page', async ({ page }) => {
		await gotoHydrated(page, '/attestations/verify/UNKNOWNCODE');
		const body = await page.locator('body').innerText();
		expect(body).not.toMatch(/\battestationVerify\.[a-zA-Z]/);
	});
});
