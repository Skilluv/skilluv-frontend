import type { InterestRequest, Conversation, Message, ApiResponse, ApiPaginatedResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export const contactApi = {
	// --- Interest Requests ---

	sendInterest(talentId: string, message: string) {
		return api.post<ApiResponse<{ interest_request: InterestRequest; message: string }>>('/contact/interest', {
			talent_id: talentId,
			message
		});
	},

	sentInterests(page?: number, perPage?: number) {
		return api.get<ApiPaginatedResponse<InterestRequest>>('/contact/interest/sent', { page, per_page: perPage });
	},

	receivedInterests(page?: number, perPage?: number) {
		return api.get<ApiPaginatedResponse<InterestRequest>>('/contact/interest/received', { page, per_page: perPage });
	},

	acceptInterest(id: string) {
		return api.post<ApiResponse<{ conversation: Conversation; message: string }>>(`/contact/interest/${id}/accept`);
	},

	declineInterest(id: string) {
		return api.post<ApiResponse<{ message: string }>>(`/contact/interest/${id}/decline`);
	},

	// --- Conversations ---

	listConversations() {
		return api.get<ApiResponse<{ conversations: Conversation[] }>>('/contact/conversations');
	},

	getConversation(id: string, page?: number, perPage?: number) {
		return api.get<ApiResponse<{ conversation: Conversation; messages: Message[] }>>(`/contact/conversations/${id}`, {
			page,
			per_page: perPage
		});
	},

	sendMessage(conversationId: string, content: string) {
		return api.post<ApiResponse<{ message: Message }>>(`/contact/conversations/${conversationId}/messages`, { content });
	},

	// --- Block ---

	blockEnterprise(enterpriseId: string) {
		return api.post<ApiResponse<{ message: string }>>(`/contact/block/${enterpriseId}`);
	},

	unblockEnterprise(enterpriseId: string) {
		return api.delete<ApiResponse<{ message: string }>>(`/contact/block/${enterpriseId}`);
	}
};
