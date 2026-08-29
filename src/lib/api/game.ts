/**
 * The game domain, from a creator's side.
 *
 * ## What is public and what needs a session
 *
 * Reading is open — the jams, a jam's detail, a project's composition, the
 * featured creators, a slice's playtest verdicts and where it stands against
 * the gate. The backend's reason is worth keeping in front of anybody building
 * on this: *a programme nobody can read is a programme nobody joins*.
 *
 * Everything that writes needs a session, because each is a person's own act:
 * submitting to a jam, voting, playtesting, registering a mod, recomputing
 * your own score.
 *
 * Validation, confirmation and finalisation are deliberately absent. They are
 * reviewer and admin acts and live in `routes::admin_game` — a surface here
 * that offered them would be offering a decision it cannot make.
 *
 * ## The gate is the thing to render honestly
 *
 * `GET /game/slices/{id}/gate` answers with the playtest count, the average
 * fun score and whether the gate is met. A game slice is not validated on
 * someone's opinion of the build; it is validated on whether enough people
 * played it and said it was fun. So a surface must show the count next to the
 * verdict — "meets the gate on three playtests" and "on thirty" are different
 * claims, and the boolean alone hides which one it is.
 */

import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

/** A game jam: a theme, a deadline, and a way of scoring. */
export interface GameJam {
	id: string;
	tournament_id: string;
	theme: string;
	/** Null until the theme drops — a jam whose theme is out has started. */
	theme_revealed_at: string | null;
	submission_deadline: string;
	voting_deadline: string;
	/** The axes votes are cast on. Shape is the jam's own. */
	scoring_axes: Record<string, unknown>;
	/** `solo_only`, or something that admits guilds. */
	solo_or_team: string;
	team_size_max: number;
}

export interface JamSubmitInput {
	participant_type: string;
	participant_id: string;
	artifact_url: string;
	summary: string;
	source_code_url?: string;
	postmortem_md?: string;
}

/** One person's verdict on a build they played. */
export interface Playtest {
	id: string;
	slice_id: string;
	playtester_user_id: string;
	session_duration_min: number | null;
	/** 1 to 5, both refused outside that. */
	fun_score: number;
	clarity_score: number;
	difficulty_perception: string;
	bugs_encountered_md: string | null;
	suggestions_md: string | null;
	would_play_again: boolean;
	submitted_at: string;
}

export interface PlaytestInput {
	slice_id: string;
	session_duration_min?: number;
	fun_score: number;
	clarity_score: number;
	difficulty_perception: string;
	bugs_encountered_md?: string;
	suggestions_md?: string;
	would_play_again: boolean;
}

/** A call for testers on one build. */
export interface Recruitment {
	id: string;
	slice_id: string;
	opened_by: string;
	build_url: string;
	brief_md: string;
	testers_wanted: number;
	/** Whether a tester may stay unnamed. Changes who is willing to be harsh. */
	allows_anonymous: boolean;
	opened_at: string;
	closed_at: string | null;
}

/**
 * Where a slice stands against the playtest gate.
 *
 * `meets_gate` alone is not renderable: it is true on three playtests and on
 * thirty, and those are different claims. Show `playtests` beside it.
 */
export interface GateStatus {
	playtests: number;
	average_fun: number;
	meets_gate: boolean;
}

export interface GameMod {
	id: string;
	author_user_id: string;
	slice_id: string | null;
	title: string;
	target_game: string;
	target_platform: string;
	external_hosting_url: string;
	/** The author's own figure, from wherever it is hosted. Not verified here. */
	external_downloads_count: number;
	description_md: string;
	status: string;
	reviewed_by: string | null;
	reviewed_at: string | null;
	review_reason: string | null;
	registered_at: string;
}

export interface ModRegisterInput {
	slice_id?: string;
	title: string;
	target_game: string;
	target_platform: string;
	external_hosting_url: string;
	external_downloads_count?: number;
	description_md: string;
}

/**
 * What a project actually shipped.
 *
 * `is_multi_artefact` and `is_team` are the two facts a game project is judged
 * on beyond its parts: a game made of art *and* code *and* design by several
 * people is a different achievement from one person shipping one artefact.
 */
export interface Composition {
	project_id: string;
	subtypes_shipped: string[];
	contributors: string[];
	is_multi_artefact: boolean;
	is_team: boolean;
}

export interface FeaturedCreator {
	id: string;
	user_id: string;
	week_starts_at: string;
	week_ends_at: string;
	bio_md: string;
	highlighted_projects: string[];
	itch_embeds: Record<string, unknown> | null;
	interview_qa_json: Record<string, unknown> | null;
	published_at: string;
}

export const gameApi = {
	jam(id: string) {
		return api.get<ApiResponse<{ jam: GameJam }>>(`/game/jams/${encodeURIComponent(id)}`);
	},

	/**
	 * Submit to a jam.
	 *
	 * `participant_type` is refused against the jam's own rule — a guild entry
	 * to a `solo_only` jam comes back 400 — so a form reads `solo_or_team`
	 * before it offers the choice.
	 */
	submitToJam(id: string, input: JamSubmitInput) {
		return api.post<ApiResponse<{ submission_id: string }>>(
			`/game/jams/${encodeURIComponent(id)}/submit`,
			input
		);
	},

	/** One vote, on one axis, for one submission. */
	voteOnJam(id: string, submissionId: string, axis: string, score: number) {
		return api.post<ApiResponse<unknown>>(`/game/jams/${encodeURIComponent(id)}/vote`, {
			submission_id: submissionId,
			axis,
			score
		});
	},

	playtests(sliceId: string) {
		return api.get<ApiResponse<{ playtests: Playtest[] }>>(
			`/game/slices/${encodeURIComponent(sliceId)}/playtests`
		);
	},

	/** Record having played it. Both scores are refused outside 1–5. */
	submitPlaytest(sliceId: string, input: PlaytestInput) {
		return api.post<ApiResponse<{ playtest: Playtest }>>(
			`/game/slices/${encodeURIComponent(sliceId)}/playtests`,
			input
		);
	},

	openRecruitment(
		sliceId: string,
		input: {
			slice_id: string;
			build_url?: string;
			brief_md: string;
			testers_wanted?: number;
			allows_anonymous?: boolean;
		}
	) {
		return api.post<ApiResponse<{ recruitment: Recruitment }>>(
			`/game/slices/${encodeURIComponent(sliceId)}/playtests/recruit`,
			input
		);
	},

	closeRecruitment(id: string) {
		return api.post<ApiResponse<{ recruitment: Recruitment }>>(
			`/game/playtests/recruitments/${encodeURIComponent(id)}/close`,
			{}
		);
	},

	/** The gate, with the count that makes it readable. Public. */
	gate(sliceId: string) {
		return api.get<ApiResponse<{ gate: GateStatus }>>(
			`/game/slices/${encodeURIComponent(sliceId)}/gate`
		);
	},

	registerMod(input: ModRegisterInput) {
		return api.post<ApiResponse<{ mod: GameMod }>>('/game/mods', input);
	},

	myMods() {
		return api.get<ApiResponse<{ mods: GameMod[] }>>('/game/mods/mine');
	},

	mod(id: string) {
		return api.get<ApiResponse<{ mod: GameMod }>>(`/game/mods/${encodeURIComponent(id)}`);
	},

	composition(projectId: string) {
		return api.get<ApiResponse<{ composition: Composition }>>(
			`/game/projects/${encodeURIComponent(projectId)}/composition`
		);
	},

	featured() {
		return api.get<ApiResponse<{ featured: FeaturedCreator[] }>>('/game/featured');
	},

	featuredOfWeek(date: string) {
		return api.get<ApiResponse<{ featured: FeaturedCreator }>>(
			`/game/featured/week/${encodeURIComponent(date)}`
		);
	},

	featuredOfUser(userId: string) {
		return api.get<ApiResponse<{ featured: FeaturedCreator[] }>>(
			`/game/creators/${encodeURIComponent(userId)}/featured`
		);
	},

	/** The caller's own game score, recomputed on the way out. */
	profile() {
		return api.get<ApiResponse<{ score: unknown; cap: number }>>('/game/profile');
	},

	recomputeProfile() {
		return api.post<ApiResponse<{ score: unknown }>>('/game/profile/recompute', {});
	}
};

/** Whether a jam is still taking entries. */
export function jamAcceptsEntries(jam: GameJam, now = new Date()): boolean {
	return new Date(jam.submission_deadline).getTime() > now.getTime();
}

/** Whether a jam is in its voting window: submissions closed, votes not. */
export function jamIsVoting(jam: GameJam, now = new Date()): boolean {
	const t = now.getTime();
	return (
		new Date(jam.submission_deadline).getTime() <= t &&
		new Date(jam.voting_deadline).getTime() > t
	);
}
