import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

// --- Types ---

export type SeasonStatus = 'upcoming' | 'active' | 'closed';

export interface Season {
	id: string;
	slug: string;
	name: string;
	status: SeasonStatus;
	starts_at: string;
	ends_at: string;
}

export interface Tournament {
	id: string;
	slug: string;
	season_id: string;
	name: string;
	description: string | null;
	skill_domain: string | null;
	starts_at: string;
	ends_at: string;
	max_participants: number | null;
	participants_count: number;
	registered?: boolean;
}

export interface TournamentEntry {
	rank: number;
	user_id: string;
	username: string;
	display_name: string;
	score: number;
}

// --- API ---

export const tournamentApi = {
	listSeasons() {
		return api.get<ApiResponse<{ seasons: Season[] }>>('/seasons');
	},

	currentSeason() {
		return api.get<ApiResponse<Season>>('/seasons/current');
	},

	list(params?: { season_id?: string; skill_domain?: string }) {
		return api.get<ApiResponse<{ tournaments: Tournament[] }>>(
			'/tournaments',
			params as Record<string, string>
		);
	},

	get(slug: string) {
		return api.get<ApiResponse<Tournament>>(`/tournaments/${slug}`);
	},

	leaderboard(slug: string) {
		return api.get<ApiResponse<{ entries: TournamentEntry[] }>>(`/tournaments/${slug}/leaderboard`);
	},

	register(slug: string) {
		return api.post<ApiResponse<{ registered: boolean }>>(`/tournaments/${slug}/register`);
	}
};
