/**
 * Parcours — Signup user standard (@signup).
 *
 * Test réel contre back staging (https://api.skill-uv.com via vite proxy).
 * Le back envoie un mail de vérification à la fin — le test s'arrête juste
 * après la réponse serveur (redirect vers /challenges/onboarding). La
 * validation du mail ne peut pas être automatisée ici (Playwright ne lit pas
 * Gmail) — voir annotation "MANUAL FOLLOW-UP".
 *
 * Skip conditionnel : PUBLIC_API_BASE_URL doit être défini (.env local ou CI).
 */
import { test, expect, type Request, type Response } from '@playwright/test';
import { getVerifyToken } from './_helpers/dev-verify';
import { ANONYMOUS_STATE } from './_helpers/user-session';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);

// Nonce pour éviter les collisions username/email si l'user relance sans
// cleanup. The address is derived from E2E_USER_EMAIL (see .env.example).
const NONCE = Date.now().toString(36);
const [USER_LOCAL, USER_DOMAIN] = (process.env.E2E_USER_EMAIL ?? 'test@example.com').split('@');
const USER = {
	// Plus-addressing lands in the same mailbox as E2E_USER_EMAIL,
	// permet de relancer le test sans collision back.
	email: `${USER_LOCAL}+${NONCE}@${USER_DOMAIN}`,
	username: `jz_test_${NONCE}`,
	password: 'TestSkilluv2026!',
	firstName: 'Jeremie',
	lastName: 'Zitti',
	// iso3 "BEN" = Benin (le user a écrit "BJ" iso2, mais CountrySelect stocke l'iso3).
	countrySearch: 'Benin',
	city: 'Cotonou'
};

test.describe('@signup signup-user', () => {
	// SKI-71: explicit session posture. The subject of this test IS the
	// anonymous visitor, so no session must leak in from another spec.
	test.use({ storageState: ANONYMOUS_STATE });
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL (back staging)');
	test.setTimeout(90_000);

	test('inscription user standard bout-en-bout', async ({ page }, testInfo) => {
		// Capture toutes les requêtes /api/auth/register pour diagnostic en cas d'échec.
		const authRequests: { url: string; status: number; body: string }[] = [];
		page.on('response', async (res: Response) => {
			const req: Request = res.request();
			if (req.url().includes('/api/auth/register')) {
				let body = '';
				try {
					body = (await res.text()).slice(0, 500);
				} catch {
					/* stream déjà consommé */
				}
				authRequests.push({ url: req.url(), status: res.status(), body });
			}
		});

		// Pre-dismiss cookie banner (v1 rejected) to éviter l'overlay.
		await page.addInitScript(() => {
			try {
				localStorage.setItem('skilluv-consent-version', '1');
				localStorage.setItem(
					'skilluv-consent-v1',
					JSON.stringify({ version: 1, functional: false, analytics: false, marketing: false, decidedAt: new Date().toISOString() })
				);
			} catch { /* ignore */ }
		});

		// ---- STEP 1 : the entrance ----
		//
		// The signup is a sequence now — entrance, domain, trade, pact — and each
		// beat is its own route. Walking it here rather than jumping to the pact
		// is the point of this spec: it is the only place the whole sequence is
		// driven against a real backend.
		await page.goto('/auth/register');
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
		await page.waitForLoadState('networkidle');
		// Fallback : dismiss banner if it still appeared (race).
		const banner = page.getByTestId('consent-banner');
		if (await banner.isVisible().catch(() => false)) {
			await banner.getByRole('button').first().click().catch(() => {});
			await banner.waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
		}
		await page.screenshot({ path: testInfo.outputPath('step-1-entrance.png'), fullPage: true });

		await page.getByTestId('enlist-start').click();
		await page.waitForURL(/\/auth\/register\/domain/, { timeout: 15_000 });

		// ---- STEP 2 : the wall ----
		const codePlate = page.getByTestId('domain-plate-code');
		await expect(codePlate).toBeVisible({ timeout: 15_000 });
		await page.screenshot({ path: testInfo.outputPath('step-2-wall.png'), fullPage: true });
		await codePlate.getByRole('link').click();
		await page.waitForURL(/\/auth\/register\/path/, { timeout: 15_000 });

		// ---- STEP 3 : the trades ----
		//
		// The catalogue is real here, so the spec takes whichever trade comes
		// first rather than naming one: a slug written into a test is a slug that
		// breaks the day the catalogue is re-curated.
		const firstTrade = page.locator('[data-testid^="path-card-"]').first();
		await expect(firstTrade).toBeVisible({ timeout: 20_000 });
		await firstTrade.click();
		await page.screenshot({ path: testInfo.outputPath('step-3-trades.png'), fullPage: true });
		await page.getByTestId('enlist-continue').click();
		await page.waitForURL(/\/auth\/register\/account/, { timeout: 15_000 });

		// ---- STEP 4 : the pact ----
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
		await page.screenshot({ path: testInfo.outputPath('step-4-form-empty.png'), fullPage: true });

		await page.locator('input[autocomplete="username"]').fill(USER.username);
		await page.locator('input[autocomplete="email"]').fill(USER.email);
		await page.locator('input[autocomplete="given-name"]').fill(USER.firstName);
		await page.locator('input[autocomplete="family-name"]').fill(USER.lastName);
		await page.locator('input[type="password"]').fill(USER.password);

		// Country picker (custom combobox). Ouvre + tape + sélectionne "Benin".
		const countryTrigger = page.getByRole('button', { expanded: false }).filter({ hasText: /Sélectionner|Select a country|Pays|Country/i }).first();
		// Fallback : trigger via label "Pays"/"Country"
		const countryLabel = page.locator('span.text-sm', { hasText: /^(Pays|Country)$/ }).first();
		if (await countryLabel.isVisible().catch(() => false)) {
			// Le container est le parent du span label — cliquer sur le premier bouton frère.
			await countryLabel.locator('..').getByRole('button').first().click();
		} else {
			await countryTrigger.click();
		}
		const countrySearch = page.getByPlaceholder(/Rechercher|Search/i).first();
		await countrySearch.waitFor({ state: 'visible', timeout: 5_000 });
		await countrySearch.fill(USER.countrySearch);
		await page.getByRole('option').filter({ hasText: /Benin/i }).first().click();

		// Terms checkbox
		await page.getByRole('checkbox').first().check();
		await page.screenshot({ path: testInfo.outputPath('step-4-form-filled.png'), fullPage: true });

		// ---- SUBMIT ----
		const submitPromise = page.waitForResponse(
			(r) => r.url().includes('/api/auth/register') && r.request().method() === 'POST',
			{ timeout: 30_000 }
		);
		await page.getByTestId('enlist-submit').click();

		const submitRes = await submitPromise.catch((e) => {
			throw new Error(`BLOCAGE: aucune requête POST /api/auth/register détectée après click submit — ${e.message}`);
		});

		const status = submitRes.status();
		const body = await submitRes.text().catch(() => '');

		if (status < 200 || status >= 300) {
			await page.screenshot({ path: testInfo.outputPath('step-5-submit-error.png'), fullPage: true });
			throw new Error(
				`BLOCAGE: POST /api/auth/register a retourné ${status}. ` +
					`Body: ${body.slice(0, 400)}. ` +
					`Vérifier back staging (contraintes password, unicité email/username, format country).`
			);
		}

		// The pact sends new accounts straight to the first act. The trades
		// chosen at step 3 are replayed against the API on the way, which is why
		// the redirect can lag the register response by a few hundred
		// milliseconds.
		await page.waitForURL(/\/challenges\/onboarding/, { timeout: 15_000 }).catch(async () => {
			await page.screenshot({ path: testInfo.outputPath('step-5-no-redirect.png'), fullPage: true });
			throw new Error(
				`submit OK (${status}) but no redirect to /challenges/onboarding. Current URL: ${page.url()}`
			);
		});

		await page.screenshot({ path: testInfo.outputPath('step-5-first-act.png'), fullPage: true });

		// ---- STEP 5 : verify-email programmatique via dev-mode ----
		// Consomme : 0 register (dev endpoint non rate-limité). Le register lui-
		// même a déjà consommé 1/5 par heure par IP en STEP SUBMIT plus haut.
		const verify = await getVerifyToken(page, USER.email);
		expect(verify.token, 'dev-verify token').toBeTruthy();
		testInfo.annotations.push({
			type: 'dev-verify',
			description: `token=${verify.token.slice(0, 8)}... user_id=${verify.user_id ?? 'n/a'} ttl=${verify.ttl_seconds ?? 'n/a'}`
		});

		await page.goto(`/auth/verify-email?token=${encodeURIComponent(verify.token)}`);
		// Le composant affiche d'abord "Verifying..." pendant le POST back, puis
		// transitionne vers un heading success ("Email verified") ou error. On attend
		// la transition finale (auto-retry Playwright jusqu'à match ou timeout).
		const successHeading = page.getByRole('heading', { level: 1 }).first();
		await expect(successHeading).toHaveText(
			/success|vérifié|verifie|verified|confirm|error|erreur/i,
			{ timeout: 15_000 }
		);
		const headingText = (await successHeading.textContent()) ?? '';
		await page.screenshot({ path: testInfo.outputPath('step-5-verify-result.png'), fullPage: true });
		expect(
			/success|vérifié|verifie|verified|confirm/i.test(headingText),
			`verify-email heading = "${headingText}" (attendu success — si "error/erreur", token invalide ou déjà consommé)`
		).toBeTruthy();

		testInfo.annotations.push({
			type: 'account-created',
			description: `Compte user créé + email vérifié (${USER.email} / ${USER.username}). À nettoyer côté back (RGPD).`
		});

		expect(status, `register status = ${status}`).toBeGreaterThanOrEqual(200);
		expect(status).toBeLessThan(300);
	});
});
