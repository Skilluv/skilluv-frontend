import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

// --- Types (P26 v2 workflow challenge) ---

export type SliceStatus =
	| 'open'
	| 'claimed'
	| 'in_progress'
	| 'submitted'
	| 'ci_green'
	| 'pending_validation'
	| 'validated'
	| 'merged'
	| 'closed'
	| 'expired';

export interface SliceExternalMetadata {
	issue_url?: string;
	issue_number?: number;
	repo_owner?: string;
	repo_name?: string;
}

export interface Slice {
	id: string;
	title: string;
	description: string;
	acceptance_criteria: string[];
	labels: string[];
	difficulty: number;
	status: SliceStatus;
	min_rank: string | null;
	required_orientation_slugs: string[] | null;
	external_metadata: SliceExternalMetadata | null;
	fork_repo_url: string | null;
	submitted_pr_url: string | null;
	attestation_hash: string | null;
	announced_at: string | null;
	validation_reject_reason: string | null;
	claimed_by_user_id: string | null;
	claim_expires_at: string | null;
	validator_user_id: string | null;
	project_id: string;
	project_slug: string;
	created_at: string;
	updated_at: string;
}

export interface ActiveSkilluver {
	user_id: string;
	username: string;
	display_name: string;
	avatar_url: string | null;
}

export interface ActiveSkilluversResponse {
	count: number;
	users: ActiveSkilluver[];
}

export interface DiaryEntry {
	id: string;
	slice_id: string;
	author_user_id: string;
	author_username: string;
	author_display_name: string;
	author_avatar_url: string | null;
	body_markdown: string;
	is_public: boolean;
	created_at: string;
}

export interface DiaryPostPayload {
	body_markdown: string;
	is_public: boolean;
}

export interface SubmitPrPayload {
	pr_url: string;
	announce_publicly: boolean;
}

export interface SlicesListParams {
	status?: SliceStatus;
	project_id?: string;
	page?: number;
	per_page?: number;
}

// --- API ---

export const slicesApi = {
	list(params?: SlicesListParams) {
		return api.get<ApiResponse<{ slices: Slice[]; page: number; per_page: number }>>(
			'/slices',
			params as Record<string, string | number>
		);
	},

	get(id: string) {
		return api.get<ApiResponse<Slice>>(`/slices/${id}`);
	},

	claim(id: string) {
		return api.post<ApiResponse<{ claimed: boolean; fork_repo_url: string | null }>>(
			`/slices/${id}/claim`
		);
	},

	unclaim(id: string) {
		return api.post<ApiResponse<{ unclaimed: boolean }>>(`/slices/${id}/unclaim`);
	},

	submitPr(id: string, payload: SubmitPrPayload) {
		return api.post<ApiResponse<{ submitted: boolean }>>(`/slices/${id}/submit-pr`, payload);
	},

	// SKI-122 widget "Active Skilluvers on this repo"
	activeSkilluvers(projectSlug: string, days = 30) {
		return api.get<ApiResponse<ActiveSkilluversResponse>>(
			`/projects/${encodeURIComponent(projectSlug)}/active-skilluvers`,
			{ days }
		);
	},

	// SKI-123 challenger diary
	diary(sliceId: string) {
		return api.get<ApiResponse<{ entries: DiaryEntry[] }>>(`/slices/${sliceId}/diary`);
	},

	postDiaryEntry(sliceId: string, payload: DiaryPostPayload) {
		return api.post<ApiResponse<DiaryEntry>>(`/slices/${sliceId}/diary`, payload);
	},

	// SKI-121 feed reco challenges
	feedRecommended(limit = 20) {
		return api.get<
			ApiResponse<{ slices: Slice[]; meta?: { user_rank_ord?: number; median_difficulty?: number } }>
		>('/me/feed/challenges', { limit });
	},

	// Mes challenges
	mySlices(params?: { status?: SliceStatus; page?: number; per_page?: number }) {
		return api.get<ApiResponse<{ slices: Slice[]; page: number; per_page: number }>>(
			'/users/me/slices',
			params as Record<string, string | number>
		);
	}
};
