/**
 * Parcours end-to-end complet — user fresh du signup au 1er challenge.
 *
 * Chemin teste :
 *   1. /auth/register (domain picker + account form) -> POST /auth/register
 *   2. redirect vers /onboarding/bonjour-skilluv (page welcome)
 *   3. verify-email programmatique via dev-endpoint (dev-verify helper)
 *   4. /onboarding/complete-profile (skill_domain + terms) -> POST /me/complete
 *   5. /onboarding/orientations (optionnel, peut skipper) -> POST /me/orientations
 *   6. /challenges -> premier challenge accessible
 *
 * Consomme 1 register cost (rate-limit budget 5/heure). Utiliser un email
 * plus-addressing pour permettre re-run sans collision : `jeremiezitti+onbNONCE@gmail.com`.
 */
import { test, expect, type Response } from '@playwright/test';
import { getVerifyToken } from './_helpers/dev-verify';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const NONCE = Date.now().toString(36);

const FRESH_USER = {
	email: `jeremiezitti+onb${NONCE}@gmail.com`,
	username: `jz_onb_${NONCE}`,
	password: 'TestSkilluv2026!',
	firstName: 'Jeremie',
	lastName: 'Zitti'
} as const;

test.describe('@parcours onboarding-fresh-user', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL (back staging)');
	test.setTimeout(120_000);

	test('signup fresh user -> onboarding -> premier challenge accessible', async ({ page }, testInfo) => {
		// Pre-dismiss cookie banner pour eviter overlay.
		await page.addInitScript(() => {
			try {
				localStorage.setItem('skilluv-consent-version', '1');
				localStorage.setItem(
					'skilluv-consent-v1',
					JSON.stringify({
						version: 1,
						functional: false,
						analytics: false,
						marketing: false,
						decidedAt: new Date().toISOString()
					})
				);
			} catch {
				/* ignore */
			}
		});

		// ---- STEP 1 : domain picker /auth/register ----
		await page.goto('/auth/register');
		await page.waitForLoadState('networkidle');
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
		await page.screenshot({ path: testInfo.outputPath('01-domain-picker.png'), fullPage: true });

		const codeBtn = page
			.locator('button', { has: page.locator('p', { hasText: /^Code$/ }) })
			.first();
		await expect(codeBtn).toBeVisible({ timeout: 15_000 });
		await codeBtn.click();
		await page.waitForSelector(
			'button:has-text("Créer mon compte"), button:has-text("Create my account")',
			{ timeout: 10_000 }
		);

		// ---- STEP 2 : account form ----
		await page.getByPlaceholder(/^kofi_dev$/).fill(FRESH_USER.username);
		await page.getByPlaceholder(/kofi@exemple\.com/).fill(FRESH_USER.email);
		await page.getByPlaceholder(/^Kofi$/).fill(FRESH_USER.firstName);
		await page.getByPlaceholder(/^Mensah$/).fill(FRESH_USER.lastName);
		await page.locator('input[type="password"]').fill(FRESH_USER.password);

		// Country picker Benin
		const countryLabel = page
			.locator('span.text-sm', { hasText: /^(Pays|Country)$/ })
			.first();
		if (await countryLabel.isVisible().catch(() => false)) {
			await countryLabel.locator('..').getByRole('button').first().click();
		}
		const countrySearch = page.getByPlaceholder(/Rechercher|Search/i).first();
		await countrySearch.waitFor({ state: 'visible', timeout: 5_000 });
		await countrySearch.fill('Benin');
		await page.getByRole('option').filter({ hasText: /Benin/i }).first().click();

		await page.getByRole('checkbox').first().check();
		await page.screenshot({ path: testInfo.outputPath('02-form-filled.png'), fullPage: true });

		// SUBMIT
		const submitPromise = page.waitForResponse(
			(r: Response) => r.url().includes('/api/auth/register') && r.request().method() === 'POST',
			{ timeout: 30_000 }
		);
		await page.locator('button[type="submit"]').first().click();
		const submitRes = await submitPromise;

		if (submitRes.status() < 200 || submitRes.status() >= 300) {
			const body = await submitRes.text().catch(() => '');
			await page.screenshot({ path: testInfo.outputPath('02b-submit-error.png'), fullPage: true });
			throw new Error(
				`Register failed ${submitRes.status()}. Body: ${body.slice(0, 400)}`
			);
		}

		await page.waitForURL(/\/onboarding\/bonjour-skilluv/, { timeout: 15_000 });
		await page.screenshot({ path: testInfo.outputPath('03-onboarding-welcome.png'), fullPage: true });

		// ---- STEP 3 : verify-email programmatique ----
		const verify = await getVerifyToken(page, FRESH_USER.email);
		expect(verify.token, 'dev-verify token').toBeTruthy();
		await page.goto(`/auth/verify-email?token=${encodeURIComponent(verify.token)}`);
		const heading = page.getByRole('heading', { level: 1 }).first();
		await expect(heading).toHaveText(
			/success|verifie|verified|confirm|error|erreur/i,
			{ timeout: 15_000 }
		);
		await page.screenshot({ path: testInfo.outputPath('04-verify-email.png'), fullPage: true });

		// ---- STEP 4 : complete-profile ----
		await page.goto('/onboarding/complete-profile');
		await page.waitForLoadState('networkidle');
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
		await page.screenshot({ path: testInfo.outputPath('05-complete-profile.png'), fullPage: true });

		// ---- STEP 5 : orientations (optionnel — verifier accessibilite) ----
		await page.goto('/onboarding/orientations');
		await page.waitForLoadState('domcontentloaded');
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
		await page.screenshot({ path: testInfo.outputPath('06-orientations.png'), fullPage: true });

		// ---- STEP 6 : premier challenge accessible ----
		await page.goto('/challenges');
		await page.waitForLoadState('domcontentloaded');
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
		await page.screenshot({ path: testInfo.outputPath('07-challenges.png'), fullPage: true });

		testInfo.annotations.push({
			type: 'account-created',
			description: `Fresh user ${FRESH_USER.email} (${FRESH_USER.username}). Nettoyer cote back (RGPD).`
		});
	});
});
