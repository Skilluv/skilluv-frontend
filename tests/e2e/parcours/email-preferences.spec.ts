/**
 * Parcours authentifié — /settings/email-preferences (Ticket 3, Vague 1).
 *
 * Pré-requis :
 *  - back Skilluv joignable via PUBLIC_API_BASE_URL
 *  - seed E2E : utilisateur `user` valide dans tests/e2e/fixtures/auth.ts
 *
 * Sans back, les tests skip proprement (aucune régression CI Phase 1).
 */
import { test, expect } from '@playwright/test';
import { userStoragePath } from './_helpers/user-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = userStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours email-preferences', () => {
	// QUARANTINE: the front ships (/settings/email-preferences, covered by
	// tests/e2e/email-preferences.test.ts) but the backend endpoint
	// /api/users/me/email-preferences is not implemented yet (SKI-286).
	test.fixme(true, 'backend /api/users/me/email-preferences not implemented yet (SKI-286)');
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL + seeded back');
	test.skip(!HAS_STATE, 'requires user-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });

	test('affiche les 3 toggles et sauvegarde', async ({ page }) => {
		await page.goto('/settings/email-preferences');

		const digest = page.getByTestId('email-pref-digest_weekly');
		const streak = page.getByTestId('email-pref-streak_reminder');
		const marketing = page.getByTestId('email-pref-marketing');

		await expect(digest).toBeVisible();
		await expect(streak).toBeVisible();
		await expect(marketing).toBeVisible();

		// Toggle marketing and save.
		const initiallyChecked = await marketing.isChecked();
		await marketing.setChecked(!initiallyChecked);
		await page.getByRole('button', { name: /sauvegarder|save/i }).click();

		// Toast success visible.
		await expect(page.getByText(/préférences enregistrées|preferences saved/i)).toBeVisible({
			timeout: 5000
		});
	});
});
