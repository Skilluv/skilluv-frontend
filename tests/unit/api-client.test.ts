import { describe, it, expect, vi } from 'vitest';
import { createApiClient, SkilluError } from '../../src/lib/api/client';

describe('API Client', () => {
	it('creates a client with default base URL', () => {
		const client = createApiClient();
		expect(client).toBeDefined();
		expect(client.get).toBeDefined();
		expect(client.post).toBeDefined();
		expect(client.put).toBeDefined();
		expect(client.delete).toBeDefined();
	});

	it('appends query params to GET requests', async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: () => Promise.resolve({ data: { items: [] } })
		});

		const client = createApiClient(mockFetch as any, 'http://test/api');
		await client.get('/items', { page: 1, per_page: 10, filter: undefined });

		expect(mockFetch).toHaveBeenCalledWith(
			'http://test/api/items?page=1&per_page=10',
			expect.objectContaining({ credentials: 'include' })
		);
	});

	it('throws SkilluError on non-OK response', async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 401,
			json: () => Promise.resolve({
				error: { code: 'AUTH_UNAUTHORIZED', message: 'Not authenticated' },
				meta: { request_id: 'test', timestamp: '2026-01-01' }
			})
		});

		const client = createApiClient(mockFetch as any, 'http://test/api');

		try {
			await client.get('/me');
			expect.unreachable();
		} catch (err) {
			expect(err).toBeInstanceOf(SkilluError);
			const skilluErr = err as SkilluError;
			expect(skilluErr.code).toBe('AUTH_UNAUTHORIZED');
			expect(skilluErr.status).toBe(401);
			expect(skilluErr.message).toBe('Not authenticated');
		}
	});

	it('sends POST body as JSON', async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: () => Promise.resolve({ data: { id: '123' } })
		});

		const client = createApiClient(mockFetch as any, 'http://test/api');
		await client.post('/items', { name: 'test', value: 42 });

		expect(mockFetch).toHaveBeenCalledWith(
			'http://test/api/items',
			expect.objectContaining({
				method: 'POST',
				body: '{"name":"test","value":42}'
			})
		);
	});

	it('handles non-JSON error responses', async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 500,
			json: () => Promise.reject(new Error('not json'))
		});

		const client = createApiClient(mockFetch as any, 'http://test/api');

		try {
			await client.get('/broken');
			expect.unreachable();
		} catch (err) {
			expect(err).toBeInstanceOf(SkilluError);
			expect((err as SkilluError).code).toBe('UNKNOWN_ERROR');
			expect((err as SkilluError).status).toBe(500);
		}
	});
});
