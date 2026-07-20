import type { Challenge, SkillDomain, ApiResponse, ApiPaginatedResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

interface CreateCommunityChallenge {
	title: string;
	description: string;
	instructions: string;
	skill_domain: SkillDomain;
	difficulty: number;
	language?: string;
	expected_output?: string;
	test_cases?: unknown;
	reward_fragments?: number;
	duration_minutes?: number;
	tags?: string[];
	submit_for_review?: boolean;
}

export const communityApi = {
	create(data: CreateCommunityChallenge) {
		return api.post<ApiResponse<{ challenge: Challenge; message: string }>>('/community/challenges', data);
	},

	mine() {
		return api.get<ApiResponse<{ challenges: Challenge[] }>>('/community/challenges/mine');
	},

	update(id: string, data: Partial<CreateCommunityChallenge>) {
		return api.put<ApiResponse<{ challenge: Challenge }>>(`/community/challenges/${id}`, data);
	},

	vote(id: string) {
		return api.post<ApiResponse<{ message: string }>>(`/community/challenges/${id}/vote`);
	},

	unvote(id: string) {
		return api.delete<ApiResponse<{ message: string }>>(`/community/challenges/${id}/vote`);
	},

	popular(page?: number, perPage?: number) {
		return api.get<ApiPaginatedResponse<Challenge>>('/community/challenges/popular', { page, per_page: perPage });
	}
};
