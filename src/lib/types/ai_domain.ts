/**
 * The AI domain of work — not the assistant.
 *
 * The backend split those two deliberately: `/api/ai/**` is the trade, and the
 * assistant moved to `/api/assistant` for exactly this reason. The front keeps
 * the split, which is why these types live here and not next to
 * `$lib/api/ai`, which is the code-review and recommendation client.
 */

/** What an AI artefact is, from `project_slices.ai_subtype`. */
export const AI_ARTIFACT_SUBTYPES = [
	'ml_model',
	'dataset',
	'llm_agent',
	'data_pipeline',
	'ai_service_api',
	'ai_research_paper'
] as const;
export type AiArtifactSubtype = (typeof AI_ARTIFACT_SUBTYPES)[number];

/**
 * One published artefact with a verified deliverable behind it.
 *
 * Only verified, public, unrevoked work is served: the feed exists to be read
 * by somebody deciding whether this platform produces anything real, and a
 * pending submission answers that question wrongly.
 */
export interface AiArtifact {
	slice_id: string;
	title: string;
	ai_subtype: AiArtifactSubtype;
	/** `pytorch`, `jax`, `vllm` — what the slice declared. */
	ai_frameworks: string[];
	/** Where the artefact lives, on its hub. */
	hosting_url: string | null;
	model_size_params: number | null;
	author_username: string;
	orientation_slug: string | null;
	/**
	 * Monthly downloads from the hub. Null when never fetched or when the hub
	 * publishes none — which is not the same as zero, and must not be drawn
	 * as it.
	 */
	downloads_recent: number | null;
	likes_count: number | null;
}

/** A competition outside Skilluv, chosen by a curator. */
export interface AiCompetition {
	id: string;
	platform: string;
	title: string;
	url: string;
	/** Why this one and not the forty others open right now. */
	why_this_one: string;
	/** Null for a rolling leaderboard, which has no deadline by nature. */
	deadline: string | null;
	prize_note: string | null;
	orientation_slugs: string[];
}
