import type { ApiResponse, PublicVouching, Vouching, VouchingStake } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

/** Longest and shortest windows the backend accepts, mirrored for form validation. */
export const VOUCHING_MIN_WINDOW_DAYS = 30;
export const VOUCHING_MAX_WINDOW_DAYS = 365;
export const VOUCHING_DEFAULT_WINDOW_DAYS = 180;

export interface CreateVouchingRequest {
	vouched_id: string;
	/** 30..365, defaults to 180 server-side. */
	window_days?: number;
	/**
	 * `rank_temporary` puts the voucher's own rank at stake for 90 days if
	 * the vouching is broken; `reputation_only` is a public statement with no
	 * rank consequence.
	 */
	at_stake_kind?: VouchingStake;
	/** Public justification, shown on the vouched user's profile. */
	statement?: string;
}

/** What a moderator's break did to the voucher, reported back for the audit trail. */
export interface VouchingBreakReport {
	vouching: Vouching;
	penalty_applied: boolean;
	voucher_rank_before: string;
	voucher_rank_effective: string;
	penalty_until: string | null;
}

export const vouchingsApi = {
	create(payload: CreateVouchingRequest) {
		return api.post<ApiResponse<{ vouching: Vouching }>>('/vouchings', payload);
	},

	/** The voucher pulling their own backing before it expires. */
	withdraw(id: string) {
		return api.delete<void>(`/vouchings/${id}`);
	},

	/** Live vouchings backing a profile, voucher identity resolved. */
	forUser(userId: string) {
		return api.get<ApiResponse<{ vouchings: PublicVouching[]; count: number }>>(
			`/users/${userId}/vouchings`
		);
	},

	listMine() {
		return api.get<ApiResponse<{ given: Vouching[]; received: Vouching[]; max_live: number }>>(
			'/users/me/vouchings'
		);
	},

	/** Moderation only: breaking a vouching costs the voucher a rank for 90 days. */
	breakVouching(id: string, reason: string) {
		return api.post<ApiResponse<VouchingBreakReport>>(`/moderation/vouchings/${id}/break`, {
			reason
		});
	}
};
