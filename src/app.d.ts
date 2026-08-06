import type { UserPrivate } from '$lib/types';

declare global {
	namespace App {
		interface Error {
			message: string;
			/** UUID de correlation, permet au support de retrouver le log exact. */
			errorId?: string;
		}
		interface Locals {
			user: UserPrivate | null;
			/** True when the user has at least one WebAuthn credential enrolled.
			 * Read from `/auth/me` in `hooks.server.ts` and used alongside
			 * `user.totp_enabled` for the enterprise 2FA gate — either counts. */
			hasPasskey: boolean;
			/**
			 * Distingue "vraiment deconnecte" de "auth incertain" (backend flake,
			 * timeout, 5xx). Le client-side layout NE DOIT PAS reset l'auth store
			 * quand `unknown` — sinon un simple hiccup back deconnecte l'user
			 * visuellement (navbar visitor, sidebar cachee) alors que sa session
			 * est parfaitement valide.
			 * - `authenticated` : /auth/me a repondu 200
			 * - `unauthenticated` : pas de cookie access_token OU /auth/me 401
			 * - `unknown` : cookie present mais /auth/me a echoue (5xx/network)
			 */
			authProbe: 'authenticated' | 'unauthenticated' | 'unknown';
		}
		interface PageData {
			user: UserPrivate | null;
			hasPasskey: boolean;
			authProbe: 'authenticated' | 'unauthenticated' | 'unknown';
		}
	}
}

export {};
