import type {
	ApiResponse,
	Orientation,
	OrientationMode,
	OrientationPlaylistItem,
	UserOrientation
} from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export interface RegisterOrientationRequest {
	orientation_slug: string;
	mode: OrientationMode;
	is_primary?: boolean;
	working_languages?: string[];
	timezone?: string;
	notes?: string;
}

export interface PatchOrientationRequest {
	mode?: OrientationMode;
	is_primary?: boolean;
	working_languages?: string[];
	timezone?: string;
	notes?: string;
	ended_at?: string | null;
}

/**
 * Reading the catalogue.
 *
 * The parameters are not optional in practice, whatever the type says: the
 * backend defaults `limit` to 50 and caps it at 200, while the seeded
 * catalogue is around 255 trades. A call with no query returns a fifth of the
 * catalogue and says nothing about it — which is exactly what this file used
 * to do. Ask for one domain at a time (the largest, `code`, holds 73) and the
 * cap stops being a trap. See SKI-364.
 */
export interface OrientationCatalogQuery {
	domain?: string;
	tag?: string;
	limit?: number;
	offset?: number;
}

function catalogQuery(params?: OrientationCatalogQuery): string {
	if (!params) return '';
	const search = new URLSearchParams();
	if (params.domain) search.set('domain', params.domain);
	if (params.tag) search.set('tag', params.tag);
	if (params.limit !== undefined) search.set('limit', String(params.limit));
	if (params.offset !== undefined) search.set('offset', String(params.offset));
	const qs = search.toString();
	return qs ? `?${qs}` : '';
}

/**
 * What `GET /orientations` actually returns.
 *
 * It was typed here as a bare `Orientation[]`, and it never was one: the
 * handler answers `{ orientations, pagination, total }` and has since PR #40.
 * Every caller doing `res.data` was holding an object and iterating nothing,
 * with no error anywhere — `data` was `unknown`-shaped enough for TypeScript
 * to stay quiet, and an empty catalogue renders as an empty catalogue.
 */
export interface OrientationsCatalogResponse {
	orientations: Orientation[];
	pagination: { limit: number; offset: number };
	/**
	 * Rows matching the filter, not rows on this page.
	 *
	 * The catalogue is ~255 entries and `limit` caps at 200, so the whole of it
	 * never fits one response and the default page of 50 handed back a fifth
	 * with nothing saying so. This is the only way to know something is missing.
	 */
	total: number;
}

export interface OrientationDomainCount {
	domain: string;
	total: number;
}

export interface OrientationCountsResponse {
	/** Every domain holding at least one curated orientation, largest first. */
	domains: OrientationDomainCount[];
	total: number;
}

export const orientationsApi = {
	list(params?: OrientationCatalogQuery) {
		return api.get<ApiResponse<OrientationsCatalogResponse>>(
			`/orientations${catalogQuery(params)}`
		);
	},

	/**
	 * How many trades each discipline holds, in one call.
	 *
	 * The alternative was one `list()` per domain read only for its length:
	 * eleven requests pulling up to 2 200 rows to end up with eleven numbers,
	 * on the first screen after "start". Archived trades are never counted and
	 * the endpoint takes no parameter at all, refusing any that is given.
	 *
	 * The path is `/orientation-counts`, not `/orientations/counts`: the latter
	 * collides with `/orientations/{slug}`, which accepts a free-form slug.
	 */
	counts() {
		return api.get<ApiResponse<OrientationCountsResponse>>('/orientation-counts');
	},

	detail(slug: string) {
		return api.get<ApiResponse<Orientation>>(`/orientations/${slug}`);
	},

	myOrientations() {
		return api.get<ApiResponse<UserOrientation[]>>('/users/me/orientations');
	},

	register(payload: RegisterOrientationRequest) {
		return api.post<ApiResponse<UserOrientation>>('/users/me/orientations', payload);
	},

	patch(slug: string, payload: PatchOrientationRequest) {
		return api.patch<ApiResponse<UserOrientation>>(`/users/me/orientations/${slug}`, payload);
	},

	end(slug: string) {
		return api.delete<ApiResponse<{ ended: boolean }>>(`/users/me/orientations/${slug}`);
	},

	playlist(slug: string) {
		return api.get<ApiResponse<OrientationPlaylistItem[]>>(
			`/users/me/orientations/${slug}/playlist`
		);
	},

	forUser(userId: string) {
		return api.get<ApiResponse<UserOrientation[]>>(`/users/${userId}/orientations`);
	}
};
