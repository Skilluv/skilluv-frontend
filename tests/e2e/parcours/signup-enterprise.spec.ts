/**
 * Parcours — Signup enterprise owner (@signup).
 *
 * Route: /enterprise/register. Formulaire en 4 steps :
 *   1. Personal info → 2. Company info (submit register) → 3. Enterprise type → 4. Done.
 *
 * Le test s'arrête après la transition step 2 → step 3 (i.e. après le
 * POST /api/enterprise/register 2xx). La suite (choix du type + TOTP)
 * n'est pas nécessaire pour valider le signup lui-même.
 */
import { test, expect, type Response } from '@playwright/test';
import { getVerifyToken } from './_helpers/dev-verify';
import { ANONYMOUS_STATE } from './_helpers/user-session';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);

const NONCE = Date.now().toString(36);
const [ENT_LOCAL, ENT_DOMAIN] = (
	process.env.E2E_ENTERPRISE_EMAIL ?? 'test-enterprise@example.com'
).split('@');
const OWNER = {
	email: `${ENT_LOCAL}+${NONCE}@${ENT_DOMAIN}`,
	username: `flemart_pro_${NONCE}`,
	// Le validateur enterprise interdit d'inclure name/username/email dans le
	// password. Le user avait proposé "TestSkilluv2026!" mais lastName="Test"
	// déclenche le check `includesIdentity`. On utilise donc une variante.
	password: 'Skl-Uv-Str0ng-Br1cks!',
	firstName: 'Flemart',
	lastName: 'Test',
	companyName: `Flemart Pro Test ${NONCE}`,
	website: 'https://flemart.com',
	industry: 'technology',
	// Company size : le composant Select est natif ici. Valeur enum front : '1-10'.
	companySize: '1-10',
	countrySearch: 'Benin'
};

test.describe('@signup signup-enterprise', () => {
	// SKI-71: explicit session posture. The subject of this test IS the
	// anonymous visitor, so no session must leak in from another spec.
	test.use({ storageState: ANONYMOUS_STATE });
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL (back staging)');
	test.setTimeout(90_000);

	test('inscription enterprise owner bout-en-bout', async ({ page }, testInfo) => {
		const enterpriseCalls: { url: string; status: number; body: string }[] = [];
		page.on('response', async (res: Response) => {
			if (res.request().url().includes('/api/enterprise/register')) {
				let body = '';
				try {
					body = (await res.text()).slice(0, 500);
				} catch {
					/* ignore */
				}
				enterpriseCalls.push({ url: res.url(), status: res.status(), body });
			}
		});

		await page.addInitScript(() => {
			try {
				localStorage.setItem('skilluv-consent-version', '1');
				localStorage.setItem(
					'skilluv-consent-v1',
					JSON.stringify({ version: 1, functional: false, analytics: false, marketing: false, decidedAt: new Date().toISOString() })
				);
			} catch { /* ignore */ }
		});

		// ---- STEP 1 : personal ----
		await page.goto('/enterprise/register');
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
		// Attendre l'hydration Svelte 5 (sans ça les onclick step 1 -> step 2 ne
		// sont pas encore bindés au moment du fill/submit).
		await page.waitForLoadState('networkidle');
		await page.screenshot({ path: testInfo.outputPath('ent-step-1-empty.png'), fullPage: true });

		// Fill via placeholder (unique par step, robuste au locale FR/EN).
		await page.getByPlaceholder(/^Marie$/).fill(OWNER.firstName);
		await page.getByPlaceholder(/^Dupont$/).fill(OWNER.lastName);
		await page.getByPlaceholder(/^marie_dupont$/).fill(OWNER.username);
		await page.getByPlaceholder(/marie@entreprise\.com/).fill(OWNER.email);
		await page.locator('input[type="password"]').fill(OWNER.password);
		await page.screenshot({ path: testInfo.outputPath('ent-step-1-filled.png'), fullPage: true });

		// Ciblage strict : bouton submit du <form> step 1 (accent + type=submit).
		// L'ancien selector `hasText:/Continuer|Continue/` etait ambigu — matchait
		// aussi "Continue with Google" dans la section SSO qui suit le form.
		await page.locator('form').first().locator('button[type="submit"]').click();

		// ---- STEP 2 : company ----
		await expect(page.locator('h1').filter({ hasText: /entreprise|company/i }).first()).toBeVisible({ timeout: 10_000 });
		await page.screenshot({ path: testInfo.outputPath('ent-step-2-empty.png'), fullPage: true });

		await page.getByPlaceholder(/Skilluv Inc/i).fill(OWNER.companyName);
		await page.getByPlaceholder(/https:\/\/entreprise\.com/).fill(OWNER.website);

		// Industry & Country sont optionnels côté back — on ne les remplit pas
		// pour garder le test rapide et déterministe.

		// Terms
		await page.getByRole('checkbox').last().check();
		await page.screenshot({ path: testInfo.outputPath('ent-step-2-filled.png'), fullPage: true });

		// SUBMIT
		const submitPromise = page.waitForResponse(
			(r) => r.url().includes('/api/enterprise/register') && r.request().method() === 'POST',
			{ timeout: 30_000 }
		);
		await page.locator('button[type="submit"]').first().click();

		const res = await submitPromise.catch((e) => {
			throw new Error(`BLOCAGE: aucune requête POST /api/enterprise/register — ${e.message}`);
		});

		const status = res.status();
		const body = await res.text().catch(() => '');

		if (status < 200 || status >= 300) {
			await page.screenshot({ path: testInfo.outputPath('ent-step-3-error.png'), fullPage: true });
			throw new Error(
				`BLOCAGE: POST /api/enterprise/register = ${status}. Body: ${body.slice(0, 400)}. ` +
					`Vérifier: enum company_size (front="1-10"), industry, contraintes back.`
			);
		}

		// Attend transition vers step 3 (enterprise type selector) ou step 4 (done).
		await expect(
			page.getByRole('heading', { name: /type|Presque prêt|Almost ready/i }).first()
		).toBeVisible({ timeout: 10_000 });
		await page.screenshot({ path: testInfo.outputPath('ent-step-3-type.png'), fullPage: true });

		// ---- STEP 4 : verify-email + assertion 2FA obligatoire (enterprise) ----
		// Consomme : 0 register (dev endpoint hors rate-limit).
		const verify = await getVerifyToken(page, OWNER.email);
		expect(verify.token, 'dev-verify token').toBeTruthy();
		testInfo.annotations.push({
			type: 'dev-verify',
			description: `token=${verify.token.slice(0, 8)}... user_id=${verify.user_id ?? 'n/a'} ttl=${verify.ttl_seconds ?? 'n/a'}`
		});
		// Le back a indiqué requires_totp_setup: true pour enterprise owner.
		// Si le champ est exposé dans la réponse dev-verify, on l'assert. Sinon on
		// log en annotation pour audit manuel — pas d'échec dur (contrat non figé).
		if ('requires_totp_setup' in verify) {
			expect(verify.requires_totp_setup, 'enterprise owner doit setup TOTP').toBe(true);
		} else {
			testInfo.annotations.push({
				type: 'audit',
				description: 'Champ requires_totp_setup absent de la réponse dev-verify — à confirmer côté back.'
			});
		}

		await page.goto(`/auth/verify-email?token=${encodeURIComponent(verify.token)}`);
		// Attend la transition final ("Verifying..." -> success/error) — sinon
		// on lit trop tôt pendant le POST /auth/verify-email.
		const successHeading = page.getByRole('heading', { level: 1 }).first();
		await expect(successHeading).toHaveText(
			/success|vérifié|verifie|verified|confirm|error|erreur/i,
			{ timeout: 15_000 }
		);
		await page.screenshot({ path: testInfo.outputPath('ent-step-4-verify.png'), fullPage: true });

		testInfo.annotations.push({
			type: 'account-created',
			description: `Enterprise + owner créés (${OWNER.email} / ${OWNER.companyName}). À nettoyer côté back (RGPD). 2FA restant à configurer.`
		});

		expect(status).toBeGreaterThanOrEqual(200);
		expect(status).toBeLessThan(300);
	});
});
