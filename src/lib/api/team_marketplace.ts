import type {
	ApiPaginatedResponse,
	ApiResponse,
	Team,
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
	/** GET /users/me/teams — teams the current user belongs to. */
	/**
	 * Create a standing team.
	 *
	 * Persistent, unlike a challenge team: it outlives the thing it was formed
	 * for, which is why it has a name and a ceiling rather than a challenge id.
	 */
	createTeam(body: { name: string; description?: string; max_members?: number }) {
		return api.post<ApiResponse<{ team_id: string }>>('/teams', body);
	},

	/**
	 * Disband one.
	 *
	 * Not "leave": this ends the team for everybody in it. The two are
	 * different acts and must not share a button.
	 */
	disbandTeam(teamId: string) {
		return api.post<ApiResponse<{ deleted: boolean }>>(
			`/teams/${encodeURIComponent(teamId)}/disband`,
			{}
		);
	},

	/** Attach a team to a guild, or read which one it belongs to. */
	teamGuild(teamId: string) {
		return api.get<ApiResponse<{ guild: unknown }>>(
			`/teams/${encodeURIComponent(teamId)}/guild`
		);
	},

	/** One slot, by team and slot. */
	slot(teamId: string, slotId: string) {
		return api.get<ApiResponse<{ slot: unknown }>>(
			`/teams/${encodeURIComponent(teamId)}/slots/${encodeURIComponent(slotId)}`
		);
	},

	/**
	 * Open slots across every team, grouped by the role they want.
	 *
	 * The listing somebody looking for a team reads, as opposed to
	 * `marketplace`, which is the listing of teams. Same rows, opposite
	 * question.
	 */
	openSlotsByRole(role?: string) {
		return api.get<ApiResponse<{ slots: unknown[] }>>(
			'/team-slots/open',
			role ? { role } : undefined
		);
	},

	/** The slices a team has claimed together. */
	teamSlices(teamId: string) {
		return api.get<ApiResponse<{ slices: unknown[] }>>(
			`/teams/${encodeURIComponent(teamId)}/slices`
		);
	},

	myTeams() {
		return api.get<ApiResponse<{ teams: Team[] }>>('/users/me/teams');
	},

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
