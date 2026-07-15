import type { ApiResponse, BadgeEvent, UserBadgeEvent } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export const badgeEventsApi = {
	list() {
		return api.get<ApiResponse<BadgeEvent[]>>('/badge-events');
	},

	detail(slug: string) {
		return api.get<ApiResponse<BadgeEvent>>(`/badge-events/${slug}`);
	},

	join(slug: string) {
		return api.post<ApiResponse<UserBadgeEvent>>(`/badge-events/${slug}/join`);
	},

	myEvents() {
		return api.get<ApiResponse<UserBadgeEvent[]>>('/users/me/badge-events');
	}
};
