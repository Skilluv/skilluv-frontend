/**
 * P26 v2 SKI-93 - /slices/[id] page.
 *
 * Authenticated run: on an unknown id the loader surfaces a 404 and the error
 * boundary renders a heading, so the page never blanks and never 500s. The
 * claim / submit-pr workflow is covered on mocks in
 * tests/e2e/p26-workflow.test.ts.
 */
import { test, expect } from '@playwright/test';
import { userStoragePath } from './_helpers/user-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = userStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours slice-detail', () => {
	// SKI-71: signed-in session through the shared helper, no skeleton fixture.
	// See tests/e2e/parcours/_helpers/user-session.ts.
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL + seeded back');
	test.skip(!HAS_STATE, 'requires user-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });
	test.setTimeout(60_000);

	test("un id inexistant rend l'error boundary, jamais un 500", async ({ page }) => {
		const res = await page.goto('/slices/00000000-0000-0000-0000-000000000000');
		await page.waitForLoadState('domcontentloaded');

		// Regression guard: the SSR loader must resolve the API URL through the
		// load event's fetch. A regression here brings back the 500
		// `Failed to parse URL from /api/slices/...`.
		expect(res?.status(), 'le loader ne doit jamais renvoyer un 500').not.toBe(500);
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 });
	});
});
