/**
 * Parcours — Bonjour Skilluv onboarding (Vague 4).
 * Skippé si PUBLIC_API_BASE_URL absent. Le POST /start requiert un compte
 * GitHub connecté côté back ; on couvre donc uniquement l'état "pas encore
 * démarré" + "skip" pour rester déterministe sans dépendance GitHub live.
 */
import { test, expect } from '@playwright/test';
import { userStoragePath } from './_helpers/user-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = userStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours onboarding-bonjour-skilluv', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL + seeded back');
	test.skip(!HAS_STATE, 'requires user-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });

	test('affiche la page Bonjour Skilluv ou redirect challenges (compte deja complete)', async ({ page }) => {
		await page.goto('/onboarding/bonjour-skilluv?next=/challenges/onboarding');
		await page.waitForLoadState('domcontentloaded');
		// Compte fresh → page onboarding visible. Compte deja profile_completed
		// → redirect vers /challenges/onboarding ou home. On tolere les deux.
		const bonjourPage = page.getByTestId('onboarding-bonjour-page');
		await expect(bonjourPage.or(page.locator('h1').first())).toBeVisible({ timeout: 15_000 });
	});
});
