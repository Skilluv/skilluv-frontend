import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

// SKI-120 endpoints hors /api (opt-in public)
const publicApi = createApiClient(fetch, '');

// --- Types ---

export interface SubscribePayload {
	github_login: string;
	email: string;
	repos: string[];
}

export interface SubscribeResponse {
	pending: boolean;
	message: string;
}

export interface ConfirmResponse {
	confirmed: boolean;
	email: string;
}

export interface UnsubscribeResponse {
	unsubscribed: boolean;
	email: string;
}

// --- API ---

export const maintainerDigestApi = {
	subscribe(payload: SubscribePayload) {
		return publicApi.post<ApiResponse<SubscribeResponse>>(
			'/maintainer-digest/subscribe',
			payload
		);
	},

	confirm(token: string) {
		return publicApi.get<ApiResponse<ConfirmResponse>>(
			`/maintainer-digest/confirm/${encodeURIComponent(token)}`
		);
	},

	unsubscribe(token: string) {
		return publicApi.get<ApiResponse<UnsubscribeResponse>>(
			`/maintainer-digest/unsubscribe/${encodeURIComponent(token)}`
		);
	}
};
