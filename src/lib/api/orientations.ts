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

export const orientationsApi = {
	list() {
		return api.get<ApiResponse<Orientation[]>>('/orientations');
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
