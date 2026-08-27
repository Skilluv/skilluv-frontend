/**
 * Craft records — one shape, several domains.
 *
 * `services::craft_score` is written per domain but not per formula: each
 * domain reads its own weights from migration 0204 and returns the same six
 * fields, on purpose, "so somebody can compare their own two profiles". The
 * front honours that: one type, one component, one endpoint pattern
 * (`/users/{username}/{domain}-profile`), and a domain-specific extension
 * only where the backend actually added one.
 *
 * Design is the exception and stays in `design.ts`: it shipped first with a
 * nested `craft_score` object plus artefacts, contests and attestations, and
 * flattening it here would be a rewrite of a working surface, not a reuse.
 */

/** Domains served by a flat `{domain}-profile` endpoint. */
export const CRAFT_DOMAINS = ['ai', 'audio'] as const;
export type CraftDomain = (typeof CRAFT_DOMAINS)[number];

/**
 * One line of the score's explanation.
 *
 * `measured` is a whole number for the counting terms and the raw figure for
 * the scaled ones — a score with no explanation is a number somebody has to
 * trust.
 */
export interface CraftTerm {
	term: string;
	measured: number;
	points: number;
	explanation: string;
}

/**
 * What one person has to show in a domain's trades.
 *
 * Recomputed server-side on every read rather than served from the hourly
 * sweep, so the page never shows a revoked attestation still counting.
 */
export interface CraftProfile {
	username: string;
	craft_score: number;
	/**
	 * `apprentice`, `contributor`, `engineer`, `senior`, `staff`, `principal`
	 * — the same six in every domain.
	 */
	tier: string;
	tier_name: string;
	tier_description: string;
	/** The score at which the next tier starts, absent at the top. */
	next_tier_at: number | null;
	breakdown: CraftTerm[];
	/** True when the total hit the ceiling, said out loud rather than left to
	 * be inferred from a round number. */
	capped: boolean;
	/** Trades this person has verified work in, by slug. */
	orientations: string[];
}

/** One piece of published audio work, with enough to decide whether to play it. */
export interface AudioHighlight {
	slice_id: string;
	title: string;
	subtype: string;
	/** What the work is for — a game, a montage, a podcast, an interface. */
	destination: string | null;
	/** Where it lives publicly, when the author named somewhere. */
	external_url: string | null;
	/** Length of the longest master, in seconds. */
	duration_seconds: number | null;
	/**
	 * Whether a generated preview exists. Playing still costs a signed URL:
	 * nothing in the audio domain returns a stable link, because a URL that
	 * outlives the request that asked for it outlives the embargo too.
	 */
	has_preview: boolean;
}

/** The audio record adds work worth listening to first. */
export interface AudioCraftProfile extends CraftProfile {
	highlights: AudioHighlight[];
}

// ---------------------------------------------------------------------------
// Guides, toolkits and templates — `content_guides`, every domain
// ---------------------------------------------------------------------------

/**
 * The four kinds of guide.
 *
 * `brief_template` is the odd one and deliberately so: it is written by
 * whoever *commissions* the work, before it starts, while the other three are
 * written by or for the person doing it. A listing meant for contributors
 * usually asks for the other three.
 */
export const GUIDE_KINDS = [
	'onboarding',
	'toolkit',
	'writeup_template',
	'brief_template'
] as const;

export type GuideKind = (typeof GUIDE_KINDS)[number];

/** A guide in a listing: everything but the body. */
export interface GuideSummary {
	slug: string;
	kind: GuideKind;
	skill_domain: string;
	/** Set on onboarding guides: the family of trades it opens. */
	reviewer_group: string | null;
	/**
	 * The locale actually served, which is not necessarily the one asked for.
	 * A guide with no row in your locale arrives in the next best one, so this
	 * is worth surfacing rather than assuming.
	 */
	locale: string;
	title: string;
	summary: string;
}

export interface Guide extends GuideSummary {
	/** Markdown, rendered by the reader. */
	body_md: string;
}
