import type { Notification, ApiPaginatedResponse, ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export const notificationsApi = {
	list(params?: { read?: boolean; page?: number; per_page?: number }) {
		return api.get<ApiPaginatedResponse<Notification>>('/notifications', params as Record<string, string | number>);
	},

	markRead(id: string) {
		return api.post<ApiResponse<{ message: string }>>(`/notifications/${id}/read`);
	},

	markAllRead() {
		return api.post<ApiResponse<{ message: string }>>('/notifications/read-all');
	},

	unreadCount() {
		return api.get<ApiResponse<{ unread_count: number }>>('/notifications/unread-count');
	}
};
