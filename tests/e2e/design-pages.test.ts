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

	test('the designer wizard says so when it cannot reach its questions', async ({ page }) => {
		// The wizard renders from `GET …/questions` and ships no vocabulary of
		// its own, so with the endpoint dead there is nothing honest to draw.
		// What it must not do is render an empty form, or throw: the header
		// stands and the failure is stated.
		await gotoHydrated(page, '/design/onboarding');
		await expect(page.getByTestId('design-onboarding')).toBeVisible();
		await expect(page.locator('h1')).toBeVisible();
		await expect(page.getByRole('alert')).toBeVisible();
		// No half-rendered question behind the message.
		await expect(page.getByTestId('wizard-options')).toHaveCount(0);
	});

	test('the suggestions below the wizard survive the same outage', async ({ page }) => {
		// Both render their own empty state, so a dead API costs a hole in the
		// page rather than a crash. Walking the questions themselves needs the
		// backend and lives in `domain-onboarding.test.ts`.
		await gotoHydrated(page, '/design/onboarding');
		await expect(page.getByTestId('design-next-challenges')).toBeVisible();
		await expect(page.getByTestId('design-mentor-matches')).toBeVisible();
	});

	test('no i18n key leaks as a raw dotted path', async ({ page }) => {
		for (const path of ['/design/contests', '/design/missions', '/design/onboarding']) {
			await gotoHydrated(page, path);
			const body = await page.locator('body').innerText();
			expect(body).not.toMatch(
				/\b(designContests|missions|designProfile|domainWizard)\.[a-zA-Z]+\.[a-zA-Z]/
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
