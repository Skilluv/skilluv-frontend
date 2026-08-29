/**
 * Parcours — detail facture enterprise (Vague 4).
 *
 * Aligne sur pattern SKI-53 : storageState via enterpriseStoragePath() (compte
 * fixe login-first genere par enterprise-setup.spec.ts). L'ancienne dependance
 * a loginAs('enterprise_owner') pointait vers enterprise_owner.json (underscore)
 * qui n'a jamais existe et bloquait sur un fixture squelette.
 *
 * Requiert le back seede avec au moins une facture (sinon early-return doux).
 */
import { test, expect } from '@playwright/test';
import { enterpriseStoragePath } from './_helpers/enterprise-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = enterpriseStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours enterprise-invoice-detail', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL');
	test.skip(!HAS_STATE, 'requires enterprise-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });

	test('liste factures -> detail -> HTML preview', async ({ page, context }) => {
		await page.goto('/enterprise/credits/invoices');
		await page.waitForLoadState('domcontentloaded');

		const detailLinks = page.getByTestId('invoice-detail-link');
		const count = await detailLinks.count();
		if (count === 0) {
			test.info().annotations.push({ type: 'note', description: 'no invoices in seed' });
			return;
		}

		await detailLinks.first().click();
		await expect(page.getByTestId('invoice-detail-page')).toBeVisible();
		await expect(page.getByTestId('invoice-detail-header')).toBeVisible();
		await expect(page.getByTestId('invoice-detail-amounts')).toBeVisible();

		const htmlBtn = page.getByTestId('invoice-html-btn');
		await expect(htmlBtn).toBeVisible();
		const popupPromise = context.waitForEvent('page', { timeout: 5000 }).catch(() => null);
		await htmlBtn.click();
		const popup = await popupPromise;
		if (popup) {
			await popup.waitForLoadState('domcontentloaded').catch(() => {});
			expect(popup.url()).toContain('/enterprise/invoices/');
			await popup.close();
		}
	});
});
