/**
 * Declared portfolios on platforms the backend keeps a table of.
 *
 * ## Which of the two portfolio paths this is
 *
 * There are two, and picking the wrong one is the mistake this comment exists
 * to prevent.
 *
 * `portfolio_platforms` — this module — is a curated table with a
 * `skill_domain` per row, seeded for code, ops, security, quality, education,
 * communication and leadership. **It has no design rows and is not meant to.**
 *
 * A designer's Behance, Dribbble, ArtStation, Vimeo or foundry page is an
 * **external signal** (`$api/external_signals`), and migration 0241 explains
 * the split at length: those providers are confirmed by a moderator rather
 * than fetched, because Behance's public API was withdrawn in 2020 and an
 * "import" built on either would mean the backend issuing requests to
 * arbitrary user-supplied URLs.
 *
 * So the design programme's P-01/P-02 surfaces call external signals, and this
 * module serves the other domains — including a designer who also ships code.
 *
 * ## What both paths share
 *
 * `figures_are_declared` is the field the UI is built around. The counts are
 * the person's own word, every surface rendering one says so, and nothing here
 * ever feeds a craft score, a rank or a search ranking. A declared portfolio
 * is context; only a Skilluv validation is a proof.
 */

import type {
	ApiResponse,
	DeclarePortfolioRequest,
	PortfolioDeclaration,
	PortfolioPlatform
} from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export const portfoliosApi = {
	/**
	 * Platforms the backend knows, optionally narrowed to one domain.
	 *
	 * Always pass a domain on a per-domain form: the table is cross-domain, and
	 * offering somebody a Terraform Registry row on a portfolio form is how a
	 * form stops being read. Filtering on `design` returns nothing — see the
	 * module note.
	 */
	platforms(domain?: string) {
		return api.get<ApiResponse<PortfolioPlatform[]>>('/portfolio-platforms', { domain });
	},

	/** The caller's own declarations. */
	mine(domain?: string) {
		return api.get<ApiResponse<PortfolioDeclaration[]>>('/portfolios', { domain });
	},

	/**
	 * Declare a portfolio.
	 *
	 * The figures are optional and stay optional: somebody who does not want
	 * to state a follower count should not have to invent one to link their
	 * work.
	 */
	declare(payload: DeclarePortfolioRequest) {
		return api.post<ApiResponse<PortfolioDeclaration>>('/portfolios', payload);
	},

	/** Remove a declaration. */
	drop(id: string) {
		return api.delete<void>(`/portfolios/${id}`);
	}
};

/**
 * Someone's public portfolio document, by username.
 *
 * A separate, unauthenticated endpoint that serves the whole public record as
 * one JSON file — what a CV generator or another platform would read. Not the
 * same thing as the declarations above, which are the links somebody added.
 */
export function publicPortfolio(username: string) {
	return api.get<unknown>(`/users/${encodeURIComponent(username)}/portfolio.json`);
}

/**
 * The URL of somebody's rank badge, for embedding.
 *
 * An SVG served by the backend, so this returns an address rather than
 * fetching: an `<img>` renders it and a README links to it.
 */
export function badgeUrl(username: string, baseUrl = '/api'): string {
	return `${baseUrl}/users/${encodeURIComponent(username)}/badge.svg`;
}

/**
 * Fill a platform's `profile_url_pattern` with a handle.
 *
 * Returns null when the platform declares no pattern, which is the signal to
 * ask for the full URL instead of building one. Guessing a URL shape for a
 * platform that never stated one produces links that 404 on the profile of
 * whoever trusted the form.
 */
export function profileUrlFor(platform: PortfolioPlatform, handle: string): string | null {
	if (!platform.profile_url_pattern) return null;
	const trimmed = handle.trim().replace(/^@/, '');
	if (!trimmed) return null;
	return platform.profile_url_pattern.replace('{handle}', encodeURIComponent(trimmed));
}
