import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';
import { publicBase } from './origin';

// SKI-120 endpoints served outside the `/api` prefix (opt-in public flow).
// Still the backend's origin, so it follows PUBLIC_API_ORIGIN like the rest.
const publicApi = createApiClient(fetch, publicBase());

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
