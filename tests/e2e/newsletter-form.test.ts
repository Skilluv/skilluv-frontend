import { test, expect, type Page } from '@playwright/test';
import { gotoHydrated } from './utils/hydration';

/**
 * The footer newsletter form.
 *
 * It used to wait 400ms, clear the field and say nothing — the address was
 * never sent anywhere. Somebody who typed theirs got the same blank screen
 * whether it had worked or not, which is worse than having no form at all:
 * they believe they are on the list and they are not.
 *
 * So the two things worth holding are that the address actually leaves, with
 * the consent wording that was on screen beside it, and that every outcome is
 * said out loud — including the ones that are not success.
 *
 * The consent is a box that has to be ticked rather than a paragraph nobody
 * answers, so it is also the one thing here that can stop a submission.
 */

const FORM = '/newsletter/subscriptions';

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

async function fill(page: Page, address: string, optIn = true) {
	const field = page.locator('footer input[type="email"]');
	await field.scrollIntoViewIfNeeded();
	await field.fill(address);
	if (optIn) await page.getByTestId('newsletter-optin').check();
	await field.press('Enter');
}

const outcome = (page: Page) => page.getByTestId('newsletter-outcome');

test.describe('Subscribing from the footer', () => {
	test('sends the address, and says a confirmation mail is on its way', async ({ page }) => {
		const sent: Array<Record<string, unknown>> = [];
		await page.route(`**/api${FORM}`, async (route) => {
			sent.push(route.request().postDataJSON());
			await route.fulfill({
				status: 202,
				contentType: 'application/json',
				body: JSON.stringify({ data: { message: 'on its way' } })
			});
		});

		await gotoHydrated(page, '/');
		await fill(page, 'kofi@example.com');

		await expect(outcome(page)).toBeVisible();
		await expect(outcome(page)).toContainText(/confirmation/i);
		expect(sent).toHaveLength(1);
		expect(sent[0].email).toBe('kofi@example.com');
		// A consent is for a sentence. Sending the flag without the wording it
		// was given under makes it unreadable the day the wording changes.
		expect(String(sent[0].consent_text ?? ''), 'the wording shown must travel with it').toContain(
			'Skilluv'
		);
		expect(sent[0].source).toBe('footer');

		// And the field empties, so nobody sends it twice wondering.
		await expect(page.locator('footer input[type="email"]')).toHaveValue('');
		// The box empties with it: the next address is a new consent, not a
		// continuation of this one.
		await expect(page.getByTestId('newsletter-optin')).not.toBeChecked();
	});

	test('starts unticked, and says so rather than doing nothing when it stays that way', async ({
		page
	}) => {
		let calls = 0;
		await page.route(`**/api${FORM}`, async (route) => {
			calls += 1;
			await route.fulfill({ status: 202, contentType: 'application/json', body: '{"data":{}}' });
		});

		await gotoHydrated(page, '/');
		// A pre-ticked box is not a consent, it is a default.
		await expect(page.getByTestId('newsletter-optin')).not.toBeChecked();

		await fill(page, 'kofi@example.com', false);
		await expect(outcome(page)).toBeVisible();
		expect(calls, 'nothing may leave without the consent').toBe(0);
	});

	test('sends the wording the box actually carried, not a copy of it', async ({ page }) => {
		let body: Record<string, unknown> | null = null;
		await page.route(`**/api${FORM}`, async (route) => {
			body = route.request().postDataJSON();
			await route.fulfill({ status: 202, contentType: 'application/json', body: '{"data":{}}' });
		});

		await gotoHydrated(page, '/');
		const shown = (await page.getByTestId('newsletter-optin').locator('..').innerText()).trim();
		await fill(page, 'kofi@example.com');

		await expect(outcome(page)).toBeVisible();
		// What is stored must be readable back as what was on screen. If the two
		// are allowed to drift, the record says a consent was given for a
		// sentence nobody was ever shown.
		expect(body!.consent_text).toBe(shown);
	});

	test('refuses a malformed address without spending a round trip', async ({ page }) => {
		let calls = 0;
		await page.route(`**/api${FORM}`, async (route) => {
			calls += 1;
			await route.fulfill({ status: 202, contentType: 'application/json', body: '{"data":{}}' });
		});

		await gotoHydrated(page, '/');
		await fill(page, 'kofi@example');

		await expect(outcome(page)).toBeVisible();
		expect(calls, 'the API is not the place to learn this').toBe(0);
	});

	test('says so when the address is refused, rather than nothing', async ({ page }) => {
		await page.route(`**/api${FORM}`, (route) =>
			route.fulfill({
				status: 400,
				contentType: 'application/json',
				body: JSON.stringify({ error: { code: 'VALIDATION_ERROR', message: 'not an email' } })
			})
		);

		await gotoHydrated(page, '/');
		// A shape the client accepts and the server does not: the client regex is
		// deliberately the looser of the two, so this path is reachable.
		await fill(page, 'kofi@example.co');
		await expect(outcome(page)).toBeVisible();
	});

	test('says so when the list is rate limiting, rather than failing silently', async ({ page }) => {
		await page.route(`**/api${FORM}`, (route) =>
			route.fulfill({
				status: 429,
				contentType: 'application/json',
				body: JSON.stringify({ error: { code: 'RATE_LIMITED', message: 'slow down' } })
			})
		);

		await gotoHydrated(page, '/');
		await fill(page, 'kofi@example.com');
		await expect(outcome(page)).toContainText(/heure|hour/i);
	});

	test('says so when the request never lands', async ({ page }) => {
		await page.route(`**/api${FORM}`, (route) => route.abort('failed'));

		await gotoHydrated(page, '/');
		await fill(page, 'kofi@example.com');
		await expect(outcome(page)).toBeVisible();
		// Silence here is the original bug. Whatever it says, it must say it.
		await expect(outcome(page)).not.toHaveText('');
	});
});
