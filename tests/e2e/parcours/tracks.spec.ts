/**
 * Parcours — catalogue /tracks + détail + enroll (Vague 3, P3).
 * Le enroll requiert auth : storageState user-setup si back présent.
 */
import { test, expect } from '@playwright/test';
import { userStoragePath } from './_helpers/user-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = userStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours tracks - public', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL + seeded back');

	test('liste publique → détail', async ({ page }) => {
		await page.goto('/tracks');
		await expect(page.getByTestId('tracks-page')).toBeVisible();

		const cards = page.getByTestId('track-card');
		const count = await cards.count();
		if (count === 0) {
			test.info().annotations.push({ type: 'note', description: 'no tracks in seed' });
			return;
		}
		await cards.first().click();
		await expect(page.getByTestId('track-detail-page')).toBeVisible();
	});
});

test.describe('@parcours tracks - enroll (auth)', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL + seeded back');
	test.skip(!HAS_STATE, 'requires user-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });

	test('enroll idempotent + progress visible', async ({ page }) => {
		await page.goto('/tracks');
		const cards = page.getByTestId('track-card');
		const count = await cards.count();
		if (count === 0) {
			test.info().annotations.push({ type: 'note', description: 'no tracks in seed' });
			return;
		}
		await cards.first().click();
		await expect(page.getByTestId('track-detail-page')).toBeVisible();

		const enrollBtn = page.getByTestId('track-enroll-btn');
		if (await enrollBtn.count()) {
			await enrollBtn.click();
			// Toast succès OU bouton passe à "Enrolled"
			await expect(page.getByText(/Inscrit|Enrolled/i).first()).toBeVisible({ timeout: 5000 });
		}
		// Progress apparaît après enroll
		await expect(page.getByTestId('track-progress')).toBeVisible({ timeout: 5000 });
	});

	test('/dashboard/tracks affiche ma liste', async ({ page }) => {
		await page.goto('/dashboard/tracks');
		await expect(page.getByTestId('dashboard-tracks-page')).toBeVisible();
	});
});
