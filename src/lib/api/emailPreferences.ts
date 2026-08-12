import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

/**
 * Opt-in/opt-out email categories. Transactional mail (address verification,
 * password reset, security alerts, payment receipts) is never listed here and
 * cannot be disabled.
 *
 * Contract: docs/SPEC-MENTIONS-EMAIL-PREFERENCES.md section 2.
 */
export interface EmailPreferences {
	digest_weekly: boolean;
	streak_reminder: boolean;
	marketing: boolean;
	updated_at?: string;
}

/** Full replacement, not a partial patch: all three booleans are required. */
export interface UpdateEmailPreferencesBody {
	digest_weekly: boolean;
	streak_reminder: boolean;
	marketing: boolean;
}

/** Defaults served when the user has never touched their preferences. */
export const EMAIL_PREFERENCE_DEFAULTS: UpdateEmailPreferencesBody = {
	digest_weekly: true,
	streak_reminder: true,
	marketing: false
};

export const emailPreferencesApi = {
	/** GET /users/me/email-preferences */
	get(): Promise<ApiResponse<EmailPreferences>> {
		return api.get<ApiResponse<EmailPreferences>>('/users/me/email-preferences');
	},

	/** PUT /users/me/email-preferences */
	update(body: UpdateEmailPreferencesBody): Promise<ApiResponse<EmailPreferences>> {
		return api.put<ApiResponse<EmailPreferences>>('/users/me/email-preferences', body);
	}
};
