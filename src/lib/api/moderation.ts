import type { ApiPaginatedResponse, ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

// --- Forum moderation (capability: forum_moderator) ---

export interface ForumModerateBody {
	action: 'delete' | 'mute_author' | 'mark_spam';
	reason?: string;
	duration_hours?: number;
}

export interface MuteRecord {
	user_id: string;
	muted_until: string;
	reason: string;
}

// --- Community challenge review (capability: community_curator) ---

export interface CommunityReviewBody {
	reason?: string;
}

// --- Plagiarism review (capability: plagiarism_reviewer) ---

export interface PlagiarismFlaggedDeliverable {
	deliverable_id: string;
	submission_id: string;
	user_id: string;
	username: string;
	plagiarism_score: number;
	similar_to_deliverable_id?: string;
	flagged_at: string;
}

export interface PlagiarismReviewBody {
	reason: string;
}

export const moderationApi = {
	forum: {
		moderatePost(postId: string, body: ForumModerateBody) {
			return api.post<ApiResponse<{ moderated: boolean }>>(
				`/forum/posts/${postId}/moderate`,
				body
			);
		},

		muteAuthor(userId: string, durationHours: number, reason: string) {
			return api.post<ApiResponse<MuteRecord>>(`/forum/users/${userId}/mute`, {
				duration_hours: durationHours,
				reason
			});
		}
	},

	community: {
		approveChallenge(challengeId: string, body: CommunityReviewBody = {}) {
			return api.post<ApiResponse<{ approved: boolean }>>(
				`/community/challenges/${challengeId}/approve`,
				body
			);
		},

		rejectChallenge(challengeId: string, body: CommunityReviewBody) {
			return api.post<ApiResponse<{ rejected: boolean }>>(
				`/community/challenges/${challengeId}/reject`,
				body
			);
		}
	},

	plagiarism: {
		queue(params?: { page?: number; per_page?: number }) {
			return api.get<ApiPaginatedResponse<PlagiarismFlaggedDeliverable>>(
				'/fraud/deliverables/flagged',
				params
			);
		},

		markValid(deliverableId: string, body: PlagiarismReviewBody) {
			return api.post<ApiResponse<{ valid: boolean }>>(
				`/fraud/deliverables/${deliverableId}/mark-valid`,
				body
			);
		},

		revoke(deliverableId: string, body: PlagiarismReviewBody) {
			return api.post<ApiResponse<{ revoked: boolean }>>(
				`/fraud/deliverables/${deliverableId}/revoke`,
				body
			);
		}
	}
};
