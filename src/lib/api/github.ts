/**
 * The GitHub link, and what it makes readable.
 *
 * ## Connecting is a redirect
 *
 * `/auth/github/start` and its callback are an OAuth dance the browser has to
 * walk. So `connectUrl()` returns an address rather than calling one — an XHR
 * would follow the redirect and land the consent screen in a response body.
 *
 * ## Syncing is not automatic, and that is deliberate
 *
 * `sync` pulls the repositories and contribution figures on demand. A platform
 * that polled somebody's GitHub continuously would be reading a third party's
 * account far more often than the person asked it to, and the figure on a
 * profile is more honest for saying when it was last fetched.
 *
 * ## Disconnecting keeps what was earned
 *
 * Attestations issued from synced work are not undone by unlinking. A record
 * that vanished when somebody disconnected an account would be a record the
 * platform never really held.
 */

import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export const githubApi = {
	/** Pull repositories and figures now. */
	sync() {
		return api.post<ApiResponse<unknown>>('/auth/github/sync', {});
	},

	/**
	 * Unlink the account.
	 *
	 * Attestations already issued stay. Say so where this is offered.
	 */
	disconnect() {
		return api.post<ApiResponse<unknown>>('/auth/github/disconnect', {});
	},

	/** Somebody's public repositories, as last synced. */
	repos(username: string) {
		return api.get<ApiResponse<{ repos: unknown[] }>>(
			`/u/${encodeURIComponent(username)}/repos`
		);
	}
};

/**
 * Where the browser goes to link GitHub.
 *
 * Returned, not fetched: this is a consent screen, and an XHR would swallow
 * it.
 */
export function connectUrl(baseUrl = '/api'): string {
	return `${baseUrl}/auth/github/start`;
}

/**
 * The generated CV page for somebody, as HTML.
 *
 * An address rather than a call: the backend renders a whole document, and
 * fetching it into a string only to inject it would mean trusting server HTML
 * through `{@html}` for no gain. Link to it.
 */
export function cvUrl(username: string, baseUrl = '/api'): string {
	return `${baseUrl}/u/${encodeURIComponent(username)}/cv`;
}
