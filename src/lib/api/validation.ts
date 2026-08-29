import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';
import type { Slice } from './slices';

const api = createApiClient();

// --- Types (P26 v2 validator workflow) ---

export interface ValidationQueueItem {
	slice: Slice;
	repo_url: string;
	pr_url: string;
	claimer_username: string;
	claimer_display_name: string;
	claimer_avatar_url: string | null;
	picked_up_by_me: boolean;
	picked_up_at: string | null;
}

export interface ValidationApproveResponse {
	attestation_hash: string;
	pdf_url: string;
	fragments_credited: number;
}

export interface ValidationRejectPayload {
	reason: string;
}

// --- API ---

export const validationApi = {
	// SKI-86 filter queue par caps validator du user
	queue() {
		return api.get<ApiResponse<{ items: ValidationQueueItem[] }>>('/me/validation/queue');
	},

	// SKI-83 premier volontaire gagne
	pickup(sliceId: string) {
		return api.post<ApiResponse<{ picked_up: boolean }>>(
			`/slices/${sliceId}/validation/pickup`
		);
	},

	// SKI-84 approve -> attestation + fragments
	approve(sliceId: string) {
		return api.post<ApiResponse<ValidationApproveResponse>>(
			`/slices/${sliceId}/validation/approve`
		);
	},

	// SKI-85 reject avec raison
	reject(sliceId: string, payload: ValidationRejectPayload) {
		return api.post<ApiResponse<{ rejected: boolean }>>(
			`/slices/${sliceId}/validation/reject`,
			payload
		);
	}
};
