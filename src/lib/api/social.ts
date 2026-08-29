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
	/**
	 * A reaction summary for one target: the counts, and whether you are in
	 * them.
	 *
	 * Read rather than derived from the reaction list, because the list can be
	 * long and the summary is what a card renders — counting client-side would
	 * mean fetching every reaction to show a number.
	 */
	reactionSummary(targetType: string, targetId: string) {
		return api.get<ApiResponse<{ summary: unknown }>>(
			`/social/reactions/${encodeURIComponent(targetType)}/${encodeURIComponent(targetId)}/summary`
		);
	},

	/** Comments on one target. */
	comments(targetType: string, targetId: string) {
		return api.get<ApiResponse<{ comments: unknown[] }>>(
			`/social/comments/${encodeURIComponent(targetType)}/${encodeURIComponent(targetId)}`
		);
	},

	/** Every tag the platform knows. Public. */
	tags() {
		return api.get<ApiResponse<{ tags: unknown[] }>>('/tags');
	},

	/** Attach a tag to something. */
	attachTag(body: { tag_id: string; target_type: string; target_id: string }) {
		return api.post<ApiResponse<unknown>>('/social/tag-map', body);
	},

	/**
	 * Detach one.
	 *
	 * A DELETE with a body, which the client supports — the alternative would
	 * be a tag-map id the caller does not hold.
	 */
	detachTag(body: { tag_id: string; target_type: string; target_id: string }) {
		return api.delete<void>('/social/tag-map', body);
	},

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
