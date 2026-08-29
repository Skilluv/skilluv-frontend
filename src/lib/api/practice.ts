/**
 * Where somebody practises a trade, and what they practise with.
 *
 * Two listings, both keyed on the domain rather than written once per domain —
 * and the backend's note on why they exist is the reason this module does too:
 *
 * > `external_resources` had two endpoints, `/ai/toolkit` and `/ops/toolkit`,
 * > each with its domain written into the SQL. Six other domains had rows in
 * > that table and no way to read them. `terrain_proposals` — twenty rows
 * > across three domains — had no endpoint at all: the seed migrations were
 * > written, the listing never was, and nothing failed because nothing looked.
 *
 * That was true of the front too until this module: the endpoints existed and
 * nothing called them, which fails exactly as silently.
 *
 * ## A terrain proposal is a shortlist entry, not a terrain
 *
 * It becomes real when a steward takes it, and `adopted` records that. The two
 * write endpoints are the curator's: adopt, pointing at the project whose
 * owner agreed to steward it, or decline **with a reason**, so the next person
 * researching the domain does not propose it again.
 */

import type { ApiResponse, TerrainProposal, ToolkitResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export const practiceApi = {
	/**
	 * The curated tools, courses and communities of a domain, each with what it
	 * costs to reach.
	 *
	 * `access_note` is the field this listing exists for: recommending a tool
	 * somebody cannot afford, or a course that turns out to be paywalled three
	 * lessons in, wastes the week it was meant to save.
	 */
	toolkit(domain: string, params?: { category?: string; orientation?: string }) {
		return api.get<ApiResponse<ToolkitResponse>>(
			`/domains/${encodeURIComponent(domain)}/toolkit`,
			params
		);
	},

	/**
	 * Upstream projects somebody researched as good places to contribute.
	 *
	 * Declined ones are hidden by default. Pass `includeDeclined` on a curator
	 * surface: a refusal with its reason is what stops the same project being
	 * proposed again next quarter.
	 */
	terrains(domain: string, includeDeclined = false) {
		return api.get<ApiResponse<{ terrains: TerrainProposal[] }>>(
			`/domains/${encodeURIComponent(domain)}/terrains`,
			{ include_declined: includeDeclined }
		);
	},

	/** Curator: take a proposal, pointing at the project that will steward it. */
	adopt(domain: string, slug: string, projectSlug: string) {
		return api.post<ApiResponse<unknown>>(
			`/domains/${encodeURIComponent(domain)}/terrains/${encodeURIComponent(slug)}/adopt`,
			{ project_slug: projectSlug }
		);
	},

	/** Curator: refuse it, with the reason that keeps it refused. */
	decline(domain: string, slug: string, reason: string) {
		return api.post<ApiResponse<unknown>>(
			`/domains/${encodeURIComponent(domain)}/terrains/${encodeURIComponent(slug)}/decline`,
			{ reason }
		);
	}
};

/**
 * Toolkit rows grouped by category, in the order the server sent them.
 *
 * Grouping client-side because the response is one flat list: the categories
 * are whatever the table holds, and hardcoding them here would drop a category
 * added server-side without anything failing.
 */
export function groupByCategory(
	resources: ToolkitResponse['resources']
): Map<string, ToolkitResponse['resources']> {
	const grouped = new Map<string, ToolkitResponse['resources']>();
	for (const row of resources) {
		const bucket = grouped.get(row.category);
		if (bucket) bucket.push(row);
		else grouped.set(row.category, [row]);
	}
	return grouped;
}
