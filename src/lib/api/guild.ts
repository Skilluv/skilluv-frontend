import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

// --- Types ---

export interface Guild {
	id: string;
	slug: string;
	name: string;
	tag: string;
	description: string | null;
	logo_url: string | null;
	color_hex: string | null;
	member_count: number;
	total_fragments: number;
	total_wars_won: number;
	total_wars_lost: number;
	rank?: number;
	created_at: string;
}

export interface GuildMember {
	user_id: string;
	username: string;
	display_name: string;
	role: 'owner' | 'officer' | 'member';
	joined_at: string;
	total_fragments: number;
}

export interface GuildWar {
	id: string;
	challenger_guild_id: string;
	challenger_name: string;
	opponent_guild_id: string;
	opponent_name: string;
	status: 'proposed' | 'accepted' | 'declined' | 'concluded';
	winner_guild_id: string | null;
	starts_at: string | null;
	ends_at: string | null;
	created_at: string;
}

// --- API ---

export const guildApi = {
	leaderboard(params?: { page?: number; per_page?: number }) {
		return api.get<ApiResponse<{ guilds: Guild[] }>>('/guilds', params as Record<string, number>);
	},

	getBySlug(slug: string) {
		return api.get<ApiResponse<Guild>>(`/guilds/${slug}`);
	},

	members(guildId: string) {
		return api.get<ApiResponse<{ members: GuildMember[] }>>(`/guilds/${guildId}/members`);
	},

	create(data: { name: string; tag: string; description?: string; color_hex?: string }) {
		return api.post<ApiResponse<{ guild: Guild }>>('/guilds', data);
	},

	leave() {
		return api.post<ApiResponse<{ left: boolean }>>('/guilds/me/leave');
	},

	joinByToken(token: string) {
		return api.post<ApiResponse<{ joined: boolean }>>('/guilds/join-by-token', { token });
	},

	apply(guildId: string, message?: string) {
		return api.post<ApiResponse<{ application_id: string }>>(`/guilds/${guildId}/applications`, { message });
	},

	proposeWar(challengerGuildId: string, opponentGuildId: string) {
		return api.post<ApiResponse<{ war_id: string }>>('/guild-wars', {
			challenger_guild_id: challengerGuildId,
			opponent_guild_id: opponentGuildId
		});
	},

	listWars(params?: { status?: string }) {
		return api.get<ApiResponse<{ wars: GuildWar[] }>>('/guild-wars', params as Record<string, string>);
	}
};
