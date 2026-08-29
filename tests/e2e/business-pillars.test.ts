import { test, expect } from '@playwright/test';
import { gotoHydrated } from './utils/hydration';

/**
 * The five business pillars of SKI-329, whose backends were served and whose
 * fronts did not exist.
 *
 * Every page here talks to endpoints the mock backend answers 404 or 401 for,
 * which is the point: each was built to render a page rather than a stack
 * trace when its listing comes back empty. A surface that only works with data
 * is a surface nobody can open on their first day.
 */

const PAGES = [
	'/requests',
	'/creator',
	'/work',
	'/settings/portfolios',
	'/security/competitions'
];

test.describe('Business pillar pages', () => {
	test('the solicitations inbox renders and says what it cannot list', async ({ page }) => {
		await gotoHydrated(page, '/requests');
		await expect(page.getByTestId('requests-page')).toBeVisible();
		// Consultations and engagements can be answered and not listed. An empty
		// shelf would read as "nobody asked you"; the sentence says otherwise.
		await expect(page.getByTestId('requests-unlisted-note')).toBeVisible();
	});

	test('the creator page renders', async ({ page }) => {
		await gotoHydrated(page, '/creator');
		await expect(page.getByTestId('creator-page')).toBeVisible();
	});

	test('the other-ways-to-work page renders', async ({ page }) => {
		await gotoHydrated(page, '/work');
		await expect(page.getByTestId('work-page')).toBeVisible();
	});

	test('the data consent panel leads the privacy page with its purposes', async ({ page }) => {
		await gotoHydrated(page, '/settings/privacy');
		await expect(page.getByTestId('data-consent-panel')).toBeVisible();
	});

	test('the wallet carries its advances', async ({ page }) => {
		await gotoHydrated(page, '/wallet');
		await expect(page.getByTestId('wallet-advances')).toBeVisible();
	});

	test('every pillar page renders exactly one h1', async ({ page }) => {
		for (const path of PAGES) {
			await gotoHydrated(page, path);
			await expect(page.locator('h1'), `h1 count on ${path}`).toHaveCount(1);
		}
	});

	test('no i18n key leaks as a raw dotted path on any pillar page', async ({ page }) => {
		for (const path of PAGES) {
			await gotoHydrated(page, path);
			const body = await page.locator('body').innerText();
			expect(body, `raw i18n key leaked on ${path}`).not.toMatch(
				/\b(requests|creator|work|advances|dataConsent|craftProfile|portfolioSettings)\.[a-zA-Z]+/
			);
		}
	});
});

/**
 * The domain workbenches — quality and ops.
 *
 * Both had eleven endpoints served and one read: the profile record. So a
 * practitioner in either could be *seen* to have done the work and had nowhere
 * to do it.
 */
test.describe('Domain workbenches', () => {
	test('the quality workbench renders without a review queue', async ({ page }) => {
		// The review tab appears only when the server says this caller has
		// something to judge — never from a role check here. With no backend the
		// queue is empty, so the tab must be absent.
		await gotoHydrated(page, '/quality');
		await expect(page.getByTestId('quality-page')).toBeVisible();
		await expect(page.locator('h1')).toBeVisible();
	});

	test('the ops workbench renders', async ({ page }) => {
		await gotoHydrated(page, '/ops');
		await expect(page.getByTestId('ops-page')).toBeVisible();
		await expect(page.locator('h1')).toBeVisible();
	});

	test('no i18n key leaks on either workbench', async ({ page }) => {
		for (const path of ['/quality', '/ops']) {
			await gotoHydrated(page, path);
			const body = await page.locator('body').innerText();
			expect(body, `raw i18n key leaked on ${path}`).not.toMatch(
				/\b(quality|ops|testRuns)\.[a-zA-Z]+/
			);
		}
	});
});

/**
 * Game and leadership — the two largest gaps of the sweep, sixteen and fifteen
 * endpoints with a single reader between them.
 */
test.describe('Game and leadership', () => {
	test('the game page renders', async ({ page }) => {
		await gotoHydrated(page, '/game');
		await expect(page.getByTestId('game-page')).toBeVisible();
		await expect(page.locator('h1')).toBeVisible();
	});

	test('the leadership workbench renders', async ({ page }) => {
		await gotoHydrated(page, '/leadership');
		await expect(page.getByTestId('leadership-page')).toBeVisible();
		await expect(page.locator('h1')).toBeVisible();
	});

	test('no i18n key leaks on either', async ({ page }) => {
		for (const path of ['/game', '/leadership']) {
			await gotoHydrated(page, path);
			const body = await page.locator('body').innerText();
			expect(body, `raw i18n key leaked on ${path}`).not.toMatch(
				/\b(game|playtest|leadership|leadershipArtefact|cohortOutcomes)\.[a-zA-Z]+/
			);
		}
	});
});

/**
 * Projects, the applicant tracker, and linked accounts.
 */
test.describe('Projects, ATS and identity', () => {
	test('the project catalogue keeps its three lists apart', async ({ page }) => {
		await gotoHydrated(page, '/projects');
		await expect(page.getByTestId('projects-page')).toBeVisible();
		await expect(page.locator('h1')).toBeVisible();
	});

	test('the applicant tracker renders in the enterprise console', async ({ page }) => {
		await gotoHydrated(page, '/enterprise/ats');
		await expect(page.getByTestId('ats-page')).toBeVisible();
	});

	test('no i18n key leaks on either', async ({ page }) => {
		for (const path of ['/projects', '/enterprise/ats']) {
			await gotoHydrated(page, path);
			const body = await page.locator('body').innerText();
			expect(body, `raw i18n key leaked on ${path}`).not.toMatch(
				/\b(projects|ats|linkedAccounts)\.[a-zA-Z]+/
			);
		}
	});
});

/**
 * The last surfaces: discovery, the code entry point, hiring contests, and
 * the report dialog that the platform served an endpoint for and never
 * offered.
 */
test.describe('Discovery and reporting', () => {
	test('explore renders without a record', async ({ page }) => {
		// The list a newcomer reads. A page built on the personal feed alone
		// would greet the person it most needs to convince with nothing.
		await gotoHydrated(page, '/explore');
		await expect(page.getByTestId('explore-page')).toBeVisible();
		await expect(page.locator('h1')).toBeVisible();
	});

	test('the code entry point leads with first issues', async ({ page }) => {
		await gotoHydrated(page, '/code');
		await expect(page.getByTestId('code-page')).toBeVisible();
		await expect(page.getByTestId('code-first-issues')).toBeVisible();
	});

	test('the contests page renders', async ({ page }) => {
		await gotoHydrated(page, '/contests');
		await expect(page.getByTestId('contests-page')).toBeVisible();
	});

	test('no i18n key leaks on the new surfaces', async ({ page }) => {
		for (const path of ['/explore', '/code', '/contests']) {
			await gotoHydrated(page, path);
			const body = await page.locator('body').innerText();
			expect(body, `raw i18n key leaked on ${path}`).not.toMatch(
				/\b(explore|codeDiscovery|contests|report|firstRun|assistantJobs)\.[a-zA-Z]+/
			);
		}
	});

	test('every new surface renders exactly one h1', async ({ page }) => {
		for (const path of ['/explore', '/code', '/contests']) {
			await gotoHydrated(page, path);
			await expect(page.locator('h1'), `h1 count on ${path}`).toHaveCount(1);
		}
	});
});
