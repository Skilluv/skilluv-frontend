/**
 * SKI-53 — bootstrap enterprise-owner (login-first, idempotent).
 *
 * Uses the account configured through E2E_ENTERPRISE_*. Login-first
 * — le TOTP est arme si necessaire, sinon on ne re-arme pas. Le storageState
 * est rafraichi a chaque run pour que les cookies restent valides.
 *
 * A runner AVANT toute autre spec `enterprise-*` de la vague SKI-53.
 */
import { test, expect } from '@playwright/test';
import {
	setupEnterpriseSession,
	enterpriseStoragePath,
	enterpriseCredentialsPath
} from './_helpers/enterprise-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);

test.describe('@setup enterprise-setup', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL (back staging)');
	test.setTimeout(120_000);

	test('login enterprise + arm TOTP si besoin + save storageState', async ({ page, context }, testInfo) => {
		const creds = await setupEnterpriseSession(page, context);
		expect(fs.existsSync(enterpriseStoragePath()), 'state file ecrit').toBe(true);
		expect(fs.existsSync(enterpriseCredentialsPath()), 'creds file ecrit').toBe(true);
		testInfo.annotations.push({
			type: 'enterprise-account',
			description: `${creds.email} / username=${creds.username} / TOTP=${creds.totpSecretBase32 ? 'armed' : 'absent'} / backup=${creds.backupCodes?.length ?? 0}`
		});
	});
});
