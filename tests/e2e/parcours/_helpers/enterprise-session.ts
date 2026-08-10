/**
 * Helper enterprise-session — LOGIN-FIRST sur compte fixe.
 *
 * Compte fixe backend (staging) :
 *   email    : flemartpro@gmail.com
 *   username : flemartpro
 *   password : Password123!
 *   slug     : flemart-pro
 *
 * Strategie :
 *  1. Tentative login /api/auth/login. Si succes :
 *     - Si requires_totp_setup=true, on arme TOTP (setup + enable) et on
 *       persiste le secret_base32 dans le fichier .creds pour les prochaines
 *       sessions (generateTotpCode()).
 *     - Sinon (TOTP deja arme) on charge le secret depuis .creds et on relogin
 *       avec totp_code fresh.
 *  2. Si login 401/404 (compte inexistant), fallback UI-based register
 *     (consomme 1 register cost du rate-limit). A eviter — le compte fixe est
 *     cense persister cote back.
 *
 * Rate-limit : login n'est PAS soumis au budget register. On peut re-runner
 * setupEnterpriseSession autant de fois qu'on veut.
 */
import { expect, type Page, type BrowserContext } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { getVerifyToken } from './dev-verify';
import { totpCode } from './totp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- Compte fixe ----------------------------------------------------------

export const ENTERPRISE_FIXED = {
	email: 'flemartpro@gmail.com',
	username: 'flemartpro',
	password: 'Password123!',
	firstName: 'Flemart',
	lastName: 'Pro',
	companyName: 'Flemart Pro'
} as const;

export interface EnterpriseCredentials {
	email: string;
	username: string;
	password: string;
	firstName: string;
	lastName: string;
	companyName: string;
	/** Present une fois TOTP arme — permet generateTotpCode() plus tard. */
	totpSecretBase32?: string;
	backupCodes?: string[];
}

export function enterpriseStoragePath(): string {
	return path.resolve(__dirname, '../../.auth/enterprise-owner.json');
}

export function enterpriseCredentialsPath(): string {
	return path.resolve(__dirname, '../../.auth/enterprise-owner.creds.json');
}

function loadCredsFile(): EnterpriseCredentials | null {
	const p = enterpriseCredentialsPath();
	if (!fs.existsSync(p)) return null;
	try {
		return JSON.parse(fs.readFileSync(p, 'utf-8')) as EnterpriseCredentials;
	} catch {
		return null;
	}
}

function saveCredsFile(creds: EnterpriseCredentials): void {
	const p = enterpriseCredentialsPath();
	fs.mkdirSync(path.dirname(p), { recursive: true });
	fs.writeFileSync(p, JSON.stringify(creds, null, 2));
}

async function readCsrfToken(context: BrowserContext): Promise<string | undefined> {
	const cookies = await context.cookies();
	return cookies.find((k) => k.name === 'csrf_token')?.value;
}

/**
 * Genere un code TOTP frais depuis le secret persiste. Leve si le secret
 * n'est pas encore en .creds (TOTP pas encore arme).
 */
export function generateTotpCode(): string {
	const creds = loadCredsFile();
	if (!creds?.totpSecretBase32) {
		throw new Error(
			'generateTotpCode: secret TOTP absent du fichier .creds. Runner enterprise-setup.spec.ts d abord.'
		);
	}
	return totpCode(creds.totpSecretBase32);
}

/**
 * Login-first bootstrap. Retourne les creds a jour (avec totpSecretBase32
 * si TOTP est arme).
 */
export async function setupEnterpriseSession(
	page: Page,
	context: BrowserContext
): Promise<EnterpriseCredentials> {
	// Toujours partir des identifiants fixes canoniques ; on ne conserve du
	// disque que le secret TOTP + backup codes (sinon on trainerait des
	// anciens creds d une precedente iteration).
	const previous = loadCredsFile();
	const creds: EnterpriseCredentials = {
		email: ENTERPRISE_FIXED.email,
		username: ENTERPRISE_FIXED.username,
		password: ENTERPRISE_FIXED.password,
		firstName: ENTERPRISE_FIXED.firstName,
		lastName: ENTERPRISE_FIXED.lastName,
		companyName: ENTERPRISE_FIXED.companyName,
		totpSecretBase32: previous?.email === ENTERPRISE_FIXED.email ? previous.totpSecretBase32 : undefined,
		backupCodes: previous?.email === ENTERPRISE_FIXED.email ? previous.backupCodes : undefined
	};

	// Cookie banner pre-dismiss.
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

	// Warm up cookies (csrf_token double-submit) via GET.
	await page.goto('/auth/login');
	await page.waitForLoadState('networkidle');

	// ---- Tentative login #1 (sans TOTP) ----
	const csrf1 = await readCsrfToken(context);
	const attempt1 = await page.request.post('/api/auth/login', {
		headers: csrf1 ? { 'X-CSRF-Token': csrf1 } : {},
		data: { identifier: ENTERPRISE_FIXED.email, password: ENTERPRISE_FIXED.password }
	});

	if (attempt1.status() === 401 || attempt1.status() === 404) {
		// Compte inexistant — fallback register (consomme rate-limit).
		return await fallbackRegister(page, context, creds);
	}

	if (attempt1.ok()) {
		const json = (await attempt1.json()) as {
			data?: {
				requires_totp_setup?: boolean;
				requires_email_2fa?: boolean;
				user_id?: string;
			};
		};
		if (json.data?.requires_totp_setup) {
			// Session cree, TOTP a armer. On enchaine setup + enable.
			await armTotp(page, context, creds);
		} else if (!creds.totpSecretBase32) {
			// Deja arme cote back mais on n'a pas le secret — inconnu, on essaie
			// de continuer, mais un futur login exigera totp_code sans qu'on
			// puisse le generer. Erreur claire.
			throw new Error(
				'setupEnterpriseSession: back indique TOTP arme mais aucun secret n est present dans .creds. ' +
					'Impossible de generer un TOTP frais. Supprimer le compte back et re-runner.'
			);
		}
	} else if (attempt1.status() === 400 || attempt1.status() === 422 || attempt1.status() === 403) {
		// Peut etre "totp_code required" — retry avec code.
		if (!creds.totpSecretBase32) {
			const body = await attempt1.text().catch(() => '');
			throw new Error(
				`setupEnterpriseSession: login 400/422 (probable totp_code manquant) mais aucun secret en .creds. Body: ${body.slice(0, 200)}`
			);
		}
		const code = totpCode(creds.totpSecretBase32);
		const csrf2 = await readCsrfToken(context);
		const attempt2 = await page.request.post('/api/auth/login', {
			headers: csrf2 ? { 'X-CSRF-Token': csrf2 } : {},
			data: {
				identifier: ENTERPRISE_FIXED.email,
				password: ENTERPRISE_FIXED.password,
				totp_code: code
			}
		});
		if (!attempt2.ok()) {
			const body = await attempt2.text().catch(() => '');
			throw new Error(
				`setupEnterpriseSession: login retry avec TOTP = ${attempt2.status()}. Body: ${body.slice(0, 200)}`
			);
		}
	} else {
		const body = await attempt1.text().catch(() => '');
		throw new Error(
			`setupEnterpriseSession: login attempt1 = ${attempt1.status()}. Body: ${body.slice(0, 200)}`
		);
	}

	// Persist state + creds.
	const statePath = enterpriseStoragePath();
	fs.mkdirSync(path.dirname(statePath), { recursive: true });
	await context.storageState({ path: statePath });
	saveCredsFile(creds);
	return creds;
}

/**
 * Setup + enable TOTP sur la session courante. Persiste secret dans creds.
 */
async function armTotp(
	page: Page,
	context: BrowserContext,
	creds: EnterpriseCredentials
): Promise<void> {
	const csrf = await readCsrfToken(context);
	const setupRes = await page.request.post('/api/auth/totp/setup', {
		headers: csrf ? { 'X-CSRF-Token': csrf } : {},
		data: {}
	});
	if (!setupRes.ok()) {
		const body = await setupRes.text().catch(() => '');
		throw new Error(
			`armTotp: totp/setup = ${setupRes.status()}. Body: ${body.slice(0, 300)}`
		);
	}
	const setupJson = (await setupRes.json()) as {
		data: { secret_base32: string; otpauth_url?: string };
	};
	const secret = setupJson.data.secret_base32;
	if (!secret) throw new Error('armTotp: secret_base32 absent');

	const code = totpCode(secret);
	const csrf2 = await readCsrfToken(context);
	let enableRes = await page.request.post('/api/auth/totp/enable', {
		headers: csrf2 ? { 'X-CSRF-Token': csrf2 } : {},
		data: { code }
	});
	if (!enableRes.ok()) {
		// Retry avec code frais (fenetre 30s peut tomber pile).
		const code2 = totpCode(secret);
		const csrf3 = await readCsrfToken(context);
		enableRes = await page.request.post('/api/auth/totp/enable', {
			headers: csrf3 ? { 'X-CSRF-Token': csrf3 } : {},
			data: { code: code2 }
		});
		if (!enableRes.ok()) {
			const body = await enableRes.text().catch(() => '');
			throw new Error(
				`armTotp: totp/enable = ${enableRes.status()}. Body: ${body.slice(0, 300)}`
			);
		}
	}
	const enJson = (await enableRes.json()) as { data: { backup_codes?: string[] } };
	creds.totpSecretBase32 = secret;
	creds.backupCodes = enJson.data.backup_codes;
}

/**
 * Fallback UI register — consomme 1 register cost. Uniquement si le compte
 * fixe n'existe pas cote back (cas exceptionnel).
 */
async function fallbackRegister(
	page: Page,
	context: BrowserContext,
	creds: EnterpriseCredentials
): Promise<EnterpriseCredentials> {
	// STEP 1
	await page.goto('/enterprise/register');
	await page.waitForLoadState('networkidle');
	await page.getByPlaceholder(/^Marie$/).fill(creds.firstName);
	await page.getByPlaceholder(/^Dupont$/).fill(creds.lastName);
	await page.getByPlaceholder(/^marie_dupont$/).fill(creds.username);
	await page.getByPlaceholder(/marie@entreprise\.com/).fill(creds.email);
	await page.locator('input[type="password"]').fill(creds.password);
	await page.locator('form').first().locator('button[type="submit"]').click();

	// STEP 2
	await expect(
		page.locator('h1').filter({ hasText: /entreprise|company/i }).first()
	).toBeVisible({ timeout: 10_000 });
	await page.getByPlaceholder(/Skilluv Inc/i).fill(creds.companyName);
	await page.getByPlaceholder(/https:\/\/entreprise\.com/).fill('https://flemart.com');
	await page.getByRole('checkbox').last().check();

	const registerPromise = page.waitForResponse(
		(r) => r.url().includes('/api/enterprise/register') && r.request().method() === 'POST',
		{ timeout: 30_000 }
	);
	await page.locator('button[type="submit"]').first().click();
	const registerRes = await registerPromise;
	if (registerRes.status() < 200 || registerRes.status() >= 300) {
		const body = await registerRes.text().catch(() => '');
		throw new Error(
			`fallbackRegister: /api/enterprise/register = ${registerRes.status()}. Body: ${body.slice(0, 400)}`
		);
	}

	// Verify email
	const verify = await getVerifyToken(page, creds.email);
	await page.goto(`/auth/verify-email?token=${encodeURIComponent(verify.token)}`);
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 });

	// Arm TOTP
	await armTotp(page, context, creds);

	const statePath = enterpriseStoragePath();
	fs.mkdirSync(path.dirname(statePath), { recursive: true });
	await context.storageState({ path: statePath });
	saveCredsFile(creds);
	return creds;
}
