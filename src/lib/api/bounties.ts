import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

// --- Types ---

export type BountyStatus = 'open' | 'claimed' | 'in_review' | 'paid' | 'cancelled' | 'expired';

export interface Bounty {
	id: string;
	title: string;
	description: string;
	repo: string;
	issue_url: string;
	issue_number: number;
	reward_credits: string;
	fragments_bonus: number;
	required_skills: string[];
	tags: string[];
	difficulty: number;
	status: BountyStatus;
	expires_at: string | null;
	created_at: string;
	company_name: string;
	active_claims?: number;
}

export interface BountyClaim {
	claim_id: string;
}

// --- API ---

export const bountiesApi = {
	list(params?: { status?: BountyStatus; skill?: string; tag?: string; page?: number; per_page?: number }) {
		return api.get<ApiResponse<{ bounties: Bounty[]; page: number; per_page: number }>>(
			'/bounties',
			params as Record<string, string | number>
		);
	},

	get(id: string) {
		return api.get<ApiResponse<Bounty>>(`/bounties/${id}`);
	},

	claim(id: string) {
		return api.post<ApiResponse<BountyClaim>>(`/bounties/${id}/claim`);
	},

	submitPr(id: string, pullRequestUrl: string, pullRequestNumber: number) {
		return api.post<ApiResponse<{ attached: boolean }>>(`/bounties/${id}/pr`, {
			pull_request_url: pullRequestUrl,
			pull_request_number: pullRequestNumber
		});
	},

	cancel(id: string) {
		return api.post<ApiResponse<{ cancelled: boolean }>>(`/bounties/${id}/cancel`);
	}
};
