import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

/** A way to pay, as the backend offers it in this country. */
export interface PaymentMethod {
	/** Stable identifier, sent back to start the payment. */
	operator: string;
	/** What to show the payer. Operators rename themselves. */
	label: string;
	/**
	 * True when the payer confirms on their phone without leaving the page.
	 * False when they have to be sent to the provider's own form.
	 */
	supports_inline: boolean;
	provider: string;
}

/** Where a payment stands, as of the call. */
export interface PaymentStatus {
	/** `pending`, `succeeded`, `failed`, `refunded`. */
	status: string;
	/**
	 * How long to wait before asking again.
	 *
	 * Sent by the backend rather than guessed here: the right interval is a
	 * property of what it does with the question, and a client that guesses
	 * too low is exactly what gets the merchant account rate-limited.
	 */
	poll_after_ms: number;
	/** True once the counterparty was delivered, not merely charged. */
	delivered: boolean;
}

export const paymentsApi = {
	/**
	 * GET /payments/methods — what this payer can use.
	 *
	 * Without `country`, the backend uses the one on the account. That is
	 * deliberate: the profile only exposes the country's name, not its
	 * code, so having the client map it back would be wrong for every
	 * country spelled two ways.
	 */
	methods(country?: string, currency?: string) {
		return api.get<ApiResponse<PaymentMethod[]>>('/payments/methods', {
			...(country ? { country } : {}),
			...(currency ? { currency } : {})
		});
	},

	/**
	 * POST /payments/{id}/charge — push the prompt to the payer's phone.
	 *
	 * Confirms nothing: the request returns as soon as the prompt is sent.
	 * The payment is confirmed by webhook or by `status`, and closing the
	 * page does not stop either.
	 */
	charge(id: string, body: { operator: string; phone?: string }) {
		return api.post<ApiResponse<{ status: string; message: string }>>(
			`/payments/${id}/charge`,
			body
		);
	},

	/** GET /payments/{id}/status — where the payment got to. */
	status(id: string) {
		return api.get<ApiResponse<PaymentStatus>>(`/payments/${id}/status`);
	}
};

/** What the wait produced, once we stop watching. */
export interface SettlementOutcome {
	/** Last known state. `pending` when we stopped before the answer. */
	status: string;
	delivered: boolean;
	/**
	 * True when we stopped waiting without an answer.
	 *
	 * This is not a failure, and the screen must not present it as one: the
	 * backend keeps asking the provider and keeps delivering, whether this
	 * page is open or not.
	 */
	gaveUp: boolean;
}

/**
 * Ask the backend until the payment leaves `pending`.
 *
 * The cadence comes from the backend, not from here: it is the side that
 * knows how often it can question the provider without being throttled.
 *
 * `sleep` is injectable for tests; nothing else should pass it.
 */
export async function waitForSettlement(
	id: string,
	options: {
		onTick?: (status: PaymentStatus) => void;
		/** Past this, we hand back control. The backend carries on. */
		timeoutMs?: number;
		sleep?: (ms: number) => Promise<void>;
		/** Once true, stop — the person closed the window. */
		cancelled?: () => boolean;
	} = {}
): Promise<SettlementOutcome> {
	const {
		onTick,
		timeoutMs = 5 * 60 * 1000,
		sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms)),
		cancelled = () => false
	} = options;

	const deadline = Date.now() + timeoutMs;
	let last: PaymentStatus = { status: 'pending', poll_after_ms: 3000, delivered: false };

	while (!cancelled()) {
		const res = await paymentsApi.status(id);
		last = res.data;
		onTick?.(last);
		if (last.status !== 'pending') {
			return { status: last.status, delivered: last.delivered, gaveUp: false };
		}
		if (Date.now() >= deadline) break;
		// Never under a second, even if the backend sent zero: a loop with
		// no pause would run into our own rate limits.
		await sleep(Math.max(1000, last.poll_after_ms));
	}

	return { status: last.status, delivered: last.delivered, gaveUp: true };
}
