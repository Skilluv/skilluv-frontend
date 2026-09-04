import type {
	ApiResponse,
	CommunityRankingRow,
	ContestJuror,
	ContestSubmission,
	Tournament,
	TournamentParticipant
} from '$lib/types';
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

/**
 * `Tournament` and the contest shapes now live in `$types`, derived from the
 * backend model rather than hand-written here. The old local interface had
 * invented `max_participants` and `participants_count` and omitted `kind`,
 * `status` and `rules` — the three fields every contest surface reads.
 */
export type { Tournament } from '$lib/types';

export interface ContestSubmissionInput {
	/** Defaults to `user` server-side. */
	participant_type?: string;
	participant_id?: string;
	artifact_url: string;
	artifact_type: string;
	secondary_url?: string;
	summary: string;
	language?: string;
	measured_value?: number;
}

export interface JudgeInput {
	/** `accepted`, `rejected` or `disqualified`. */
	status: string;
	/** 0..100. Refused on a measured contest, where the artifact scores itself. */
	judge_score?: number;
	judge_notes?: string;
}

// --- API ---

export const tournamentApi = {
	listSeasons() {
		return api.get<ApiResponse<{ seasons: Season[] }>>('/seasons');
	},

	/**
	 * What is on: the running season, and the tournaments open or about to be.
	 *
	 * One call rather than two, and that is the point. A season and the
	 * tournaments inside it are read together or not at all, and two requests
	 * let a page render a season with the previous one's tournaments under it
	 * for the length of a round trip.
	 */
	feed() {
		return api.get<
			ApiResponse<{ current_season: Season | null; upcoming_tournaments: Tournament[] }>
		>('/tournaments/feed');
	},

	/** One season, by slug. Same envelope as `currentSeason`. */
	season(slug: string) {
		return api.get<ApiResponse<{ season: Season }>>(`/seasons/${encodeURIComponent(slug)}`);
	},

	/**
	 * Make a season the running one.
	 *
	 * There is one active season at a time, so activating a season ends the
	 * previous one. That is not obvious from the verb, and any surface offering
	 * it has to say so before the click rather than after.
	 */
	activateSeason(slug: string) {
		return api.post<ApiResponse<Season>>(
			`/seasons/${encodeURIComponent(slug)}/activate`,
			{}
		);
	},

	/** Who stewards a project. */
	projectStewards(projectId: string) {
		return api.get<ApiResponse<{ stewards: unknown[] }>>(
			`/projects/${encodeURIComponent(projectId)}/stewards`
		);
	},

	addSteward(projectId: string, body: Record<string, unknown>) {
		return api.post<ApiResponse<unknown>>(
			`/projects/${encodeURIComponent(projectId)}/stewards`,
			body
		);
	},

	/**
	 * Remove one, by user and role.
	 *
	 * Keyed on the role as well as the person: somebody can steward a project
	 * in two capacities, and dropping both when only one was meant would take
	 * away a permission nobody asked to remove.
	 */
	removeSteward(projectId: string, userId: string, role: string) {
		return api.delete<void>(
			`/projects/${encodeURIComponent(projectId)}/stewards/${encodeURIComponent(userId)}/${encodeURIComponent(role)}`
		);
	},

	/**
	 * The running season, or nothing.
	 *
	 * Both season endpoints answer an envelope, `{ season }`, and this was
	 * typed as the season itself. `res.data.name` and `res.data.ends_at` were
	 * therefore always undefined — which is where "Se clôture le Invalid Date"
	 * came from, `new Date(undefined)` being exactly that.
	 *
	 * The envelope also made the absence of a season indistinguishable from a
	 * season: `{ season: null }` is a truthy object, so the banner rendered
	 * whatever the answer was. `season` is optional here for the same reason it
	 * is `Option<Season>` there.
	 */
	currentSeason() {
		return api.get<ApiResponse<{ season: Season | null }>>('/seasons/current');
	},

	/**
	 * The contest listing.
	 *
	 * `kind`
	 * `kind` and `skill_domain` narrow server-side (SKI-302). A `skill_domain`
	 * returns the contests scoped to it **and** those open to every domain,
	 * which are the ones that most want a wide field — so a caller passing one
	 * does not have to add the open contests back itself.
	 */
	list(params?: {
		status?: string;
		upcoming?: boolean;
		kind?: string;
		skill_domain?: string;
		limit?: number;
	}) {
		return api.get<ApiResponse<{ tournaments: Tournament[] }>>(
			'/tournaments',
			params as Record<string, string | number | boolean | undefined>
		);
	},

	get(slug: string) {
		return api.get<ApiResponse<{ tournament: Tournament }>>(`/tournaments/${slug}`);
	},

	leaderboard(slug: string) {
		return api.get<ApiResponse<{ leaderboard: TournamentParticipant[] }>>(
			`/tournaments/${slug}/leaderboard`
		);
	},

	register(slug: string) {
		return api.post<ApiResponse<{ registered: boolean }>>(`/tournaments/${slug}/register`);
	},

	/** Hand in an entry, or replace the one already handed in. */
	submit(slug: string, input: ContestSubmissionInput) {
		return api.post<ApiResponse<{ submission: ContestSubmission }>>(
			`/tournaments/${slug}/submissions`,
			input
		);
	},

	/**
	 * Every entry, publicly. The backend is explicit that this stays open:
	 * "a contest whose entries cannot be read is a contest whose result
	 * cannot be questioned".
	 */
	submissions(slug: string) {
		return api.get<ApiResponse<{ submissions: ContestSubmission[] }>>(
			`/tournaments/${slug}/submissions`
		);
	},

	/** Requires the `jury_tournament` capability. */
	judge(submissionId: string, input: JudgeInput) {
		return api.post<ApiResponse<{ submission: ContestSubmission }>>(
			`/submissions/${submissionId}/judge`,
			input
		);
	},

	jury(slug: string) {
		return api.get<ApiResponse<{ jury: ContestJuror[] }>>(`/tournaments/${slug}/jury`);
	},

	/** Declining with a reason lets the organiser widen the panel in time. */
	respondToJury(slug: string, accept: boolean, declineReason?: string) {
		return api.post<ApiResponse<{ jury: ContestJuror }>>(`/tournaments/${slug}/jury/respond`, {
			accept,
			decline_reason: declineReason
		});
	},

	/** One voice, movable: re-posting moves the vote rather than adding one. */
	communityVote(slug: string, submissionId: string) {
		return api.post<ApiResponse<{ recorded: boolean }>>(`/tournaments/${slug}/community-vote`, {
			submission_id: submissionId
		});
	},

	communityRanking(slug: string) {
		return api.get<ApiResponse<{ ranking: CommunityRankingRow[] }>>(
			`/tournaments/${slug}/community-ranking`
		);
	}
};
