import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

/**
 * Injectable variant for use inside universal `load` functions.
 *
 * The default client captures the global `fetch`. During SSR a relative URL
 * like `/api/slices/{id}` has no base and throws `TypeError: Failed to parse
 * URL`. The `fetch` from SvelteKit's load event resolves relative URLs against
 * the incoming request and forwards session cookies.
 */
export function createSlicesApi(customFetch: typeof fetch) {
	const scoped = createApiClient(customFetch);
	return {
		get(id: string) {
			return scoped.get<ApiResponse<SliceEnvelope>>(`/slices/${id}`);
		},
		mySlices(params?: { status?: SliceStatus; page?: number; per_page?: number }) {
			return scoped.get<ApiResponse<{ slices: Slice[]; page: number; per_page: number }>>(
				'/users/me/slices',
				params as Record<string, string | number>
			);
		},
		feedRecommended(limit = 20) {
			return scoped.get<
				ApiResponse<{ slices: Slice[]; meta?: { user_rank_ord?: number; median_difficulty?: number } }>
			>('/me/feed/challenges', { limit });
		}
	};
}

// --- Types (P26 v2 workflow challenge) ---

export type SliceStatus =
	| 'open'
	| 'claimed'
	| 'in_progress'
	| 'submitted'
	| 'ci_green'
	| 'pending_validation'
	| 'validated'
	| 'merged'
	| 'closed'
	| 'expired';

export interface SliceExternalMetadata {
	issue_url?: string;
	issue_number?: number;
	repo_owner?: string;
	repo_name?: string;
}

/**
 * What `GET /slices/{id}` actually answers.
 *
 * `routes::slices::get_slice` wraps the row: `{ data: { slice } }`. This was
 * typed as `ApiResponse<Slice>`, so TypeScript was happy and every field read
 * off it at runtime was `undefined` — the detail page rendered an empty title
 * against a real backend, and only passed its tests because the mock encoded
 * the front's assumption rather than the backend's answer.
 */
export interface SliceEnvelope {
	slice: Slice;
}

export interface Slice {
	id: string;
	title: string;
	/**
	 * `github_issue`, `audio_artifact`, `design_artifact`… Serialised by
	 * `ProjectSlice` all along; declared here now that a surface branches on
	 * it.
	 */
	slice_type: string;
	primary_domain: string;
	description: string;
	acceptance_criteria: string[];
	labels: string[];
	difficulty: number;
	status: SliceStatus;
	min_rank: string | null;
	required_orientation_slugs: string[] | null;
	external_metadata: SliceExternalMetadata | null;
	fork_repo_url: string | null;
	submitted_pr_url: string | null;
	attestation_hash: string | null;
	announced_at: string | null;
	validation_reject_reason: string | null;
	claimed_by_user_id: string | null;
	claim_expires_at: string | null;
	validator_user_id: string | null;
	/** Renseigne quand le back joint le username du validateur pour affichage. */
	validator_username?: string | null;
	project_id: string;
	project_slug: string;
	created_at: string;
	updated_at: string;

	// ── Per-domain shape ──────────────────────────────────────────────
	// `ProjectSlice` serialises these and nothing here read them, so a design
	// brief rendered exactly like a GitHub issue. Every domain leaves the
	// others null, hence optional on the way in and nullable on the way out.

	/** Code: what the finished artefact is (migration 0181). */
	code_subtype?: string | null;
	/** AI: what the finished artefact is (migration 0214). */
	ai_subtype?: string | null;
	/** Design: which of the twelve deliverable kinds this is (migration 0505). */
	design_subtype?: string | null;
	/** Where the finished artefact lives, whatever domain produced it: a
	 * package registry, a model hub, a Figma node, or an object in our own
	 * storage for the source formats with no public home. */
	published_artifact_url?: string | null;
	/** Design: what the author says changed since the previous version. */
	design_version_notes_md?: string | null;
	/** Design: every tool the slice touches. */
	design_tools?: string[];
	/** Design: how many critique rounds the brief announces. The hard ceiling
	 * is five and it is enforced on the decision journal, not here — so a
	 * brief announcing three and taking four is a record, not a refusal. */
	design_expected_rounds?: number | null;
}

/** The slice type the design critique loop applies to. */
export const DESIGN_SLICE_TYPE = 'design_artifact';

/** Whether a slice is reviewed by critique rounds rather than by a PR. */
export function isDesignSlice(slice: { slice_type?: string }): boolean {
	return slice.slice_type === DESIGN_SLICE_TYPE;
}

export interface ActiveSkilluver {
	user_id: string;
	username: string;
	display_name: string;
	avatar_url: string | null;
}

export interface ActiveSkilluversResponse {
	count: number;
	users: ActiveSkilluver[];
}

export interface DiaryEntry {
	id: string;
	slice_id: string;
	author_user_id: string;
	author_username: string;
	author_display_name: string;
	author_avatar_url: string | null;
	body_markdown: string;
	is_public: boolean;
	created_at: string;
}

export interface DiaryPostPayload {
	body_markdown: string;
	is_public: boolean;
}

export interface SubmitPrPayload {
	pr_url: string;
	announce_publicly: boolean;
}

export interface SlicesListParams {
	status?: SliceStatus;
	project_id?: string;
	page?: number;
	per_page?: number;
}

// --- API ---

export const slicesApi = {
	/**
	 * Close a revision round.
	 *
	 * Resolving is the reviewer saying the round is answered, which is what lets
	 * the next one open. A round nobody resolved holds the slice indefinitely,
	 * so this is the act the whole loop waits on.
	 */
	resolveRound(roundId: string, body?: Record<string, unknown>) {
		return api.post<ApiResponse<unknown>>(
			`/revisions/${encodeURIComponent(roundId)}/resolve`,
			body ?? {}
		);
	},

	/**
	 * Claim a slice for a team rather than for yourself.
	 *
	 * Distinct from `claim`, and the distinction is who the attestation names.
	 * A slice claimed as a team credits the team; offering one button for both
	 * would let somebody take individual credit for shared work by accident.
	 */
	claimAsTeam(sliceId: string, teamId: string) {
		return api.post<ApiResponse<unknown>>(
			`/slices/${encodeURIComponent(sliceId)}/claim-as-team`,
			{ team_id: teamId }
		);
	},

	/** Give it back, on the team's behalf. */
	unclaimAsTeam(sliceId: string) {
		return api.post<ApiResponse<unknown>>(
			`/slices/${encodeURIComponent(sliceId)}/unclaim-team`,
			{}
		);
	},

	/**
	 * A steward's inbox for one project: what is waiting on their word.
	 *
	 * Stewardship is per project, so this is addressed by project rather than
	 * by person — somebody can steward one repository and not another.
	 */
	stewardInbox(projectId: string) {
		return api.get<ApiResponse<{ slices: unknown[] }>>(
			`/stewards/${encodeURIComponent(projectId)}/inbox`
		);
	},

	/** Publish a slice, as its steward. */
	publish(sliceId: string) {
		return api.post<ApiResponse<unknown>>(
			`/slices/${encodeURIComponent(sliceId)}/publish`,
			{}
		);
	},

	/**
	 * Refuse one, with a reason.
	 *
	 * The reason is the whole of it: a slice rejected without one tells its
	 * author nothing they can act on, and they wrote it in good faith.
	 */
	reject(sliceId: string, reason?: string) {
		return api.post<ApiResponse<unknown>>(
			`/slices/${encodeURIComponent(sliceId)}/reject`,
			reason ? { reason } : {}
		);
	},

	list(params?: SlicesListParams) {
		return api.get<ApiResponse<{ slices: Slice[]; page: number; per_page: number }>>(
			'/slices',
			params as Record<string, string | number>
		);
	},

	get(id: string) {
		return api.get<ApiResponse<SliceEnvelope>>(`/slices/${id}`);
	},

	claim(id: string) {
		return api.post<ApiResponse<{ claimed: boolean; fork_repo_url: string | null }>>(
			`/slices/${id}/claim`
		);
	},

	unclaim(id: string) {
		return api.post<ApiResponse<{ unclaimed: boolean }>>(`/slices/${id}/unclaim`);
	},

	submitPr(id: string, payload: SubmitPrPayload) {
		return api.post<ApiResponse<{ submitted: boolean }>>(`/slices/${id}/submit-pr`, payload);
	},

	// SKI-122 widget "Active Skilluvers on this repo"
	activeSkilluvers(projectSlug: string, days = 30) {
		return api.get<ApiResponse<ActiveSkilluversResponse>>(
			`/projects/${encodeURIComponent(projectSlug)}/active-skilluvers`,
			{ days }
		);
	},

	// SKI-123 challenger diary
	diary(sliceId: string) {
		return api.get<ApiResponse<{ entries: DiaryEntry[] }>>(`/slices/${sliceId}/diary`);
	},

	postDiaryEntry(sliceId: string, payload: DiaryPostPayload) {
		return api.post<ApiResponse<DiaryEntry>>(`/slices/${sliceId}/diary`, payload);
	},

	// SKI-121 feed reco challenges
	feedRecommended(limit = 20) {
		return api.get<
			ApiResponse<{ slices: Slice[]; meta?: { user_rank_ord?: number; median_difficulty?: number } }>
		>('/me/feed/challenges', { limit });
	},

	// Mes challenges
	mySlices(params?: { status?: SliceStatus; page?: number; per_page?: number }) {
		return api.get<ApiResponse<{ slices: Slice[]; page: number; per_page: number }>>(
			'/users/me/slices',
			params as Record<string, string | number>
		);
	}
};
