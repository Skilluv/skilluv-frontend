import type { ApiResponse, Guide, GuideKind, GuideSummary } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export interface BrowseGuidesParams {
	/** `code`, `ai`, `audio`… Absent means every domain at once. */
	domain?: string;
	kind?: GuideKind;
	/** Narrows onboarding guides to one family of trades. */
	reviewer_group?: string;
}

/**
 * The locale a guide is asked for.
 *
 * `routes::guides` resolves it from `Accept-Language` and falls back to the
 * next best row rather than hiding a guide that has no translation — the
 * chain is: what you asked for, then English, then French. The client never
 * sent the header, so every reader got the English column of a table that is
 * half French. One header fixes that for the whole surface.
 */
function localeHeaders(locale: string): RequestInit {
	return { headers: { 'Accept-Language': locale } };
}

export const guidesApi = {
	/**
	 * Guides, toolkits and templates on offer, without their bodies.
	 *
	 * There is no `/code/guides`: `content_guides` always carried a
	 * `skill_domain` and the old endpoint ignored it, which mixed an AI
	 * onboarding guide into a code reader's list. One endpoint, one filter.
	 */
	list(locale: string, params?: BrowseGuidesParams) {
		return api.get<ApiResponse<GuideSummary[]>>(
			'/guides',
			params as Record<string, string | undefined>,
			localeHeaders(locale)
		);
	},

	get(locale: string, slug: string) {
		return api.get<ApiResponse<Guide>>(`/guides/${slug}`, undefined, localeHeaders(locale));
	}
};
