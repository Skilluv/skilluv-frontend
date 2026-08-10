/**
 * SKI-49/50/51/52 — bootstrap user standard (login-first, idempotent).
 *
 * Utilise le compte fixe jeremiezitti@gmail.com. Login-first ; fallback
 * register + verify seulement si le compte n'existe pas.
 *
 * A runner AVANT toute spec user necessitant storageState.
 */
import { test, expect } from '@playwright/test';
import {
	setupUserSession,
	userStoragePath,
	userCredentialsPath
} from './_helpers/user-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);

test.describe('@setup user-setup', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL (back staging)');
	test.setTimeout(120_000);

	test('login user + verify si besoin + save storageState', async ({ page, context }, testInfo) => {
		const creds = await setupUserSession(page, context);
		expect(fs.existsSync(userStoragePath()), 'state file ecrit').toBe(true);
		expect(fs.existsSync(userCredentialsPath()), 'creds file ecrit').toBe(true);
		testInfo.annotations.push({
			type: 'user-account',
			description: `${creds.email} / username=${creds.username}`
		});
	});
});
