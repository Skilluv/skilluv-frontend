import type {
	ApiResponse,
	PublicVouching,
	Vouching,
	VouchingQueueRow,
	VouchingQueueStatus,
	VouchingStake,
	VouchingWithParty
} from '$lib/types';
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

export interface VouchingQueueParams {
	/** Defaults to `live` server-side. */
	status?: VouchingQueueStatus;
	voucher_id?: string;
	vouched_id?: string;
	at_stake_kind?: VouchingStake;
	limit?: number;
	offset?: number;
}

export interface VouchingQueueResponse {
	vouchings: VouchingQueueRow[];
	status: VouchingQueueStatus;
	total: number;
	limit: number;
	offset: number;
}

/** At least this many characters, or the break is refused server-side. */
export const VOUCHING_BREAK_REASON_MIN = 8;

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

	/**
	 * Both buckets, each row carrying the other party resolved (SKI-301).
	 * `given` keeps the whole history including broken ones; `received` is
	 * live only, the same set a visitor sees on the profile.
	 */
	listMine() {
		return api.get<
			ApiResponse<{
				given: VouchingWithParty[];
				received: VouchingWithParty[];
				max_live: number;
			}>
		>('/users/me/vouchings');
	},

	/**
	 * Moderation queue (SKI-297) — the listing the break endpoint always
	 * needed. Same gate as the break itself: a moderator who may end a
	 * vouching may read the list of them.
	 */
	moderationQueue(params: VouchingQueueParams = {}) {
		return api.get<ApiResponse<VouchingQueueResponse>>('/moderation/vouchings', {
			...params
		});
	},

	/** Moderation only: breaking a vouching costs the voucher a rank for 90 days. */
	breakVouching(id: string, reason: string) {
		return api.post<ApiResponse<VouchingBreakReport>>(`/moderation/vouchings/${id}/break`, {
			reason
		});
	}
};
