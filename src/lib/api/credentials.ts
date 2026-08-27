/**
 * Certifications somebody says they hold.
 *
 * M-11's "certifications self-declared → verify Phase 2". What exists today is
 * the declaration and a human review; there is no issuer integration, and this
 * module does not pretend otherwise.
 *
 * The backend states the rule the UI is built on: a credential *arrives
 * claimed and stays claimed until a reviewer opens the issuer's page*, because
 * the person adding it is the person it belongs to — which is exactly why
 * their word is not the check. `verified_at` is the single field that turns a
 * sentence into evidence, and every surface showing a credential shows which
 * of the two it is looking at.
 *
 * `evidence_url` is required for the same reason: a certification nobody can
 * open is a claim nobody can refuse.
 */

import type { ApiResponse, DeclareCredentialRequest, DeclaredCredential } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export const credentialsApi = {
	/** The caller's own declarations, verified and not. */
	mine() {
		return api.get<ApiResponse<{ credentials: DeclaredCredential[] }>>('/users/me/credentials');
	},

	/**
	 * Record one.
	 *
	 * 400 on an unknown issuer or level, or with no public link. The issuer
	 * vocabulary is server-side and deliberately closed: a free-text issuer
	 * turns the list into something nobody can filter or verify.
	 */
	declare(payload: DeclareCredentialRequest) {
		return api.post<ApiResponse<{ credential: DeclaredCredential }>>(
			'/users/me/credentials',
			payload
		);
	}
};

/**
 * Split a list into what a reviewer confirmed and what is still somebody's
 * word.
 *
 * Kept apart rather than sorted together on purpose: the whole point of the
 * `verified_at` column is lost the moment the two render as one list.
 */
export function splitByVerification(credentials: DeclaredCredential[]): {
	verified: DeclaredCredential[];
	declared: DeclaredCredential[];
} {
	return {
		verified: credentials.filter((c) => c.verified_at !== null),
		declared: credentials.filter((c) => c.verified_at === null)
	};
}
