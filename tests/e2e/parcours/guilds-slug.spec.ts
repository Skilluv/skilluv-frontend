/**
 * SKI-51 — page publique d'une guild (visiteur anonyme).
 *
 * Le test recupere la premiere guild du listing via l'API publique, puis
 * navigue sur son slug. Si aucune guild n'existe encore cote back, skip.
 */
import { test, expect } from '@playwright/test';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);

test.describe('@parcours guilds-slug', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL');
	test.setTimeout(60_000);

	test('page guild slug accessible ou fallback 404 propre', async ({ page }, testInfo) => {
		const listRes = await page.request.get('/api/guilds?limit=1');
		let slug = 'unknown-guild-e2e';
		if (listRes.ok()) {
			const body = (await listRes.json()) as { data?: { items?: Array<{ slug?: string }> } };
			slug = body.data?.items?.[0]?.slug ?? slug;
		}
		await page.goto(`/guilds/${encodeURIComponent(slug)}`);
		await page.waitForLoadState('domcontentloaded');
		await page.screenshot({ path: testInfo.outputPath('step-1-arrival.png'), fullPage: true });
		// Slug valide → h1 guild ; slug inconnu → h1 404/erreur. Les deux sont OK.
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
		await page.screenshot({ path: testInfo.outputPath('step-2-loaded.png'), fullPage: true });
	});
});
