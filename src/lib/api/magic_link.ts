import type { UserPrivate, ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export interface MagicLinkRequestResponse {
	sent: boolean;
	expires_in_minutes: number;
}

export interface MagicLinkConsumeResponse {
	user_id: string;
	user?: UserPrivate;
}

export const magicLinkApi = {
	/** Envoie un lien magique par email. Toujours 200 (anti-enumeration). */
	request(email: string, intent: 'login' | 'signup' = 'login') {
		return api.post<ApiResponse<MagicLinkRequestResponse>>('/auth/magic-link/request', {
			email,
			intent
		});
	},

	/** Consomme le token du lien magique et connecte le user. */
	consume(token: string) {
		return api.post<ApiResponse<MagicLinkConsumeResponse>>('/auth/magic-link/consume', { token });
	}
};
