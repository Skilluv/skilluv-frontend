import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

// --- Types ---

/**
 * The polymorphic target types the backend accepts.
 *
 * Copied from `VALID_TARGET_TYPES` in `services/social.rs`, and it has to stay
 * copied: the OpenAPI schema types these fields as `serde_json::Value`, so
 * nothing generated tells us when the two lists drift. They did drift — this
 * module used to declare `forum_post` and `user` where the server has `post`
 * and `profile`, and every comment listing, every comment creation and every
 * reaction on the forum was rejected by the validator before reaching the
 * database. Only `challenge`, `submission` and `project` ever matched.
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

/** From `VALID_REACTION_KINDS`. Same drift, same rule: only `fire` overlapped. */
export type ReactionKind = 'upvote' | 'downvote' | 'heart' | 'fire' | 'wow';

export interface SocialComment {
	id: string;
	target_type: TargetType;
	target_id: string;
	author_id: string;
	body: string;
	parent_id: string | null;
	/**
	 * The author's handle, joined server-side. Null only when the account was
	 * hard-deleted out from under the comment, which the schema allows — so a
	 * reader still has to draw that case, but it is a real state and not the
	 * `undefined` that a missing join used to produce.
	 */
	author_username: string | null;
	author_display_name: string | null;
	/** True when the parent question points at this comment as its answer. */
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

	/**
	 * Comments on one target, with the author, the accepted-answer flag and the
	 * vote counts already joined on.
	 *
	 * The target travels in the path, which is where the route puts it —
	 * `/social/comments` with query parameters is not a route at all and
	 * answered 404.
	 */
	listComments(targetType: TargetType, targetId: string) {
		return api.get<ApiResponse<{ comments: SocialComment[] }>>(
			`/social/comments/${encodeURIComponent(targetType)}/${encodeURIComponent(targetId)}`
		);
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
