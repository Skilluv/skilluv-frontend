import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

// --- Types ---

export interface ApiKeyInfo {
	id: string;
	name: string;
	permissions: string[];
	last_used_at: string | null;
	active: boolean;
	created_at: string;
}

export interface WebhookInfo {
	id: string;
	url: string;
	events: string[];
	active: boolean;
	created_at: string;
}

// --- API Keys ---

export const developerApi = {
	createKey(name: string, permissions?: string[]) {
		return api.post<ApiResponse<{ key: ApiKeyInfo; secret: string; message: string }>>('/developer/keys', { name, permissions });
	},

	listKeys() {
		return api.get<ApiResponse<{ keys: ApiKeyInfo[] }>>('/developer/keys');
	},

	deleteKey(id: string) {
		return api.delete<ApiResponse<{ message: string }>>(`/developer/keys/${id}`);
	},

	regenerateKey(id: string) {
		return api.post<ApiResponse<{ secret: string; message: string }>>(`/developer/keys/${id}/regenerate`);
	},

	keyUsage(id: string) {
		return api.get<ApiResponse<{ key_id: string; name: string; request_count: number; last_used_at: string | null; active: boolean }>>(`/developer/keys/${id}/usage`);
	},

	// --- Webhooks ---

	createWebhook(url: string, events: string[]) {
		return api.post<ApiResponse<{ webhook: WebhookInfo; secret: string; message: string }>>('/developer/webhooks', { url, events });
	},

	listWebhooks() {
		return api.get<ApiResponse<{ webhooks: WebhookInfo[] }>>('/developer/webhooks');
	},

	updateWebhook(id: string, data: { url?: string; events?: string[]; active?: boolean }) {
		return api.put<ApiResponse<{ webhook: WebhookInfo }>>(`/developer/webhooks/${id}`, data);
	},

	deleteWebhook(id: string) {
		return api.delete<ApiResponse<{ message: string }>>(`/developer/webhooks/${id}`);
	},

	testWebhook(id: string) {
		return api.post<ApiResponse<{ message: string }>>(`/developer/webhooks/${id}/test`);
	}
};
