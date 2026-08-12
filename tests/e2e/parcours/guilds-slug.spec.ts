/**
 * SKI-51 — page publique d'une guild (visiteur anonyme).
 *
 * Le test recupere la premiere guild du listing via l'API publique, puis
 * navigue sur son slug. Si aucune guild n'existe encore cote back, skip.
 */
import { test, expect } from '@playwright/test';
import { userStoragePath } from './_helpers/user-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = userStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours guilds-slug', () => {
	// SKI-71: signed-in session through the shared helper, no skeleton fixture.
	// See tests/e2e/parcours/_helpers/user-session.ts.
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL + seeded back');
	test.skip(!HAS_STATE, 'requires user-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });
	test.setTimeout(60_000);

	test('page guild slug accessible ou fallback 404 propre', async ({ page }, testInfo) => {
		// The backend returns `{ data: { guilds: [...] } }`. Reading `data.items`
		// always yielded undefined, so the test silently fell back to a bogus
		// slug and only ever exercised the not-found branch.
		const listRes = await page.request.get('/api/guilds?limit=1');
		let slug = 'unknown-guild-e2e';
		if (listRes.ok()) {
			const body = (await listRes.json()) as { data?: { guilds?: Array<{ slug?: string }> } };
			slug = body.data?.guilds?.[0]?.slug ?? slug;
		}
		await page.goto(`/guilds/${encodeURIComponent(slug)}`);
		await page.waitForLoadState('domcontentloaded');
		await page.screenshot({ path: testInfo.outputPath('step-1-arrival.png'), fullPage: true });
		// Valid slug renders the guild heading, unknown slug renders the
		// not-found heading. Both are acceptable; a blank page is not.
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
		await page.screenshot({ path: testInfo.outputPath('step-2-loaded.png'), fullPage: true });
	});
});
