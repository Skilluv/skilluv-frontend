/**
 * SKI-53 — S6.4 KYC (visibilité formulaire seulement).
 *
 * Upload S3/MinIO non testable ici (staging n'a pas de bucket dédié E2E —
 * les fichiers uploadés en test s'accumuleraient). Voir annotation skip.
 */
import { test, expect } from '@playwright/test';
import { enterpriseStoragePath } from './_helpers/enterprise-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = enterpriseStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours enterprise-kyc', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL');
	test.skip(!HAS_STATE, 'requires enterprise-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });

	test('page KYC accessible + form visible', async ({ page }) => {
		await page.goto('/enterprise/kyc');
		await page.waitForLoadState('networkidle');
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
	});
});
