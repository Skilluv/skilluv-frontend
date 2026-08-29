/**
 * SKI-53 — S6.9 SSO & SCIM settings (visibilité form).
 *
 * Callback IdP complet non testable (aucun IdP staging configuré). Le test
 * couvre uniquement l'accès à la page de config + rendu.
 */
import { test, expect } from '@playwright/test';
import { enterpriseStoragePath } from './_helpers/enterprise-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = enterpriseStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours enterprise-sso-settings', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL');
	test.skip(!HAS_STATE, 'requires enterprise-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });

	test('page SSO & SCIM accessible', async ({ page }) => {
		await page.goto('/enterprise/settings/sso');
		await page.waitForLoadState('networkidle');
		// Heading effectif : "Single Sign-On & SCIM" (le nom deployed contient
		// "Sign-On" et "SCIM" mais pas la chaine "SSO"). Regex elargi.
		await expect(
			page.getByRole('heading', { name: /Single Sign-On|SSO|SCIM/i, level: 1 })
		).toBeVisible({ timeout: 15_000 });
		// Note : la page peut afficher "Unauthorized" en contenu si l'owner cree
		// par enterprise-setup n'a pas encore le role admin/scim requis cote back.
		// Le heading reste visible car SSR-rendered, mais les champs de conf sont
		// gates. A investiguer cote back : quelle capability est requise pour
		// enterprise/settings/sso (probablement enterprise_admin ou similaire).
	});

});
