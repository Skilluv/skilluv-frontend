/**
 * The very first run: "bonjour Skilluv".
 *
 * Two calls, and the split matters. `status` is idempotent and safe to read on
 * every load; `start` is the act that begins it. A page that started the
 * onboarding just by being opened would restart it for somebody who came back
 * to finish, which is the one thing a first run must not do to a person who
 * already gave it their time.
 */

import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export const firstRunApi = {
	/** Where the caller is in it. Safe to read on every load. */
	status() {
		return api.get<ApiResponse<Record<string, unknown>>>('/onboarding/bonjour-skilluv/status');
	},

	/** Begin it. An act, not a read. */
	start(body?: Record<string, unknown>) {
		return api.post<ApiResponse<unknown>>('/onboarding/bonjour-skilluv/start', body ?? {});
	}
};
