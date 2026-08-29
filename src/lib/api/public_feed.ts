/**
 * The public activity feed, and the consent that decides who is in it.
 *
 * ## Withdrawal is its own endpoint for a reason
 *
 * `preferences` sets what somebody wants shown. `withdraw` takes them out
 * entirely. Two calls rather than a flag on one, because "show less" and "stop
 * showing me" are different asks and a preferences form that buried the second
 * inside the first would make leaving harder than arriving.
 *
 * Any surface offering this must not make withdrawal look like a setting among
 * settings. It is somebody asking not to be published.
 */

import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export const publicFeedApi = {
	/** What the platform is showing publicly. No session needed. */
	feed(params?: { limit?: number; before?: string }) {
		return api.get<ApiResponse<{ items: unknown[] }>>('/feed/public', params);
	},

	/** What the caller has agreed to have shown. */
	preferences() {
		return api.get<ApiResponse<Record<string, unknown>>>('/users/me/public-feed-preferences');
	},

	setPreferences(body: Record<string, unknown>) {
		return api.post<ApiResponse<unknown>>('/users/me/public-feed-preferences', body);
	},

	/**
	 * Take yourself out of the public feed entirely.
	 *
	 * Not a preference. Offer it as its own act.
	 */
	withdraw() {
		return api.post<ApiResponse<unknown>>('/users/me/public-feed-preferences/withdraw', {});
	}
};
