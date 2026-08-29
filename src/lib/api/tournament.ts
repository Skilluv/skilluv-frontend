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

	currentSeason() {
		return api.get<ApiResponse<Season>>('/seasons/current');
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
