import type { LeaderboardEntry, LeaderboardDomain, LeaderboardPeriod, ApiPaginatedResponse, ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

interface LeaderboardListResponse {
	data: {
		leaderboards: { domain: LeaderboardDomain; periods: LeaderboardPeriod[] }[];
	};
}

interface LeaderboardResponse {
	data: {
		domain: LeaderboardDomain;
		period: LeaderboardPeriod;
		entries: LeaderboardEntry[];
	};
	pagination: { page: number; per_page: number; total: number; total_pages: number };
}

interface MyRankResponse {
	data: {
		domain: LeaderboardDomain;
		period: LeaderboardPeriod;
		rank: number;
		score: number;
		total_participants: number;
	};
}

export const leaderboardApi = {
	/** Liste des classements disponibles (SSR) */
	list() {
		return api.get<LeaderboardListResponse>('/leaderboards');
	},

	/** Classement par domaine (SSR) */
	get(domain: LeaderboardDomain, period?: LeaderboardPeriod, page?: number, perPage?: number) {
		return api.get<LeaderboardResponse>(`/leaderboards/${domain}`, {
			period,
			page,
			per_page: perPage
		});
	},

	/** Mon rang dans un classement */
	myRank(domain: LeaderboardDomain, period?: LeaderboardPeriod) {
		return api.get<MyRankResponse>(`/leaderboards/${domain}/me`, { period });
	}
};
