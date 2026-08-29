/**
 * The four reads that answer "what is on this platform right now".
 *
 * ## `/explore` and `/feed/for-you` are not the same list
 *
 * Explore is what exists; the for-you feed is what matches the caller. A
 * platform that only had the second would show a newcomer nothing, because
 * they match nothing yet — which is exactly the moment they are deciding
 * whether to stay.
 *
 * ## A sponsored challenge must look sponsored
 *
 * `sponsored-challenges/active` is a paid placement. Rendering one beside
 * ordinary challenges without saying so would sell the reader's attention
 * without telling them, and it is also the thing that makes the placement
 * worth buying twice.
 */

import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export const discoveryApi = {
	/** What is on the platform. Public, and the newcomer's first list. */
	explore(params?: Record<string, string | number | undefined>) {
		return api.get<ApiResponse<Record<string, unknown>>>('/explore', params);
	},

	/** What matches the caller. Empty for somebody with no record yet. */
	forYou(params?: { limit?: number }) {
		return api.get<ApiResponse<{ items: unknown[] }>>('/feed/for-you', params);
	},

	/** Paid placements. Label them wherever they render. */
	sponsoredChallenges() {
		return api.get<ApiResponse<{ challenges: unknown[] }>>('/sponsored-challenges/active');
	},

	/** Public platform figures. */
	metrics() {
		return api.get<ApiResponse<Record<string, unknown>>>('/metrics/summary');
	}
};
