import type { ApiResponse, SavedTargetType, UserNote } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export interface ListNotesParams {
	target_type?: SavedTargetType;
	limit?: number;
	offset?: number;
}

export const userNotesApi = {
	/**
	 * Upsert the note on one target. The body must hold 1..1000 characters
	 * after trimming — an all-whitespace body is rejected rather than
	 * silently deleting, because deleting is its own verb.
	 */
	upsert(targetType: SavedTargetType, targetId: string, body: string) {
		return api.put<ApiResponse<{ note: UserNote }>>(`/users/me/notes/${targetType}/${targetId}`, {
			body
		});
	},

	/** A missing note is a 200 with `note: null`, so the editor opens empty. */
	fetch(targetType: SavedTargetType, targetId: string) {
		return api.get<ApiResponse<{ note: UserNote | null }>>(
			`/users/me/notes/${targetType}/${targetId}`
		);
	},

	remove(targetType: SavedTargetType, targetId: string) {
		return api.delete<void>(`/users/me/notes/${targetType}/${targetId}`);
	},

	listMine(params?: ListNotesParams) {
		return api.get<ApiResponse<{ notes: UserNote[]; limit: number; offset: number }>>(
			'/users/me/notes',
			params as Record<string, string | number | undefined>
		);
	}
};
