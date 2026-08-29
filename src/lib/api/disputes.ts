import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

/** Which side of a dispute the caller is on. The two have different moves. */
export type DisputeRole = 'payer' | 'recipient';

/**
 * A frozen payment, and the account each side gives of it.
 *
 * `open` means the recipient has not answered yet; `contested` means they
 * disagreed and an operator has to decide; `refunded` and `released` are
 * the two ends.
 */
export interface Dispute {
	id: string;
	status: 'open' | 'contested' | 'refunded' | 'released' | 'withdrawn';
	/** What the payer says went wrong, in their own words. */
	reason: string;
	/** The recipient's account, once they have contested. */
	recipient_response: string | null;
	/** What the operator decided, and why. Both sides read it. */
	resolution_note: string | null;
	/** What the payment was for: `mentorship_session`, `bounty_slice`. */
	subject_type: string;
	subject_id: string;
	/** Decimal string. Never a float — money does not survive one. */
	amount: string;
	currency: string;
	created_at: string;
	resolved_at: string | null;
	viewer_role: DisputeRole;
}

export const disputesApi = {
	/** GET /disputes — every dispute the caller is party to, either side. */
	list() {
		return api.get<ApiResponse<Dispute[]>>('/disputes');
	},

	/**
	 * POST /disputes — freeze the payment and ask the recipient to answer.
	 *
	 * Only the person who paid can do this, and only inside the release
	 * window: past it the money has already gone.
	 */
	raise(body: { subject_type: string; subject_id: string; reason: string }) {
		return api.post<ApiResponse<{ dispute_id: string }>>('/disputes', body);
	},

	/** POST /disputes/{id}/concede — the recipient agrees; the payer is refunded. */
	concede(id: string) {
		return api.post<ApiResponse<{ status: string }>>(`/disputes/${id}/concede`);
	},

	/** POST /disputes/{id}/contest — the recipient disagrees; a human decides. */
	contest(id: string, response: string) {
		return api.post<ApiResponse<{ status: string }>>(`/disputes/${id}/contest`, { response });
	},

	/** POST /disputes/{id}/withdraw — the payer drops it; the money is released. */
	withdraw(id: string) {
		return api.post<ApiResponse<{ status: string }>>(`/disputes/${id}/withdraw`);
	}
};
