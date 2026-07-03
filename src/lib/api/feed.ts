import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

// --- Types ---

export type FeedEventKind =
	| 'submission_evaluated'
	| 'challenge_created'
	| 'level_up'
	| 'badge_earned'
	| 'guild_joined'
	| 'guild_war_won'
	| 'forum_post_created'
	| 'tournament_registered'
	| 'follow_started';

export interface FeedEvent {
	id: string;
	kind: FeedEventKind;
	actor_id: string;
	actor_username?: string;
	actor_display_name?: string;
	target_type?: string;
	target_id?: string;
	title?: string;
	body?: string;
	metadata?: Record<string, unknown>;
	created_at: string;
}

// --- API ---

export const feedApi = {
	me(params?: { page?: number; per_page?: number }) {
		return api.get<ApiResponse<{ events: FeedEvent[] }>>('/feed/me', params as Record<string, number>);
	}
};
