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
	/** The list endpoint returns `color_hex`, the detail one `color_primary`. */
	color_hex?: string | null;
	color_primary?: string | null;
	// The detail endpoint (`GET /guilds/{slug}`) omits these aggregates; only
	// the list endpoint returns them. Optional so the detail page cannot crash
	// on a missing counter.
	member_count?: number;
	total_fragments?: number;
	total_wars_won?: number;
	total_wars_lost?: number;
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

/** A user named in an application or an invitation. */
export interface GuildUserRef {
	id: string;
	username: string | null;
	display_name: string | null;
}

/** One pending application to join a guild. Decided ones drop out of the list. */
export interface GuildApplication {
	id: string;
	applicant: GuildUserRef;
	status: string;
	applied_at: string;
	message: string | null;
}

/**
 * One pending invitation. Exactly one of `invitee` / `token` is set: a direct
 * invitation names a user, a shareable link carries a token.
 */
export interface GuildInvitation {
	id: string;
	invitee: GuildUserRef | null;
	token: { value: string } | null;
	sent_at: string;
	expires_at: string;
}

export const guildApi = {
	leaderboard(params?: { page?: number; per_page?: number }) {
		return api.get<ApiResponse<{ guilds: Guild[] }>>('/guilds', params as Record<string, number>);
	},

	/** The backend wraps the guild in `data.guild`, unlike the list endpoint. */
	getBySlug(slug: string) {
		return api.get<ApiResponse<{ guild: Guild }>>(`/guilds/${slug}`);
	},

	members(guildId: string) {
		return api.get<ApiResponse<{ members: GuildMember[] }>>(`/guilds/${guildId}/members`);
	},

	/**
	 * Mint a guild.
	 *
	 * The backend requires `slug` and exactly three `cofounder_ids` — a guild
	 * cannot be founded alone. The previous signature omitted both and would
	 * always fail with 422. There is no creation page yet; see SKI-289.
	 */
	create(data: {
		name: string;
		slug: string;
		tag: string;
		cofounder_ids: [string, string, string];
		description?: string;
		color_hex?: string;
	}) {
		return api.post<ApiResponse<{ guild: Guild }>>('/guilds', data);
	},

	leave() {
		return api.post<ApiResponse<{ left: boolean }>>('/guilds/me/leave');
	},

	joinByToken(token: string) {
		return api.post<ApiResponse<{ joined: boolean }>>('/guilds/join-by-token', { token });
	},

	/** GET /guilds/{id}/applications — owner/officer only. */
	applications(guildId: string) {
		return api.get<ApiResponse<{ applications: GuildApplication[] }>>(
			`/guilds/${guildId}/applications`
		);
	},

	/**
	 * POST /guild-applications/{id}/decide — accept or reject a candidate.
	 *
	 * The body is `{ accept }`. The OpenAPI leaves this request untyped, so the
	 * field name was confirmed against the test backend: anything else comes
	 * back as `missing field \`accept\``.
	 */
	decideApplication(applicationId: string, accept: boolean) {
		return api.post<ApiResponse<{ id: string; status: string }>>(
			`/guild-applications/${applicationId}/decide`,
			{ accept }
		);
	},

	/** GET /guilds/{id}/invitations — owner/officer only. */
	invitations(guildId: string) {
		return api.get<ApiResponse<{ invitations: GuildInvitation[] }>>(
			`/guilds/${guildId}/invitations`
		);
	},

	/** DELETE /guilds/{id}/invitations/{invitationId} — idempotent (SKI-289). */
	revokeInvitation(guildId: string, invitationId: string) {
		return api.delete<ApiResponse<{ revoked: boolean; invitation_id: string }>>(
			`/guilds/${guildId}/invitations/${invitationId}`
		);
	},

	/**
	 * A shareable join link, rather than an invitation to one person.
	 *
	 * The two coexist on purpose: `invite_direct` names somebody, this mints a
	 * token anybody holding it can redeem through `joinByToken`. A link that
	 * leaves the guild's control is a different risk from a named invitation,
	 * which is why revoking exists.
	 */
	createTokenLink(guildId: string) {
		return api.post<ApiResponse<{ invitation: GuildInvitation }>>(
			`/guilds/${encodeURIComponent(guildId)}/invitations/link`,
			{}
		);
	},

	/** Accept an invitation addressed to you. */
	acceptInvitation(invitationId: string) {
		return api.post<ApiResponse<unknown>>(
			`/guild-invitations/${encodeURIComponent(invitationId)}/accept`,
			{}
		);
	},

	/**
	 * Change a member's role.
	 *
	 * The role vocabulary is the guild's, and the server refuses one outside
	 * it — so a caller offers the roles it was told about rather than a free
	 * field.
	 */
	setMemberRole(guildId: string, userId: string, role: string) {
		return api.post<ApiResponse<{ updated: boolean }>>(
			`/guilds/${encodeURIComponent(guildId)}/members/${encodeURIComponent(userId)}/role`,
			{ role }
		);
	},

	/**
	 * Remove somebody from the guild.
	 *
	 * Distinct from `leave`, which is the member's own act. A surface must not
	 * present them as one gesture: being removed and choosing to go are
	 * different things to have happened to you.
	 */
	kickMember(guildId: string, userId: string) {
		return api.delete<void>(
			`/guilds/${encodeURIComponent(guildId)}/members/${encodeURIComponent(userId)}`
		);
	},

	/** Answer a war proposal. */
	respondToWar(warId: string, accept: boolean) {
		return api.post<ApiResponse<unknown>>(
			`/guild-wars/${encodeURIComponent(warId)}/respond`,
			{ accept }
		);
	},

	/**
	 * Declare a winner and close the war.
	 *
	 * The winner is named rather than computed, so the act has an author. A
	 * result nobody signed is a result nobody can be asked about.
	 */
	concludeWar(warId: string, winnerGuildId: string) {
		return api.post<ApiResponse<unknown>>(
			`/guild-wars/${encodeURIComponent(warId)}/conclude`,
			{ winner_guild_id: winnerGuildId }
		);
	},

	/**
	 * What trades the guild actually covers.
	 *
	 * Read from its members' verified work rather than from what it says about
	 * itself — which is why it is worth showing on a guild somebody is deciding
	 * whether to join.
	 */
	composition(slug: string) {
		return api.get<ApiResponse<{ composition: unknown }>>(
			`/guilds/${encodeURIComponent(slug)}/composition`
		);
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
