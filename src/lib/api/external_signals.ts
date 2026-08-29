import type {
	ApiResponse,
	ExternalSignal,
	ExternalSignalBuckets,
	ExternalSignalProvider
} from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export interface CreateSignalRequest {
	provider: ExternalSignalProvider;
	url: string;
	title: string;
	meta?: Record<string, unknown>;
}

export interface CreateSignalResponse {
	signal: ExternalSignal;
	/**
	 * True when the signal confirmed itself through the existing GitHub OAuth
	 * link, so the client can skip the "pending review" copy.
	 */
	auto_verified: boolean;
}

/**
 * External signals are declared context, never Skilluv proof: they do not
 * feed `weighted_proven_count`, rank promotion or badges. The UI has to keep
 * them visually apart from attestations — the backend even ships a
 * `disclaimer` string in the payload to make the intent unmissable.
 */
/** Below this the backend refuses the removal — it destroys a user claim. */
export const SIGNAL_REJECT_REASON_MIN = 8;

export const externalSignalsApi = {
	create(payload: CreateSignalRequest) {
		return api.post<ApiResponse<CreateSignalResponse>>('/users/me/external-signals', payload);
	},

	listMine() {
		return api.get<ApiResponse<ExternalSignalBuckets>>('/users/me/external-signals');
	},

	remove(id: string) {
		return api.delete<void>(`/users/me/external-signals/${id}`);
	},

	/** Unverified signals show up here too — hiding them would erase the distinction. */
	forUser(userId: string) {
		return api.get<ApiResponse<ExternalSignalBuckets>>(`/users/${userId}/external-signals`);
	},

	/** Moderation queue: signals waiting on a human confirmation. */
	listPending(limit?: number) {
		return api.get<ApiResponse<{ pending: ExternalSignal[] }>>('/moderation/external-signals', {
			limit
		});
	},

	verify(id: string) {
		return api.post<ApiResponse<{ signal: ExternalSignal }>>(
			`/moderation/external-signals/${id}/verify`
		);
	},

	/**
	 * Remove somebody else's declaration. The motive is mandatory and goes
	 * in the query string rather than a body: enough proxies strip DELETE
	 * bodies that a required one would fail in production only.
	 */
	reject(id: string, reason: string) {
		return api.delete<void>(
			`/moderation/external-signals/${id}?reason=${encodeURIComponent(reason)}`
		);
	}
};
