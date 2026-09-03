import { test, expect } from '@playwright/test';

/**
 * The cookie banner, on a genuine first visit.
 *
 * The rest of the mocked suite starts from a seeded decision (see
 * `CONSENT_DECIDED` in playwright.config.ts) because those specs are about
 * other features and model a returning visitor. This file is the one that
 * clears it and asserts what a new arrival actually gets.
 *
 * An explicitly *empty* state is what puts this file back to a first visit.
 * `undefined` does not: Playwright reads it as "not specified" and falls back
 * to the project value, so the seed still applied and every assertion below
 * failed while looking like the feature was broken.
 */
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Cookie consent', () => {
	test('a first-time visitor is asked, and can refuse', async ({ page }) => {
		await page.goto('/');
		const banner = page.getByTestId('consent-banner');
		await expect(banner).toBeVisible();

		// Refusing must be reachable in one click from the banner — a refusal
		// buried one level deeper than acceptance is not freely given consent.
		await banner.getByRole('button', { name: /refuser|reject/i }).click();
		await expect(banner).toBeHidden();
	});

	test('the decision survives a reload', async ({ page }) => {
		await page.goto('/');
		await page
			.getByTestId('consent-banner')
			.getByRole('button', { name: /tout accepter|accept all/i })
			.click();
		await expect(page.getByTestId('consent-banner')).toBeHidden();

		await page.reload();
		// Asking again on every page load would be its own dark pattern.
		await expect(page.getByTestId('consent-banner')).toBeHidden();
	});

	test('refusing and accepting are equally prominent', async ({ page }) => {
		await page.goto('/');
		const banner = page.getByTestId('consent-banner');
		const accept = banner.getByRole('button', { name: /tout accepter|accept all/i });
		const reject = banner.getByRole('button', { name: /refuser|reject/i });

		const acceptBox = await accept.boundingBox();
		const rejectBox = await reject.boundingBox();
		expect(acceptBox).not.toBeNull();
		expect(rejectBox).not.toBeNull();

		// Same height, and neither hidden behind a scroll. A "reject" rendered
		// smaller or further away than "accept" is the classic dark pattern the
		// CNIL fines for, and it is easy to reintroduce with one class change.
		expect(Math.abs(acceptBox!.height - rejectBox!.height)).toBeLessThanOrEqual(2);
		await expect(reject).toBeInViewport();
	});

	test('the French copy is not covered by the buttons at desktop width', async ({ page }) => {
		// The row was sized around the English strings. French runs about a
		// fifth longer, and with `min-width: auto` on the text and `flex-none`
		// on the buttons neither side could give: the row overflowed the card
		// and the buttons, painted later, sat on top of the sentence. Nothing
		// in the class list says which language it was tuned for, so the guard
		// has to be the geometry.
		await page.addInitScript(() => localStorage.setItem('skilluv-locale', 'fr'));
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/');

		const banner = page.getByTestId('consent-banner');
		await expect(banner).toBeVisible();
		const body = banner.locator('p').first();
		await expect(body).toContainText('Nous utilisons des cookies');

		const bodyBox = (await body.boundingBox())!;
		expect(bodyBox).not.toBeNull();

		for (const name of [/personnaliser/i, /refuser/i, /tout accepter/i]) {
			const box = (await banner.getByRole('button', { name }).boundingBox())!;
			expect(box).not.toBeNull();
			const overlaps =
				bodyBox.x < box.x + box.width &&
				box.x < bodyBox.x + bodyBox.width &&
				bodyBox.y < box.y + box.height &&
				box.y < bodyBox.y + bodyBox.height;
			expect(overlaps, `"${name}" overlaps the consent copy`).toBe(false);
		}

		// And the sentence stays inside the card rather than running past it.
		const cardBox = (await banner.locator('div').first().boundingBox())!;
		expect(bodyBox.x + bodyBox.width).toBeLessThanOrEqual(cardBox.x + cardBox.width + 1);
	});

	test('preferences can be reopened from the footer after deciding', async ({ page }) => {
		await page.goto('/');
		await page
			.getByTestId('consent-banner')
			.getByRole('button', { name: /tout accepter|accept all/i })
			.click();
		await expect(page.getByTestId('consent-banner')).toBeHidden();

		// Withdrawal has to be as easy as consent, and the banner is gone once
		// a choice is made — the footer entry is the only way back.
		const manage = page.getByTestId('footer-manage-consent');
		await manage.scrollIntoViewIfNeeded();
		await manage.click();

		await expect(page.getByTestId('consent-history')).toBeVisible();
	});
});
