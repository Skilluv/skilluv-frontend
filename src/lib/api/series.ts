/**
 * Contests that belong together.
 *
 * The backend's answer to two design tickets that read as separate formats:
 * the annual **Design Awards** (C-04) — thirteen contests judged in parallel
 * and read as one event — and **design sprints** (C-05) — one short contest,
 * repeated, where the series is the run of them.
 *
 * Migration 0249 makes the argument for not building either as its own
 * feature: two bespoke features would have shipped two tables, two sets of
 * routes and two definitions of "who won overall", and the third format
 * somebody thinks of next year would have been a third.
 *
 * ## What a series is not
 *
 * Not a season — `seasons` is a period the whole platform is in, which every
 * tournament belongs to whether it wants to or not. A series is opt-in and
 * narrow: thirteen contests out of the fifty running that month.
 *
 * Not a bracket either. Contests in a series do not feed each other; they are
 * read together, not played through.
 *
 * ## Why `kind` matters to a client
 *
 * An edition's page lists thirteen podiums; a sprint's lists one, plus the
 * last few sprints. The kind is stored precisely so one set of routes serves
 * both without a client guessing from the number of contests.
 */

import type { ApiResponse, CategoryStanding, TournamentSeries } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

/** The three shapes a series can take. */
export const SERIES_KINDS = ['awards_edition', 'sprint', 'programme'] as const;

export type SeriesKind = (typeof SERIES_KINDS)[number];

export const seriesApi = {
	/**
	 * Every series, newest first.
	 *
	 * `limit` is enforced rather than clamped server-side: asking for zero rows
	 * and getting twenty-five means the caller was ignored, and silently
	 * ignoring a parameter is how a paginating client breaks. So callers pass
	 * a value in 1..100 or none at all.
	 */
	list(params?: { kind?: string; limit?: number }) {
		return api.get<ApiResponse<{ series: TournamentSeries[] }>>('/series', params);
	},

	/** One series, without its standings. */
	get(slug: string) {
		return api.get<ApiResponse<{ series: TournamentSeries }>>(
			`/series/${encodeURIComponent(slug)}`
		);
	},

	/**
	 * Every category of a series and its podium.
	 *
	 * The podium lines carry `username` and `display_name`, unlike a bare
	 * tournament leaderboard — so a series result can name its winners, which
	 * is the whole point of reading thirteen contests as one event.
	 */
	standings(slug: string) {
		return api.get<ApiResponse<{ series: TournamentSeries; categories: CategoryStanding[] }>>(
			`/series/${encodeURIComponent(slug)}/standings`
		);
	}
};

/**
 * Whether a series is running right now.
 *
 * Read from the dates rather than from a status the table does not carry: a
 * series is a window, and the window is the only thing that says so.
 */
export function isRunning(series: TournamentSeries, now = new Date()): boolean {
	const t = now.getTime();
	return new Date(series.starts_at).getTime() <= t && new Date(series.ends_at).getTime() > t;
}
