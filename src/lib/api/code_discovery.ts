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

/**
 * The shapes the backend actually returns.
 *
 * These were `unknown[]`, and that is the whole reason the page reading them
 * drifted: it looked for `html_url`, `repository`, `language` and `id` on rows
 * that carry `issue_url`, `project_name`, `languages` and `slice_id`. Every
 * one of those reads was `undefined` at runtime and correct as far as the
 * compiler was concerned, so the issue list rendered titles and nothing else —
 * no link out, no repository, no reward — with no error anywhere.
 *
 * Mirrors `FirstIssueRow`, `EcosystemRow` and `LanguageCount` in
 * `routes/code.rs` and `routes/code_stats.rs`.
 */
export interface FirstIssue {
	/** The slice this issue is served as: where it is claimed and delivered. */
	slice_id: string;
	title: string;
	difficulty: number;
	/** Paid on delivery, through the slices pipeline — not by this module. */
	fragments_reward: number;
	project_slug: string;
	project_name: string;
	/** The upstream issue, so it can be read before anything is claimed. */
	issue_url: string | null;
	orientation_slug: string | null;
	orientation_name: string | null;
	/** The slice's own languages when it names them, else the repo's stack. */
	languages: string[];
	ingested_at: string;
}

export interface FirstIssuesResponse {
	issues: FirstIssue[];
	/** Echoed back so a cached response is self-describing. */
	orientation: string | null;
	language: string | null;
	max_difficulty: number;
}

export interface Ecosystem {
	language: string;
	display_name: string;
	community_url: string;
	summary: string;
}

export interface LanguageCount {
	language: string;
	/** Verified artefacts touching this language, counted from synced repos. */
	artifacts: number;
}

export const codeDiscoveryApi = {
	/** Issues suitable for a first contribution. Public. */
	firstIssues(params?: { language?: string; limit?: number; max_difficulty?: number }) {
		return api.get<ApiResponse<FirstIssuesResponse>>('/code/first-issues', params);
	},

	/** Language ecosystems and what is happening in them. */
	ecosystems() {
		return api.get<ApiResponse<{ ecosystems: Ecosystem[] }>>('/code/ecosystems');
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
		return api.get<ApiResponse<{ languages: LanguageCount[] }>>('/code/languages/top');
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
