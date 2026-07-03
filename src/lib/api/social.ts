import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

// --- Types ---

export type TargetType = 'forum_post' | 'challenge' | 'submission' | 'project' | 'user';
export type ReactionKind = 'up' | 'down' | 'love' | 'insight' | 'fire';

export interface SocialComment {
	id: string;
	target_type: TargetType;
	target_id: string;
	author_id: string;
	author_username: string;
	author_display_name: string;
	body: string;
	accepted: boolean;
	reaction_up: number;
	reaction_down: number;
	created_at: string;
	updated_at: string;
	edited: boolean;
}

// --- API ---

export const socialApi = {
	listComments(targetType: TargetType, targetId: string) {
		return api.get<ApiResponse<{ comments: SocialComment[] }>>('/social/comments', {
			target_type: targetType,
			target_id: targetId
		});
	},

	createComment(targetType: TargetType, targetId: string, body: string) {
		return api.post<ApiResponse<{ comment: SocialComment }>>('/social/comments', {
			target_type: targetType,
			target_id: targetId,
			body
		});
	},

	editComment(id: string, body: string) {
		return api.put<ApiResponse<{ comment: SocialComment }>>(`/social/comments/${id}`, { body });
	},

	deleteComment(id: string) {
		return api.delete<ApiResponse<{ deleted: boolean }>>(`/social/comments/${id}`);
	},

	toggleReaction(targetType: TargetType, targetId: string, kind: ReactionKind) {
		return api.post<ApiResponse<{ toggled: boolean; count: number }>>('/social/reactions', {
			target_type: targetType,
			target_id: targetId,
			kind
		});
	}
};
