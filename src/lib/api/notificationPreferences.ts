import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

/** The three channels, in the order the screen presents them. */
export const CHANNELS = ['in_app', 'push', 'email'] as const;
export type Channel = (typeof CHANNELS)[number];

/**
 * One notification kind, with the caller's effective settings.
 *
 * "Effective" means: their stored choice, else the catalogue default. The
 * backend merges the two, so the screen never has to tell "never touched"
 * apart from "deliberately left as is".
 */
export interface KindPreference {
	/** Dotted identifier: `social.mention`, `payout.sent`. */
	kind: string;
	/** Display grouping: `payments`, `social`, `guild`. */
	category: string;
	/** Title, translated into the caller's language. */
	label: string;
	/**
	 * Channels this kind can use. A channel missing from here cannot be
	 * turned on whatever the request says, so the screen must not show a
	 * toggle for it.
	 */
	available_channels: Channel[];
	in_app: boolean;
	push: boolean;
	email: boolean;
	/**
	 * Cannot be turned off. Show it as fixed rather than as a toggle that
	 * springs back: a failed transfer goes out regardless, and pretending
	 * otherwise is a lie.
	 */
	transactional: boolean;
}

/** Partial update: only the channels supplied are touched. */
export interface PreferenceUpdate {
	kind: string;
	in_app?: boolean;
	push?: boolean;
	email?: boolean;
}

export interface UpdateResult {
	updated: number;
	/**
	 * Rejected, with the reason. The backend reports them instead of
	 * ignoring them: a screen showing a toggle move when the server did
	 * nothing is worse than an error.
	 */
	rejected: string[];
}

/** Quiet window. Both bounds or neither, and a timezone with them. */
export interface QuietHours {
	start: number | null;
	end: number | null;
	/** IANA name, e.g. `Africa/Porto-Novo`. */
	timezone: string | null;
}

export const notificationPreferencesApi = {
	/**
	 * GET /users/me/notification-preferences
	 *
	 * Also returns the quiet window. It travels here rather than on an
	 * endpoint of its own: it could be written and never read back, so the
	 * screen started from the defaults and overwrote the person's choice on
	 * the first save.
	 */
	list(): Promise<{ data: { preferences: KindPreference[]; quiet_hours: QuietHours } }> {
		return api.get<{ data: { preferences: KindPreference[]; quiet_hours: QuietHours } }>(
			'/users/me/notification-preferences'
		);
	},

	/** PUT /users/me/notification-preferences */
	update(preferences: PreferenceUpdate[]): Promise<{ data: UpdateResult }> {
		return api.put<{ data: UpdateResult }>('/users/me/notification-preferences', {
			preferences
		});
	},

	/**
	 * PUT /users/me/notification-preferences/reset — back to defaults.
	 *
	 * The backend deletes the overrides instead of writing the defaults:
	 * the absence of a row *is* the default, and a row storing a default
	 * can no longer be told apart from a deliberate choice.
	 */
	reset(): Promise<ApiResponse<{ cleared: number }>> {
		return api.put<ApiResponse<{ cleared: number }>>(
			'/users/me/notification-preferences/reset',
			{}
		);
	},

	/**
	 * PUT /users/me/quiet-hours
	 *
	 * `start` and `end` both `null` clear the window. The timezone survives
	 * that: it belongs to the person, not to the window.
	 */
	setQuietHours(body: {
		start: number | null;
		end: number | null;
		timezone: string | null;
	}): Promise<ApiResponse<QuietHours>> {
		return api.put<ApiResponse<QuietHours>>('/users/me/quiet-hours', body);
	}
};
