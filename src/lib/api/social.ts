import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

// --- Types ---

/**
 * The polymorphic target of a comment or reaction.
 *
 * These are the literals `VALID_TARGET_TYPES` accepts on the server, not a
 * parallel vocabulary. The previous list invented `forum_post` and `user`,
 * neither of which exists there, so every comment listing, every comment
 * creation and every reaction on the forum was rejected as a validation error
 * before reaching the database. An `as any` at the one call site kept the
 * compiler from noticing.
 */
export type TargetType =
	| 'challenge'
	| 'submission'
	| 'post'
	| 'question'
	| 'answer'
	| 'project'
	| 'profile'
	| 'guild'
	| 'comment'
	| 'repo';

/** Mirrors `VALID_REACTION_KINDS`. Only `fire` matched the old list. */
export type ReactionKind = 'upvote' | 'downvote' | 'heart' | 'fire' | 'wow';

export interface SocialComment {
	id: string;
	target_type: TargetType;
	target_id: string;
	author_id: string;
	author_username?: string;
	author_display_name?: string;
	body: string;
	/**
	 * Optional because the server does not send them.
	 *
	 * `GET /social/comments/{type}/{id}` returns the `comments` rows verbatim:
	 * id, target, author_id, body, parent_id, edited and the timestamps. The
	 * author's name, the accepted flag and the reaction counts are not joined
	 * in, so declaring them required made the UI render `@undefined`. Filed as
	 * SKI-356; the fields stay declared so the call sites are ready, and every
	 * reader falls back until they arrive.
	 */
	accepted?: boolean;
	reaction_up?: number;
	reaction_down?: number;
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

	/** The tags attached to one target. */
	tagsOn(targetType: string, targetId: string) {
		return api.get<ApiResponse<{ tags: unknown[] }>>(
			`/social/tag-map/${encodeURIComponent(targetType)}/${encodeURIComponent(targetId)}`
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
