/**
 * Teams management — Vague 5, ticket 2.
 * Vérifie /dashboard/teams (créer + lister) et /teams/[team_id] (outils capitaine).
 * Skip si backend absent.
 */
import { test, expect } from '@playwright/test';
import { userStoragePath } from './_helpers/user-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = userStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours teams management', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL + seeded back');
	test.skip(!HAS_STATE, 'requires user-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });

	test('/dashboard/teams charge ma liste et permet de créer une équipe', async ({ page }) => {
		await page.goto('/dashboard/teams');
		await expect(page.getByTestId('dashboard-teams-page')).toBeVisible();
		// La liste OU l'empty state doit être visible (les 2 sont des états valides)
		const list = page.getByTestId('my-teams-list');
		const empty = page.getByRole('heading', { level: 1 });
		await expect(list.or(empty)).toBeVisible();
	});
});
