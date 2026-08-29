import type { ApiResponse, Bookmark, BookmarkFolder, SavedTargetType } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export interface CreateBookmarkRequest {
	target_type: SavedTargetType;
	target_id: string;
	/** Slug-shaped, 1..60 chars. Omit to leave the bookmark unfiled. */
	folder_slug?: string;
	/** Free-text reminder, 1000 chars max. */
	notes?: string;
}

export interface ListBookmarksParams {
	target_type?: SavedTargetType;
	/**
	 * A folder slug, or the sentinel `unfiled` for bookmarks that have none.
	 * The backend treats `unfiled` as a NULL check, so a real folder of that
	 * name is shadowed — a trade it makes to keep the filter one flat param.
	 */
	folder_slug?: string;
	limit?: number;
	offset?: number;
}

/** Sentinel understood by `folder_slug` for the no-folder bucket. */
export const UNFILED_FOLDER = 'unfiled';

export const bookmarksApi = {
	create(payload: CreateBookmarkRequest) {
		return api.post<ApiResponse<{ bookmark: Bookmark }>>('/bookmarks', payload);
	},

	/** 204 on success; a bookmark owned by someone else reads as not found. */
	remove(id: string) {
		return api.delete<void>(`/bookmarks/${id}`);
	},

	listMine(params?: ListBookmarksParams) {
		return api.get<ApiResponse<{ bookmarks: Bookmark[]; limit: number; offset: number }>>(
			'/users/me/bookmarks',
			params as Record<string, string | number | undefined>
		);
	},

	/** Folder facets with counts, for a sidebar that needs no full listing. */
	folders() {
		return api.get<ApiResponse<{ folders: BookmarkFolder[] }>>('/users/me/bookmarks/folders');
	}
};
