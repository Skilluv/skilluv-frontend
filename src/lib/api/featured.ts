/**
 * Who the platform puts forward, week by week.
 *
 * P-03's "featured designer of the week", and the same endpoint for every
 * other domain. Public, because — in the backend's words — a featuring nobody
 * can read is a distinction nobody can check.
 *
 * ## Nothing here posts anything
 *
 * The backend serves a `card` with everything a social post needs and stops
 * there, deliberately:
 *
 * > Publishing somebody's name and work to a third-party platform on a
 * > schedule, with no human between the decision and the post, is not a
 * > feature.
 *
 * So this module reads. The half of P-03 that says "publication réseaux
 * sociaux" is a person pressing send, and the card is what they send.
 */

import type { ApiResponse, FeaturedTalent } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export const featuredApi = {
	/** This week's pick for a domain, or null between weeks. */
	current(domain: string) {
		return api.get<ApiResponse<{ featured: FeaturedTalent | null }>>(
			`/featured/${encodeURIComponent(domain)}`
		);
	},

	/**
	 * The recent picks, newest first.
	 *
	 * The history is the point as much as the current week: one featured name
	 * is an editorial whim, a run of them is a record somebody can audit for
	 * who never gets picked.
	 */
	recent(domain: string, limit?: number) {
		return api.get<ApiResponse<{ featured: FeaturedTalent[] }>>(
			`/featured/${encodeURIComponent(domain)}/recent`,
			{ limit }
		);
	}
};
