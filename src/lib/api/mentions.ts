import type { ApiPaginatedResponse, ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

/** Surface a mention was written on. */
export type MentionSourceType = 'forum_post' | 'comment' | 'slice_diary' | 'message';

/**
 * One place where the current user was cited with @username.
 *
 * Contract: docs/SPEC-MENTIONS-EMAIL-PREFERENCES.md section 1.
 */
export interface Mention {
	id: string;
	source_type: MentionSourceType;
	source_id: string;
	/** Front-end path built by the backend, ready to link to as-is. */
	source_url: string;
	/** Plain-text excerpt around the mention, already truncated by the backend. */
	excerpt: string;
	author: {
		user_id: string;
		username: string;
		display_name: string;
		avatar_url: string | null;
	};
	read_at: string | null;
	created_at: string;
}

export const mentionsApi = {
	/** GET /users/me/mentions */
	list(params?: {
		page?: number;
		per_page?: number;
		unread_only?: boolean;
	}): Promise<ApiPaginatedResponse<Mention>> {
		return api.get<ApiPaginatedResponse<Mention>>('/users/me/mentions', params);
	},

	/** POST /users/me/mentions/{id}/read — idempotent. */
	markRead(id: string): Promise<ApiResponse<{ id: string; read_at: string }>> {
		return api.post<ApiResponse<{ id: string; read_at: string }>>(
			`/users/me/mentions/${id}/read`
		);
	},

	/** POST /users/me/mentions/read-all */
	markAllRead(): Promise<ApiResponse<{ marked: number }>> {
		return api.post<ApiResponse<{ marked: number }>>('/users/me/mentions/read-all');
	}
};
