/**
 * The identity providers linked to an account.
 *
 * ## Why linking is a redirect and not a fetch
 *
 * `/auth/google/link` and `/auth/linkedin/link` start an OAuth dance: the
 * browser has to *go* there, and come back through a callback the server
 * handles. So this module returns the address rather than calling it — an
 * `fetch` would follow the redirect invisibly and land the consent screen in a
 * response body nobody can interact with.
 *
 * The callbacks are deliberately absent from this module for the same reason:
 * they are the browser's business, not a client's.
 *
 * ## Why unlinking is the dangerous half
 *
 * A provider can be the only way somebody signs in. Removing the last one
 * would lock them out of their own account, and the server does not stop it —
 * so any surface offering this has to know whether a password exists and say
 * what happens. That is not a detail to leave to a confirm dialog.
 */

import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

/** The three providers an account can carry. */
export const OAUTH_PROVIDERS = ['github', 'google', 'linkedin'] as const;

export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

export interface LinkedProvider {
	id: string;
	user_id: string;
	provider: string;
	provider_user_id: string;
	/** What the provider said, not what Skilluv verified. */
	email: string | null;
	display_name: string | null;
	avatar_url: string | null;
	linked_at: string;
}

export const oauthLinksApi = {
	/** Which providers this account carries. */
	mine() {
		return api.get<ApiResponse<{ providers: LinkedProvider[] }>>('/auth/me/oauth-providers');
	},

	/**
	 * Remove one.
	 *
	 * The server does not check whether it was the last way in. A caller must.
	 */
	unlink(provider: string) {
		return api.delete<void>(`/auth/me/oauth-providers/${encodeURIComponent(provider)}`);
	}
};

/**
 * Where the browser must go to link a provider.
 *
 * Returned rather than fetched: this is a redirect into a consent screen, and
 * an XHR would swallow it. Navigate; do not call.
 *
 * GitHub is absent on purpose — it links through the repo-sync flow at
 * `/auth/github/start`, which already exists and carries different scopes.
 */
export function linkUrl(provider: 'google' | 'linkedin', baseUrl = '/api'): string {
	return `${baseUrl}/auth/${provider}/link`;
}
