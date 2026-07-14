import type { UserPrivate } from '$lib/types';

declare global {
	namespace App {
		interface Locals {
			user: UserPrivate | null;
			/** True when the user has at least one WebAuthn credential enrolled.
			 * Read from `/auth/me` in `hooks.server.ts` and used alongside
			 * `user.totp_enabled` for the enterprise 2FA gate — either counts. */
			hasPasskey: boolean;
		}
		interface PageData {
			user: UserPrivate | null;
			hasPasskey: boolean;
		}
	}
}

export {};
