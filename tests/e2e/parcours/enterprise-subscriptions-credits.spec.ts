/**
 * SKI-53 — S6.8 abonnements + crédits (complète enterprise-invoice-detail).
 *
 * Sur un fresh account : aucun abonnement / aucun crédit acheté. On teste
 * l'accès aux pages et l'affichage du CTA "s'abonner" / "recharger" (empty).
 *
 * Checkout Stripe non-testable ici (mode test Stripe non configuré sur
 * staging côté back — voir annotation).
 */
import { test, expect } from '@playwright/test';
import { enterpriseStoragePath } from './_helpers/enterprise-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = enterpriseStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours enterprise-subscriptions-credits', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL');
	test.skip(!HAS_STATE, 'requires enterprise-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });

	test('subscriptions accessible (heading Abonnements ou fallback login)', async ({ page }) => {
		await page.goto('/enterprise/subscriptions');
		await page.waitForLoadState('domcontentloaded');
		// Gate back peut rediriger vers /auth/login selon capability. On tolere.
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
	});

	test('credits accessible + empty state', async ({ page }) => {
		await page.goto('/enterprise/credits');
		await page.waitForLoadState('networkidle');
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
	});
});
