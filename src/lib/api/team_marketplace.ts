import type {
	ApiPaginatedResponse,
	ApiResponse,
	TeamMarketplaceSlot,
	TeamRoleSlot
} from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export type MarketplaceFilters = {
	role_slug?: string;
	skill_slug?: string;
	min_difficulty?: number;
	max_difficulty?: number;
	page?: number;
	per_page?: number;
	[key: string]: string | number | boolean | undefined;
};

export interface CreateSlotBody {
	role_slug: string;
	role_display_name?: string;
	min_proficiency_level: number;
	required_skill_slug?: string;
}

export const teamMarketplaceApi = {
	marketplace(filters?: MarketplaceFilters) {
		return api.get<ApiPaginatedResponse<TeamMarketplaceSlot>>('/teams/marketplace', filters);
	},

	teamSlots(teamId: string) {
		return api.get<ApiResponse<TeamRoleSlot[]>>(`/teams/${teamId}/slots`);
	},

	createSlot(teamId: string, body: CreateSlotBody) {
		return api.post<ApiResponse<TeamRoleSlot>>(`/teams/${teamId}/slots`, body);
	},

	fillSlot(teamId: string, slotId: string) {
		return api.post<ApiResponse<TeamRoleSlot>>(`/teams/${teamId}/slots/${slotId}/fill`);
	},

	leaveSlot(teamId: string, slotId: string) {
		return api.post<ApiResponse<TeamRoleSlot>>(`/teams/${teamId}/slots/${slotId}/leave`);
	}
};
