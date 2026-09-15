import type { ApiResponse, OpenSlicesQuery, OpenSlicesResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

/**
 * The open pool, across every trade.
 *
 * One endpoint for the twelve. `codeDiscoveryApi.firstIssues` calls the
 * deprecated route that answers the same question for code alone — it is
 * `?domain=code&slice_type=github_issue` here, and the backend implements it
 * by calling into this very query.
 *
 * ## Reading the failures
 *
 * A domain the platform does not know answers **400**, and a surface it does
 * not know answers **404**, rather than either returning an empty list.
 * "Nothing is open in design" and "`design_artefact` is not how that is
 * spelled" are different answers, and only one of them tells the caller to
 * fix the request. Surface the message rather than rendering an empty pool
 * over a filter that was never valid.
 */
export const openSlicesApi = {
	/** Open, unclaimed slices on live projects. Public. */
	list(params?: OpenSlicesQuery) {
		return api.get<ApiResponse<OpenSlicesResponse>>(
			'/open-slices',
			params as Record<string, string | number | undefined>
		);
	}
};
