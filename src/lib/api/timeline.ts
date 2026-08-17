import type { ApiResponse, TimelineEvent } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export interface TimelineParams {
	event_type?: string;
	limit?: number;
	offset?: number;
}

export interface TimelinePage {
	events: TimelineEvent[];
	total: number;
	limit: number;
	offset: number;
}

export const timelineApi = {
	/**
	 * Public when the profile is visible. Server-side loads pass their own
	 * `fetch` through `createApiClient`, so this module's default client is
	 * for browser calls only.
	 */
	forUser(userId: string, params?: TimelineParams) {
		return api.get<ApiResponse<TimelinePage>>(
			`/users/${userId}/timeline`,
			params as Record<string, string | number | undefined>
		);
	}
};
