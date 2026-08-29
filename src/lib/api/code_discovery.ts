/**
 * Ways into code work: first issues, ecosystems, tiers, and what languages
 * people actually ship in.
 *
 * ## `first-issues` is the one that matters most
 *
 * It is the list somebody with no contributions reads. Everything else on this
 * platform assumes a record; this is the surface for people who do not have
 * one yet, which is why it is public and why it should never be ranked by
 * anything that rewards existing standing.
 *
 * ## Language figures are counted, not declared
 *
 * `code-languages` and `languages/top` come from synced repositories, unlike
 * the languages somebody types on their profile. Two different claims that
 * happen to use the same word — a surface showing both must not put them in
 * one list.
 */

import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export const codeDiscoveryApi = {
	/** Issues suitable for a first contribution. Public. */
	firstIssues(params?: { language?: string; limit?: number }) {
		return api.get<ApiResponse<{ issues: unknown[] }>>('/code/first-issues', params);
	},

	/** Language ecosystems and what is happening in them. */
	ecosystems() {
		return api.get<ApiResponse<{ ecosystems: unknown[] }>>('/code/ecosystems');
	},

	/** The tier ladder the code record uses. */
	tiers() {
		return api.get<ApiResponse<{ tiers: unknown[] }>>('/code/tiers');
	},

	/** What somebody actually ships in, counted from synced repositories. */
	userLanguages(username: string) {
		return api.get<ApiResponse<{ languages: unknown[] }>>(
			`/users/${encodeURIComponent(username)}/code-languages`
		);
	},

	/** Platform-wide. */
	topLanguages() {
		return api.get<ApiResponse<{ languages: unknown[] }>>('/code/languages/top');
	}
};

export const codePortfoliosApi = {
	/** Declared code portfolios — npm, crates, PyPI and the like. */
	mine() {
		return api.get<ApiResponse<{ portfolios: unknown[] }>>('/users/me/code-portfolios');
	},

	declare(body: Record<string, unknown>) {
		return api.post<ApiResponse<unknown>>('/users/me/code-portfolios', body);
	},

	remove(id: string) {
		return api.delete<void>(`/users/me/code-portfolios/${encodeURIComponent(id)}`);
	}
};
