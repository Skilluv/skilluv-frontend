import { test, expect } from '@playwright/test';
import { gotoHydrated } from './utils/hydration';

/**
 * The design workflow surfaces render and hydrate with no backend.
 *
 * Every page here has to survive its own endpoints answering 401 or 404,
 * because that is what a signed-out visitor and a broken deployment both look
 * like. The failures these catch are the ones a type-check cannot: a page that
 * throws on mount, an i18n namespace that was never wired, a component
 * imported under a name the barrel does not export.
 */

const WORKFLOW_PAGES = [
	'/design/tools',
	'/design/briefs',
	'/design/reviews',
	'/design/contests/plagiarism/00000000-0000-0000-0000-000000000000'
];

test.describe('design workflow pages', () => {
	test('the tools page shows both halves: connections and the link inspector', async ({ page }) => {
		await gotoHydrated(page, '/design/tools');
		await expect(page.locator('h1')).toBeVisible();
		await expect(page.getByTestId('design-cloud-connections')).toBeVisible();
		await expect(page.getByTestId('design-link-inspector')).toBeVisible();
	});

	test('the link inspector accepts a paste and stays usable without a backend', async ({
		page
	}) => {
		await gotoHydrated(page, '/design/tools');
		const field = page.getByTestId('design-inspect-url');
		await field.fill('https://www.figma.com/file/abc/name');
		// The button leaves its disabled state as soon as there is something to
		// check; whether the request lands is the backend's business.
		await expect(page.getByRole('button', { name: /vérifier|check/i })).toBeEnabled();
	});

	test('an over-long link is refused in the field rather than costing a round trip', async ({
		page
	}) => {
		await gotoHydrated(page, '/design/tools');
		await page.getByTestId('design-inspect-url').fill(`https://x.test/${'a'.repeat(2100)}`);
		await expect(page.getByRole('button', { name: /vérifier|check/i })).toBeDisabled();
	});

	test('the brief form renders and refuses an empty proposal', async ({ page }) => {
		await gotoHydrated(page, '/design/briefs');
		await expect(page.getByTestId('design-brief-form')).toBeVisible();
		const submit = page.getByRole('button', { name: /proposer|propose/i });
		await expect(submit).toBeDisabled();
	});

	test('the reviewer queue renders its empty state without claiming a refusal', async ({
		page
	}) => {
		await gotoHydrated(page, '/design/reviews');
		await expect(page.locator('h1')).toBeVisible();
		// The queue and the suggestion list both live here, so an idle reviewer
		// is handed something to do rather than an empty page.
		await expect(page.getByTestId('design-next-challenges')).toBeVisible();
	});

	test('a plagiarism case nobody may read says so, rather than erroring', async ({ page }) => {
		await gotoHydrated(page, '/design/contests/plagiarism/00000000-0000-0000-0000-000000000000');
		await expect(page.locator('h1')).toBeVisible();
	});

	test('no i18n key leaks as a raw dotted path on any workflow page', async ({ page }) => {
		for (const path of WORKFLOW_PAGES) {
			await gotoHydrated(page, path);
			const body = await page.locator('body').innerText();
			expect(
				body,
				`raw i18n key leaked on ${path}`
			).not.toMatch(
				/\b(designWorkshop|designUpload|designTools|designBriefs|designNext|designMissionWork|designPlagiarism|designIterationStories)\.[a-zA-Z]+/
			);
		}
	});

	test('every workflow page renders exactly one h1', async ({ page }) => {
		for (const path of WORKFLOW_PAGES) {
			await gotoHydrated(page, path);
			await expect(page.locator('h1'), `h1 count on ${path}`).toHaveCount(1);
		}
	});

	test('the mission workspace renders for an unknown slug', async ({ page }) => {
		// Every panel on it is loaded with `allSettled`, so a mission that does
		// not exist must leave a page, not a stack trace.
		await gotoHydrated(page, '/design/missions/does-not-exist/workspace');
		await expect(page.locator('h1')).toBeVisible();
	});
});
