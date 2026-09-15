import { test, expect, type Page } from '@playwright/test';
import { gotoHydrated } from './utils/hydration';

/**
 * The two pages a newsletter mail links to.
 *
 * The API answers these as JSON, so a mail that linked straight to it would
 * show somebody a wall of braces. These pages call it and say what happened.
 *
 * Both act on load rather than asking for a second click: the click already
 * happened, in the mail. For the unsubscribe that is not a convenience but the
 * promise made beside the form — one click out — and leaving must never cost
 * more than joining did.
 */

const CONFIRM = '**/api/newsletter/confirm/**';
const UNSUB = '**/api/newsletter/unsubscribe/**';

function json(body: unknown, status = 200) {
	return { status, contentType: 'application/json', body: JSON.stringify(body) };
}

const NOT_FOUND = json(
	{ error: { code: 'RESOURCE_NOT_FOUND', message: 'this link is not valid any more' } },
	404
);

test.use({
	storageState: {
		cookies: [],
		origins: [
			{
				origin: 'http://localhost:4173',
				localStorage: [{ name: 'skilluv-launch-notice-2027-01-11', value: '1' }]
			}
		]
	}
});

const confirmState = (page: Page) => page.getByTestId('newsletter-confirm-state');
const unsubState = (page: Page) => page.getByTestId('newsletter-unsub-state');

test.describe('The confirmation link', () => {
	test('confirms on arrival and says the address is on the list', async ({ page }) => {
		const tokens: string[] = [];
		await page.route(CONFIRM, (route) => {
			tokens.push(new URL(route.request().url()).pathname.split('/').pop()!);
			return route.fulfill(json({ data: { message: 'confirmed' } }));
		});

		await gotoHydrated(page, '/newsletter/confirm/tok-abc123');

		await expect(confirmState(page)).toBeVisible();
		await expect(page.getByRole('heading', { level: 1 })).toContainText(/confirmé|confirmed/i);
		// The token from the URL is the one asked about, not a truncated or
		// re-encoded version of it.
		expect(tokens).toEqual(['tok-abc123']);
	});

	test('a spent token names both people it reaches, and orders neither about', async ({ page }) => {
		// The token is spent on use, so 404 arrives for somebody whose link
		// expired AND for somebody who clicked twice and is already on the list.
		// Nothing separates them, so the page must not tell the second half to
		// subscribe again — that is a loop they have already finished.
		await page.route(CONFIRM, (route) => route.fulfill(NOT_FOUND));

		await gotoHydrated(page, '/newsletter/confirm/stale');

		await expect(confirmState(page)).toContainText(/déjà|already/i);
		await expect(confirmState(page)).toContainText(/expir/i);
		// The way to a new link is offered for the half that needs it.
		await expect(page.getByRole('link', { name: /adresse|address/i })).toBeVisible();
	});

	test('does not blame the reader when the failure is ours', async ({ page }) => {
		await page.route(CONFIRM, (route) => route.fulfill(json({ error: { code: 'INTERNAL' } }, 500)));

		await gotoHydrated(page, '/newsletter/confirm/tok-abc123');

		await expect(confirmState(page)).toBeVisible();
		// A 500 is not an expired link, and telling somebody to subscribe again
		// would send them round a loop that cannot end.
		await expect(page.getByRole('heading', { level: 1 })).not.toContainText(/valable|valid/i);
	});
});

test.describe('The unsubscribe link', () => {
	test('takes the address off the list on arrival, with no second click', async ({ page }) => {
		let calls = 0;
		await page.route(UNSUB, (route) => {
			calls += 1;
			return route.fulfill(json({ data: { message: 'unsubscribed' } }));
		});

		await gotoHydrated(page, '/newsletter/unsubscribe/tok-abc123');

		await expect(unsubState(page)).toBeVisible();
		expect(calls, 'leaving must not cost more than joining did').toBe(1);
		// No reason asked, nothing to confirm. Scoped to the page's own block:
		// the navbar and footer around it have buttons of their own.
		const block = unsubState(page).locator('xpath=..');
		await expect(block.getByRole('button')).toHaveCount(0);
	});

	test('offers the way back, because a link can be followed by something other than a person', async ({
		page
	}) => {
		await page.route(UNSUB, (route) => route.fulfill(json({ data: { message: 'unsubscribed' } })));

		await gotoHydrated(page, '/newsletter/unsubscribe/tok-abc123');

		// The API exposes this as a GET, so a mail scanner following links can
		// remove somebody who never clicked. That is recoverable only if the way
		// back is on this page.
		await expect(page.getByRole('link', { name: /liste|list/i })).toBeVisible();
	});

	test('an unknown token says so without claiming anything about the address', async ({ page }) => {
		await page.route(UNSUB, (route) => route.fulfill(NOT_FOUND));

		await gotoHydrated(page, '/newsletter/unsubscribe/nope');
		await expect(unsubState(page)).toBeVisible();
	});

	test('opens for a visitor with no session at all', async ({ page }) => {
		// It is reached from a mail, by whoever holds that mail. A redirect to
		// sign in, or to the onboarding form, would leave somebody subscribed to
		// a letter they had just asked to leave.
		await page.route(UNSUB, (route) => route.fulfill(json({ data: { message: 'unsubscribed' } })));

		await gotoHydrated(page, '/newsletter/unsubscribe/tok-abc123');

		await expect(page).toHaveURL(/\/newsletter\/unsubscribe\/tok-abc123$/);
		await expect(unsubState(page)).toBeVisible();
	});
});
