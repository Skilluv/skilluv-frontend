import type { ApiResponse, BadgeRule, UserBadgesResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export const badgesApi = {
	forUser(userId: string) {
		return api.get<ApiResponse<UserBadgesResponse>>(`/users/${userId}/badges`);
	},

	catalog() {
		return api.get<ApiResponse<BadgeRule[]>>('/badge-rules');
	}
};
