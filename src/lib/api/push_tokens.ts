/**
 * Mobile push tokens, which are not the same thing as web push.
 *
 * `notifications/push/**` is the browser's subscription. This is a device
 * token from a native app, and the two coexist because somebody with the app
 * and a browser open should not get every notification twice.
 *
 * A token is per device. Listing them lets somebody see the devices that can
 * reach them and drop the phone they no longer have, which is the only reason
 * the listing exists — a token nobody can revoke is a device nobody can leave.
 */

import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export const pushTokensApi = {
	/** The devices that can reach this account. */
	mine() {
		return api.get<ApiResponse<{ tokens: unknown[] }>>('/users/me/push-tokens');
	},

	register(body: Record<string, unknown>) {
		return api.post<ApiResponse<unknown>>('/users/me/push-tokens/register', body);
	},

	/** Drop a device. */
	revoke(id: string) {
		return api.delete<void>(`/users/me/push-tokens/${encodeURIComponent(id)}`);
	}
};
