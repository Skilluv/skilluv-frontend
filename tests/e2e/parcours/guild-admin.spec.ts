/**
 * Guild admin — Vague 5, ticket 6.
 * Vérifie que la page /guilds/[slug] rend les onglets admin quand un
 * owner/officer est loggé. Skip si backend absent (parcours contract only).
 */
import { test, expect } from '@playwright/test';
import { userStoragePath } from './_helpers/user-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = userStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours guild admin', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL + seeded back');
	test.skip(!HAS_STATE, 'requires user-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });

	test('page guilds/{slug} affiche les onglets et le membre courant peut voir composition', async ({ page }) => {
		await page.goto('/guilds');
		const first = page.locator('a[href^="/guilds/"]').first();
		const count = await first.count();
		if (count === 0) {
			test.info().annotations.push({ type: 'note', description: 'no guild in seed' });
			return;
		}
		await first.click();
		await expect(page.getByTestId('guild-page')).toBeVisible();

		// Onglet Composition
		await page.getByTestId('guild-tab-composition').click();
		await expect(page.getByTestId('composition-panel')).toBeVisible();

		// Onglet Wars
		await page.getByTestId('guild-tab-wars').click();
		// Members list toujours accessible
		await page.getByTestId('guild-tab-members').click();
		await expect(page.getByTestId('members-list')).toBeVisible();
	});
});
