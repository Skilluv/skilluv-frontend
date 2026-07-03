import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

// --- Types ---

export interface DmConversation {
	id: string;
	other_user_id: string;
	other_username: string;
	other_display_name: string;
	last_message_preview: string | null;
	last_message_at: string | null;
	unread_count: number;
	created_at: string;
}

export interface DmMessage {
	id: string;
	conversation_id: string;
	sender_id: string;
	body: string;
	created_at: string;
	read_at: string | null;
}

// --- API ---

export const dmApi = {
	listConversations() {
		return api.get<ApiResponse<{ conversations: DmConversation[] }>>('/dm/conversations');
	},

	openConversation(otherUserId: string) {
		return api.post<ApiResponse<{ conversation: DmConversation }>>('/dm/conversations', {
			other_user_id: otherUserId
		});
	},

	getMessages(conversationId: string, params?: { before?: string; limit?: number }) {
		return api.get<ApiResponse<{ messages: DmMessage[] }>>(
			`/dm/conversations/${conversationId}/messages`,
			params as Record<string, string | number>
		);
	},

	sendMessage(conversationId: string, body: string) {
		return api.post<ApiResponse<{ message: DmMessage }>>(`/dm/conversations/${conversationId}/messages`, { body });
	},

	markRead(conversationId: string) {
		return api.post<ApiResponse<{ read: boolean }>>(`/dm/conversations/${conversationId}/read`);
	},

	blockUser(otherUserId: string) {
		return api.post<ApiResponse<{ blocked: boolean }>>('/dm/blocks', { other_user_id: otherUserId });
	},

	unblockUser(otherUserId: string) {
		return api.delete<ApiResponse<{ unblocked: boolean }>>(`/dm/blocks/${otherUserId}`);
	},

	listBlocks() {
		return api.get<ApiResponse<{ blocks: Array<{ user_id: string; username: string; blocked_at: string }> }>>(
			'/dm/blocks'
		);
	}
};
