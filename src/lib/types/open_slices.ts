/**
 * The open pool: work nobody has taken yet, in any trade.
 *
 * `GET /api/code/first-issues` answered "what could I work on right now?" for
 * one domain, and the query behind it was never about code — it reads
 * `project_slices`, filtered to one surface. Every other trade has slices of
 * exactly the same shape sitting open and unclaimed, and had no listing at
 * all. The filter moved into the query string, and the code route is
 * deprecated in favour of `?domain=code&slice_type=github_issue`.
 */

/** One open, unclaimed slice. */
export interface OpenSlice {
	slice_id: string;
	title: string;
	/** The surface the work lives on, as a `slice_types` slug. */
	slice_type: string;
	/** That surface's display name, as the catalogue holds it. */
	slice_type_name: string;
	/**
	 * The trade this is in: the surface's domain, or the slice's own for the
	 * three surfaces that belong to no single trade — an upstream ticket,
	 * documentation and `other` exist in every trade.
	 */
	domain: string;
	/** What comes out of it, where the domain distinguishes kinds. */
	subtype: string | null;
	difficulty: number;
	fragments_reward: number;
	project_slug: string;
	project_name: string;
	/**
	 * Where to read the work before claiming it — the upstream issue, the
	 * repository, the design file, the hosted track. Null when the brief on
	 * the slice is all there is.
	 */
	external_url: string | null;
	orientation_slug: string | null;
	orientation_name: string | null;
	/**
	 * What this domain tags its work with: languages for code, tools for
	 * design, frameworks for AI and security, platforms for game and ops.
	 * Empty rather than invented where the domain has no such notion.
	 */
	tags: string[];
	opened_at: string;
}

export interface OpenSlicesResponse {
	slices: OpenSlice[];
	/** Echoed back so a cached response is self-describing. */
	domain: string | null;
	slice_type: string | null;
	orientation: string | null;
	tag: string | null;
	max_difficulty: number;
}

/**
 * What the pool can be narrowed by.
 *
 * `domain` is one of the platform's twelve and nothing else — the endpoint
 * checks it against `SKILL_DOMAINS` and answers 400 otherwise, which is why
 * it is typed here rather than left a string. `slice_type` is narrower than a
 * domain, which usually holds several surfaces, and an unknown one answers
 * 404 rather than an empty pool: "nothing is open in design" and "that is not
 * how the surface is spelled" are different answers.
 */
export interface OpenSlicesQuery {
	domain?: string;
	slice_type?: string;
	orientation?: string;
	tag?: string;
	/** Hardest difficulty to include, 1..5. The server defaults to 3. */
	max_difficulty?: number;
	/** 1..100. The server defaults to 30. */
	limit?: number;
}
