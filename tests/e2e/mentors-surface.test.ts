import { test, expect } from '@playwright/test';
import { gotoHydrated } from './utils/hydration';

/**
 * Who each mentorship page is for, and what it may claim.
 *
 * `/mentors` sells sessions to mentees, and it used to lead with the revenue
 * split — in the heading, the meta description and a card — plus a refund grid
 * and the sentence "the rest goes directly to the mentor via Stripe Connect".
 * The split is an argument for recruiting mentors, not for buying an hour. The
 * refund grid is a clause, and belongs where it reassures: the booking form.
 *
 * The Stripe sentence is the one that mattered. It is true of the *mentor's
 * payout* and it sat on the *mentee's* page, where it reads as a statement
 * about how the visitor pays — and a session priced in XOF is paid by Mobile
 * Money, which `mentorship.rs` calls "how most people in Benin hold money".
 */
test.describe('Mentors shop window', () => {
	test('does not sell the commission split to the person buying an hour', async ({ page }) => {
		await gotoHydrated(page, '/mentors');

		const body = page.locator('body');
		await expect(body).not.toContainText('80 %');
		await expect(body).not.toContainText('80%');
		await expect(body).not.toContainText(/Skilluv prend 20/i);
	});

	test('does not claim the money moves through Stripe', async ({ page }) => {
		await gotoHydrated(page, '/mentors');
		// Naming one provider on a page whose visitors may pay by Mobile Money
		// is the failure, not the word itself.
		await expect(page.locator('body')).not.toContainText(/Stripe Connect/i);
	});

	test('says the payment methods that actually exist', async ({ page }) => {
		await gotoHydrated(page, '/mentors');
		// Naming the method is the point; naming the operators behind it is
		// detail the visitor meets at payment, not in a window.
		await expect(page.locator('body')).toContainText(/Mobile Money/i);
		await expect(page.locator('body')).not.toContainText(/Orange Money|MTN|Wave/i);
	});

	test('does not narrow mentoring to one discipline', async ({ page }) => {
		await gotoHydrated(page, '/mentors');
		// A mentor declares free-form `expertise_areas` and a `skill_domain`,
		// so mentoring spans every discipline. Copy that promises code review
		// and interview prep describes one mentor's offer as if it were the
		// product, and tells a design mentor this page is not for them.
		await expect(page.locator('body')).not.toContainText(/code review/i);
	});

	test('keeps the refund policy off the window', async ({ page }) => {
		await gotoHydrated(page, '/mentors');
		await expect(page.locator('body')).not.toContainText(/Refund automatique|Automatic refund/i);
	});

	test('offers no mentor-side management from the window', async ({ page }) => {
		await gotoHydrated(page, '/mentors');
		// Setting an hourly rate is not something a person looking to book is
		// doing; that path moved under the dashboard.
		const hero = page.locator('section').first();
		await expect(hero.getByRole('link', { name: /devenir mentor|become a mentor/i })).toHaveCount(0);
	});
});

test.describe('Mentor management', () => {
	test('lives under the dashboard', async ({ page }) => {
		await gotoHydrated(page, '/dashboard/mentor');
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	});

	test('the old address still leads there rather than 404ing', async ({ page }) => {
		// It was linked from the header and from the mentors hero, so somebody
		// has it bookmarked. A move must not read as a deletion.
		await page.goto('/mentors/me');
		await page.waitForURL('**/dashboard/mentor');
		expect(new URL(page.url()).pathname).toBe('/dashboard/mentor');
	});
});
