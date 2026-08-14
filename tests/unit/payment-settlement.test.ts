import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { paymentsApi, waitForSettlement } from '$lib/api/payments';

/** Queue one status response per call, in order. */
function statusReturns(...states: Array<{ status: string; delivered?: boolean; every?: number }>) {
	const spy = vi.spyOn(paymentsApi, 'status');
	for (const s of states) {
		spy.mockResolvedValueOnce({
			data: {
				status: s.status,
				delivered: s.delivered ?? false,
				poll_after_ms: s.every ?? 3000
			},
			meta: {}
		} as never);
	}
	return spy;
}

describe('waitForSettlement', () => {
	beforeEach(() => vi.restoreAllMocks());
	afterEach(() => vi.restoreAllMocks());

	it('returns as soon as the payment leaves pending', async () => {
		const spy = statusReturns({ status: 'succeeded', delivered: true });
		const out = await waitForSettlement('p1', { sleep: async () => {} });
		expect(out).toEqual({ status: 'succeeded', delivered: true, gaveUp: false });
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it('keeps asking while the payment is pending', async () => {
		const spy = statusReturns(
			{ status: 'pending' },
			{ status: 'pending' },
			{ status: 'succeeded', delivered: true }
		);
		const out = await waitForSettlement('p1', { sleep: async () => {} });
		expect(out.status).toBe('succeeded');
		expect(spy).toHaveBeenCalledTimes(3);
	});

	it('waits the interval the backend asked for', async () => {
		statusReturns({ status: 'pending', every: 7000 }, { status: 'succeeded' });
		const slept: number[] = [];
		await waitForSettlement('p1', {
			sleep: async (ms) => {
				slept.push(ms);
			}
		});
		expect(slept).toEqual([7000]);
	});

	it('never sleeps under a second, whatever the backend sends', async () => {
		// A zero would turn the loop into a request flood against our own
		// rate limits.
		statusReturns({ status: 'pending', every: 0 }, { status: 'succeeded' });
		const slept: number[] = [];
		await waitForSettlement('p1', {
			sleep: async (ms) => {
				slept.push(ms);
			}
		});
		expect(slept).toEqual([1000]);
	});

	it('gives up without calling it a failure', async () => {
		// The distinction matters: presenting a timeout as a failure is what
		// makes someone pay a second time for something already charged.
		vi.spyOn(paymentsApi, 'status').mockResolvedValue({
			data: { status: 'pending', delivered: false, poll_after_ms: 1000 },
			meta: {}
		} as never);
		const out = await waitForSettlement('p1', {
			timeoutMs: 0,
			sleep: async () => {}
		});
		expect(out).toEqual({ status: 'pending', delivered: false, gaveUp: true });
	});

	it('reports a real failure as a failure', async () => {
		statusReturns({ status: 'failed' });
		const out = await waitForSettlement('p1', { sleep: async () => {} });
		expect(out.status).toBe('failed');
		expect(out.gaveUp).toBe(false);
	});

	it('stops when the caller cancels, without asking again', async () => {
		const spy = statusReturns({ status: 'pending' });
		const out = await waitForSettlement('p1', {
			cancelled: () => true,
			sleep: async () => {}
		});
		expect(spy).not.toHaveBeenCalled();
		expect(out.gaveUp).toBe(true);
	});
});
