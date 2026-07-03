import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

// --- Types ---

export interface ForumCategory {
	id: string;
	slug: string;
	name: string;
	description: string | null;
	post_count?: number;
}

export type PostKind = 'question' | 'discussion' | 'announcement';
export type PostSort = 'recent' | 'hot' | 'top-bounty';

export interface ForumPost {
	id: string;
	category_id: string;
	category_slug?: string;
	category_name?: string;
	author_id: string;
	author_username?: string;
	author_display_name?: string;
	kind: PostKind;
	title: string;
	body: string;
	bounty_fragments: number;
	accepted_answer_id: string | null;
	pinned: boolean;
	locked: boolean;
	comment_count: number;
	reaction_count?: number;
	created_at: string;
	updated_at: string;
}

// --- API ---

export const forumApi = {
	categories() {
		return api.get<ApiResponse<{ categories: ForumCategory[] }>>('/forum/categories');
	},

	listPosts(params?: { category?: string; kind?: PostKind; sort?: PostSort; page?: number; per_page?: number }) {
		return api.get<ApiResponse<{ posts: ForumPost[] }>>('/forum/posts', params as Record<string, string | number>);
	},

	get(id: string) {
		return api.get<ApiResponse<{ post: ForumPost; comments: unknown[] }>>(`/forum/posts/${id}`);
	},

	create(data: { category_slug: string; kind: PostKind; title: string; body: string; bounty_fragments?: number }) {
		return api.post<ApiResponse<{ post: ForumPost }>>('/forum/posts', data);
	},

	edit(id: string, data: { title?: string; body?: string }) {
		return api.put<ApiResponse<{ post: ForumPost }>>(`/forum/posts/${id}`, data);
	},

	remove(id: string) {
		return api.delete<ApiResponse<{ deleted: boolean }>>(`/forum/posts/${id}`);
	},

	acceptAnswer(postId: string, commentId: string) {
		return api.post<ApiResponse<{ accepted: boolean }>>(`/forum/posts/${postId}/accept-answer`, { comment_id: commentId });
	},

	search(query: string) {
		return api.get<ApiResponse<{ posts: ForumPost[] }>>('/forum/search', { q: query });
	}
};
