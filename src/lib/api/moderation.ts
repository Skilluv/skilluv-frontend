import type {
	ApiPaginatedResponse,
	ApiResponse,
	ForumModerateAction,
	MuteScope
} from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

/** Body de POST /forum/posts/{id}/moderate. Le backend valide la raison
 * (>= 8 caractères) et l'action contre `hide|unhide|lock|unlock`. */
export interface ForumModerateBody {
	action: ForumModerateAction;
	reason: string;
}

/** Body de POST /forum/users/{id}/mute. Scope défaut = 'forum'. */
export interface ForumMuteBody {
	reason: string;
	duration_hours?: number;
	scope?: MuteScope;
}

export interface MuteRecord {
	mute_id: string;
	expires_at: string;
	scope?: MuteScope;
}

/** Body de POST /community/challenges/{id}/reject.
 * Backend key is `feedback` (min 8 chars), pas `reason`. */
export interface CommunityRejectBody {
	feedback: string;
}

/** Body de POST /fraud/deliverables/{id}/mark-valid | revoke. */
export interface FraudReviewBody {
	reason: string;
}

/** Item retourné par GET /fraud/deliverables/flagged. */
export interface FlaggedDeliverable {
	id: string;
	user_id: string;
	verification_status: string;
	verification_signal: Record<string, unknown> | null;
	submitted_at: string;
}

/** Item retourné par GET /community/challenges/review. */
export interface CommunityReviewItem {
	id: string;
	title: string;
	description: string;
	review_feedback: string | null;
	created_by: string | null;
	created_at: string;
}

export const moderationApi = {
	forum: {
		/** POST /forum/posts/{id}/moderate — hide/unhide/lock/unlock. */
		moderatePost(postId: string, body: ForumModerateBody) {
			return api.post<ApiResponse<{ moderated: boolean; id: string; action: string }>>(
				`/forum/posts/${postId}/moderate`,
				body
			);
		},

		/** POST /forum/users/{id}/mute — met un user en silence temporaire. */
		muteUser(userId: string, body: ForumMuteBody) {
			return api.post<ApiResponse<MuteRecord>>(`/forum/users/${userId}/mute`, body);
		}
	},

	community: {
		/** GET /community/challenges/review — file curator. */
		reviewQueue(params?: { page?: number; per_page?: number }) {
			return api.get<ApiPaginatedResponse<CommunityReviewItem>>(
				'/community/challenges/review',
				params
			);
		},

		/** POST /community/challenges/{id}/approve — pas de body requis. */
		approveChallenge(challengeId: string) {
			return api.post<ApiResponse<{ approved: boolean; id: string; title: string }>>(
				`/community/challenges/${challengeId}/approve`
			);
		},

		/** POST /community/challenges/{id}/reject — feedback requis (>= 8 chars). */
		rejectChallenge(challengeId: string, body: CommunityRejectBody) {
			return api.post<ApiResponse<{ rejected: boolean; id: string; title: string }>>(
				`/community/challenges/${challengeId}/reject`,
				body
			);
		}
	},

	plagiarism: {
		/** GET /fraud/deliverables/flagged — file d'attente plagiat. */
		queue(params?: { page?: number; per_page?: number }) {
			return api.get<ApiPaginatedResponse<FlaggedDeliverable>>(
				'/fraud/deliverables/flagged',
				params
			);
		},

		/** POST /fraud/deliverables/{id}/mark-valid — annule le flag plagiat. */
		markValid(deliverableId: string, body: FraudReviewBody) {
			return api.post<ApiResponse<{ marked_valid: boolean; id: string }>>(
				`/fraud/deliverables/${deliverableId}/mark-valid`,
				body
			);
		},

		/** POST /fraud/deliverables/{id}/revoke — revoke le deliverable (reason >= 8 chars). */
		revoke(deliverableId: string, body: FraudReviewBody) {
			return api.post<ApiResponse<{ revoked: boolean; id: string }>>(
				`/fraud/deliverables/${deliverableId}/revoke`,
				body
			);
		}
	}
};
