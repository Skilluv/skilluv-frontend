import type { ApiResponse, AiArtifact, AiArtifactSubtype, AiCompetition } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export interface BrowseArtifactsParams {
	subtype?: AiArtifactSubtype;
	orientation?: string;
	/** `pytorch`, `jax`, `vllm` — matched against what the slice declares. */
	framework?: string;
	limit?: number;
}

export interface BrowseCompetitionsParams {
	orientation?: string;
	/**
	 * Off by default, and left that way here: a listing that keeps showing
	 * closed entries teaches people to stop reading it.
	 */
	include_closed?: boolean;
	limit?: number;
}

/**
 * The AI domain of work.
 *
 * Not to be confused with `$api/ai`, which is the assistant — code review,
 * recommendations, jobs. The backend split the two on purpose: `/api/ai/**` is
 * the trade, and the assistant moved to `/api/assistant`.
 *
 * The craft record of one person lives in `$api/craft`, on
 * `/users/{username}/ai-profile`, because it has the same shape as every other
 * domain's.
 */
export const aiDomainApi = {
	/** Published artefacts with a verified deliverable behind them. */
	artifacts(params?: BrowseArtifactsParams) {
		return api.get<ApiResponse<{ artifacts: AiArtifact[] }>>(
			'/ai/artifacts',
			params as Record<string, string | number | undefined>
		);
	},

	/** Competitions and leaderboards outside Skilluv, chosen by a curator. */
	competitions(params?: BrowseCompetitionsParams) {
		return api.get<ApiResponse<{ competitions: AiCompetition[] }>>(
			'/ai/competitions',
			params as Record<string, string | number | boolean | undefined>
		);
	}
};
