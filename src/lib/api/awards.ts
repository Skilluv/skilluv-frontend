/**
 * The annual awards: an edition, its categories, its nominees and the vote.
 *
 * One module for every domain, because the backend built one. There is no
 * design-specific awards API and there should not be: an edition is a year,
 * and what makes a category a design category is the category, not the route.
 *
 * ## The two-ballot rule
 *
 * A weighted result, not a popular vote. `community_weight` and `jury_weight`
 * sit on the edition and add to a hundred; a juror holds **both** ballots, and
 * casting one does not spend the other. Any surface showing a standing has to
 * show the weights, or it is presenting a number nobody can reproduce.
 *
 * ## The order things happen in
 *
 * `draft` → `nominations` → `voting` → `concluded`, and each verb is refused
 * outside its phase — nominating during voting is a 400, and a vote for a
 * nominee nobody shortlisted is a 400 too. The UI reads `status` and offers
 * the one action that can currently land rather than showing buttons that
 * answer errors.
 */

import type {
	ApiResponse,
	AwardCategory,
	AwardEdition,
	AwardNominee,
	NominateRequest
} from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export const awardsApi = {
	/**
	 * The categories, and what kind of subject each one nominates.
	 *
	 * `domain` narrows to one family's awards plus the platform-wide ones.
	 * Omitting it returns every category, which is what this page had to do
	 * before `award_categories` carried a `skill_domain` at all.
	 */
	categories(domain?: string) {
		return api.get<ApiResponse<{ categories: AwardCategory[] }>>('/awards/categories', { domain });
	},

	/**
	 * One edition: its state, its weights, and every nominee with the running
	 * count behind it.
	 *
	 * Addressed by the year the **work happened in**, not the year the ceremony
	 * is held — the backend is explicit, and getting it wrong is off by one on
	 * every link.
	 */
	edition(year: number) {
		return api.get<ApiResponse<{ edition: AwardEdition; nominees: AwardNominee[] }>>(
			`/awards/${year}`
		);
	},

	/**
	 * Put a piece of work forward, your own included.
	 *
	 * The citation is required, and not as a formality: voters cannot weigh a
	 * name. A nomination with no case made for it is one nobody can act on.
	 */
	nominate(year: number, payload: NominateRequest) {
		return api.post<ApiResponse<{ nominee_id: string }>>(`/awards/${year}/nominations`, payload);
	},

	/**
	 * Vote for a shortlisted nominee.
	 *
	 * `jury: true` casts the jury ballot and needs the `jury_tournament`
	 * capability; a juror also holds a community vote and casting one does not
	 * spend the other, so the two are offered separately rather than as a
	 * toggle that silently picks for them.
	 */
	vote(nomineeId: string, jury = false) {
		return api.post<ApiResponse<{ recorded: boolean; ballot: string }>>(
			// The jury flag rides on the path because `post` takes a body, not
			// params. Written as a suffix so the route itself stays greppable.
			`/awards/nominees/${nomineeId}/vote` + (jury ? '?jury=true' : ''),
			{}
		);
	},

	/**
	 * Fix the shortlist.
	 *
	 * Curators, not administrators: choosing which work belongs on a ballot is
	 * an editorial judgement, and the backend gates it on
	 * `community_curator` rather than on `admin`.
	 */
	shortlist(nomineeIds: string[]) {
		return api.post<ApiResponse<{ shortlisted: number }>>('/awards/nominees/shortlist', {
			nominee_ids: nomineeIds
		});
	}
};

/** The lowest year an edition can exist for, from the CHECK in migration 0190. */
export const FIRST_AWARD_YEAR = 2025;

/**
 * Nominees grouped by category, biggest weighted score first inside each.
 *
 * Grouping here rather than server-side because the endpoint returns one flat
 * list on purpose — a category with no nominee still has to appear on the
 * page, and only the caller holds the category list to notice.
 */
export function groupByCategory(nominees: AwardNominee[]): Map<string, AwardNominee[]> {
	const grouped = new Map<string, AwardNominee[]>();
	for (const nominee of nominees) {
		const bucket = grouped.get(nominee.category_slug);
		if (bucket) bucket.push(nominee);
		else grouped.set(nominee.category_slug, [nominee]);
	}
	for (const bucket of grouped.values()) {
		bucket.sort((a, b) => Number(b.weighted_score) - Number(a.weighted_score));
	}
	return grouped;
}

/**
 * Which single action an edition currently accepts.
 *
 * Returns `null` for `draft` and `concluded`: one is not public and the other
 * does not move. Offering a button in either state would be offering an error.
 */
export function currentAction(edition: AwardEdition): 'nominate' | 'vote' | null {
	if (edition.status === 'nominations') return 'nominate';
	if (edition.status === 'voting') return 'vote';
	return null;
}
