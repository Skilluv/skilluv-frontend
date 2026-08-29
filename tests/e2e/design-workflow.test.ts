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
	'/design/contests/plagiarism/00000000-0000-0000-0000-000000000000',
	'/design/awards',
	'/design/toolkit',
	'/design/series'
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
				/\b(designWorkshop|designUpload|designTools|designBriefs|nextChallenges|missionWork|designPlagiarism|designIterationStories|designSeries)\.[a-zA-Z]+/
			);
		}
	});

	test('every workflow page renders exactly one h1', async ({ page }) => {
		for (const path of WORKFLOW_PAGES) {
			await gotoHydrated(page, path);
			await expect(page.locator('h1'), `h1 count on ${path}`).toHaveCount(1);
		}
	});

	test('the wizard ends on a suggestion list and a mentor list', async ({ page }) => {
		// O-02 and O-03 sit at the end of the wizard rather than on pages of
		// their own: the moment somebody has just said what they want is the
		// moment a suggestion means something. Both render their own empty
		// state with no backend, so the block must survive a 404 on each.
		await gotoHydrated(page, '/design/onboarding');
		await expect(page.getByTestId('design-next-challenges')).toBeVisible();
		await expect(page.getByTestId('design-mentor-matches')).toBeVisible();
	});

	test('an unknown attestation code still renders its page', async ({ page }) => {
		await gotoHydrated(page, '/attestations/verify/UNKNOWNCODE');
		await expect(page.getByTestId('attestation-verify-page')).toBeVisible();
		// No certificate on something that does not verify: a proud document
		// under the words "unknown code" would be the page arguing with itself.
		await expect(page.getByTestId('attestation-certificate')).toHaveCount(0);
	});

	test('the awards page renders and is reachable from the contests board', async ({ page }) => {
		await gotoHydrated(page, '/design/contests');
		await expect(page.getByTestId('design-awards-link')).toBeVisible();

		await gotoHydrated(page, '/design/awards');
		await expect(page.getByTestId('design-awards-page')).toBeVisible();
		// With no backend the edition 404s, and the page has to say so rather
		// than rendering an empty ceremony.
		await expect(page.getByTestId('design-awards-missing')).toBeVisible();
	});

	test('the toolkit page is linked from contests and survives a dead API', async ({ page }) => {
		await gotoHydrated(page, '/design/contests');
		await expect(page.getByTestId('design-toolkit-link')).toBeVisible();

		await gotoHydrated(page, '/design/toolkit');
		await expect(page.getByTestId('design-practice-page')).toBeVisible();
		await expect(page.locator('h1')).toBeVisible();
		// With both listings failing, the page shows the failure rather than
		// two empty sections implying the domain has no tools and no terrains.
		// The sections themselves are covered by the unit specs, which can put
		// rows behind the endpoints.
		await expect(page.getByTestId('design-toolkit')).toHaveCount(0);
	});

	test('the series board is linked from contests and renders', async ({ page }) => {
		await gotoHydrated(page, '/design/contests');
		await expect(page.getByTestId('design-series-link')).toBeVisible();

		await gotoHydrated(page, '/design/series');
		await expect(page.getByTestId('design-series-page')).toBeVisible();
	});

	test('an unknown series says so rather than erroring', async ({ page }) => {
		await gotoHydrated(page, '/design/series/does-not-exist');
		await expect(page.getByTestId('design-series-detail')).toBeVisible();
	});

	test('the mission workspace renders for an unknown slug', async ({ page }) => {
		// Every panel on it is loaded with `allSettled`, so a mission that does
		// not exist must leave a page, not a stack trace.
		await gotoHydrated(page, '/design/missions/does-not-exist/workspace');
		await expect(page.locator('h1')).toBeVisible();
	});
});
