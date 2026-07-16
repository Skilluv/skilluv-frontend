import { describe, it, expect, vi } from 'vitest';
import { createApiClient, SkilluError } from '../../src/lib/api/client';

function ok() {
	return {
		ok: true,
		status: 200,
		json: () => Promise.resolve({ data: {} })
	};
}

describe('client retry policy', () => {
	it('retries a GET that throws a network error and eventually succeeds', async () => {
		vi.useFakeTimers();
		const mockFetch = vi
			.fn()
			.mockRejectedValueOnce(new Error('ECONNRESET'))
			.mockRejectedValueOnce(new Error('ECONNRESET'))
			.mockResolvedValueOnce(ok());
		const client = createApiClient(mockFetch as unknown as typeof fetch, 'http://test/api');
		const promise = client.get('/items');
		await vi.runAllTimersAsync();
		await promise;
		expect(mockFetch).toHaveBeenCalledTimes(3);
		vi.useRealTimers();
	});

	it('gives up after 3 retries on GET (4 total attempts)', async () => {
		vi.useFakeTimers();
		const mockFetch = vi.fn().mockRejectedValue(new Error('offline'));
		const client = createApiClient(mockFetch as unknown as typeof fetch, 'http://test/api');
		const promise = client.get('/items').catch((e) => e);
		await vi.runAllTimersAsync();
		const result = await promise;
		expect(result).toBeInstanceOf(Error);
		expect((result as Error).message).toBe('offline');
		expect(mockFetch).toHaveBeenCalledTimes(4);
		vi.useRealTimers();
	});

	it('does not retry writes (POST) on network errors', async () => {
		const mockFetch = vi.fn().mockRejectedValue(new Error('offline'));
		const client = createApiClient(mockFetch as unknown as typeof fetch, 'http://test/api');
		await expect(client.post('/items', { x: 1 })).rejects.toThrow('offline');
		expect(mockFetch).toHaveBeenCalledTimes(1);
	});

	it('does not retry on server error status (5xx surfaced immediately)', async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 500,
			json: () =>
				Promise.resolve({
					error: { code: 'INTERNAL', message: 'boom' },
					meta: { request_id: 'r', timestamp: '2026-07-16' }
				})
		});
		const client = createApiClient(mockFetch as unknown as typeof fetch, 'http://test/api');
		await expect(client.get('/items')).rejects.toBeInstanceOf(SkilluError);
		expect(mockFetch).toHaveBeenCalledTimes(1);
	});
});
