/**
 * Login-first session helper for the standard test user.
 *
 * Credentials come from the environment, never from source: this repository is
 * public. Set E2E_USER_EMAIL / E2E_USER_USERNAME / E2E_USER_PASSWORD (see
 * .env.example); `.env` is git-ignored and loaded by playwright.config.ts.
 *
 * Strategy:
 *  1. POST /api/auth/login. On success, save the storage state.
 *  2. On 401/404, fall back to register + verify-email (uses one register from
 *     the hourly rate-limit budget).
 */
import { expect, type Page, type BrowserContext } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { getVerifyToken } from './dev-verify';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(
			`${name} is not set. The e2e test account is configured through the ` +
				`environment, not in source. See .env.example.`
		);
	}
	return value;
}

export const USER_FIXED = {
	get email() {
		return requireEnv('E2E_USER_EMAIL');
	},
	get username() {
		return requireEnv('E2E_USER_USERNAME');
	},
	get password() {
		return requireEnv('E2E_USER_PASSWORD');
	},
	get firstName() {
		return process.env.E2E_USER_FIRST_NAME ?? 'Test';
	},
	get lastName() {
		return process.env.E2E_USER_LAST_NAME ?? 'User';
	}
};

export interface UserCredentials {
	email: string;
	username: string;
	password: string;
	firstName: string;
	lastName: string;
}

/**
 * Explicit session posture for specs whose subject IS the anonymous visitor
 * (auth funnels, signup, fresh-user onboarding).
 *
 * SKI-71: every `parcours/` spec now declares its posture through this module,
 * either `userStoragePath()` for a signed-in session or `ANONYMOUS_STATE` for a
 * deliberate absence of one. No spec depends on an implicit skeleton fixture,
 * and none leaves its posture to execution order.
 */
export const ANONYMOUS_STATE: { cookies: []; origins: [] } = { cookies: [], origins: [] };

export function userStoragePath(): string {
	return path.resolve(__dirname, '../../.auth/user-standard.json');
}

export function userCredentialsPath(): string {
	return path.resolve(__dirname, '../../.auth/user-standard.creds.json');
}

function loadCredsFile(): UserCredentials | null {
	const p = userCredentialsPath();
	if (!fs.existsSync(p)) return null;
	try {
		return JSON.parse(fs.readFileSync(p, 'utf-8')) as UserCredentials;
	} catch {
		return null;
	}
}

function saveCredsFile(creds: UserCredentials): void {
	const p = userCredentialsPath();
	fs.mkdirSync(path.dirname(p), { recursive: true });
	fs.writeFileSync(p, JSON.stringify(creds, null, 2));
}

async function readCsrfToken(context: BrowserContext): Promise<string | undefined> {
	const cookies = await context.cookies();
	return cookies.find((k) => k.name === 'csrf_token')?.value;
}

export async function setupUserSession(
	page: Page,
	context: BrowserContext
): Promise<UserCredentials> {
	// Preference : creds persistes (compte deja cree dans une session
	// precedente). Sinon on tente les identifiants fixes. Si le fixed echoue
	// (compte pre-existant avec password inconnu), fallback nonce email.
	const creds: UserCredentials = loadCredsFile() ?? {
		email: USER_FIXED.email,
		username: USER_FIXED.username,
		password: USER_FIXED.password,
		firstName: USER_FIXED.firstName,
		lastName: USER_FIXED.lastName
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

	// Warm up cookies (csrf_token double-submit).
	await page.goto('/auth/login');
	await page.waitForLoadState('networkidle');

	const csrf = await readCsrfToken(context);
	const attempt = await page.request.post('/api/auth/login', {
		headers: csrf ? { 'X-CSRF-Token': csrf } : {},
		data: { identifier: creds.email, password: creds.password }
	});

	if (attempt.status() === 401 || attempt.status() === 404) {
		// Unknown account or password mismatch. Create a nonce-suffixed account
		// and persist it for subsequent runs.
		const nonce = Date.now().toString(36) + Math.floor(Math.random() * 1000).toString(36);
		const [local, domain] = USER_FIXED.email.split('@');
		const freshCreds: UserCredentials = {
			email: `${local}+ski${nonce}@${domain}`,
			username: `${USER_FIXED.username}_${nonce}`,
			password: USER_FIXED.password,
			firstName: USER_FIXED.firstName,
			lastName: USER_FIXED.lastName
		};
		return await fallbackRegisterUser(page, context, freshCreds);
	}
	if (!attempt.ok()) {
		const body = await attempt.text().catch(() => '');
		throw new Error(
			`setupUserSession: login = ${attempt.status()}. Body: ${body.slice(0, 200)}`
		);
	}

	const statePath = userStoragePath();
	fs.mkdirSync(path.dirname(statePath), { recursive: true });
	await context.storageState({ path: statePath });
	saveCredsFile(creds);
	return creds;
}

/**
 * Fallback register API-first (pas UI, plus rapide). Consomme 1 register.
 */
async function fallbackRegisterUser(
	page: Page,
	context: BrowserContext,
	creds: UserCredentials
): Promise<UserCredentials> {
	const csrf = await readCsrfToken(context);
	const regRes = await page.request.post('/api/auth/register', {
		headers: csrf ? { 'X-CSRF-Token': csrf } : {},
		data: {
			email: creds.email,
			password: creds.password,
			username: creds.username,
			first_name: creds.firstName,
			last_name: creds.lastName,
			skill_domain: 'code',
			terms_accepted: true
		}
	});
	const registerOk = regRes.ok();
	const registerConflict = regRes.status() === 409;
	if (!registerOk && !registerConflict) {
		const body = await regRes.text().catch(() => '');
		throw new Error(
			`fallbackRegisterUser: register = ${regRes.status()}. Body: ${body.slice(0, 300)}`
		);
	}

	// Verify email via dev endpoint — tolerant "already verified".
	try {
		const verify = await getVerifyToken(page, creds.email);
		await page.goto(`/auth/verify-email?token=${encodeURIComponent(verify.token)}`);
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 });
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		if (!/no pending email_verify token|already verified|expired/i.test(msg)) {
			throw err;
		}
		// Deja verifie — on skip et on tente relogin direct.
	}

	// Re-login pour session propre.
	const csrf2 = await readCsrfToken(context);
	const login2 = await page.request.post('/api/auth/login', {
		headers: csrf2 ? { 'X-CSRF-Token': csrf2 } : {},
		data: { identifier: creds.email, password: creds.password }
	});
	if (!login2.ok()) {
		const body = await login2.text().catch(() => '');
		throw new Error(
			`fallbackRegisterUser: post-verify login = ${login2.status()}. Body: ${body.slice(0, 200)}`
		);
	}

	const statePath = userStoragePath();
	fs.mkdirSync(path.dirname(statePath), { recursive: true });
	await context.storageState({ path: statePath });
	saveCredsFile(creds);
	return creds;
}
