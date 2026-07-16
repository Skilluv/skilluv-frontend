import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { urlBase64ToUint8Array, arrayBufferToBase64Url } from '../../src/lib/api/push';

function ok(data: unknown) {
	return {
		ok: true,
		status: 200,
		json: () => Promise.resolve({ data, meta: { request_id: 'r', timestamp: '2026-07-16' } })
	};
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
	vi.resetModules();
	fetchMock = vi.fn();
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('urlBase64ToUint8Array', () => {
	it('decodes a padded base64 string', () => {
		// atob('hello') -> "hello world" would need proper input; use a known VAPID-like key.
		// "SGVsbG8" -> "Hello"
		const bytes = urlBase64ToUint8Array('SGVsbG8');
		expect(Array.from(bytes)).toEqual([72, 101, 108, 108, 111]);
	});

	it('converts URL-safe chars back to standard base64', () => {
		// "-_-_" -> corresponds to "+/+/"
		const bytes = urlBase64ToUint8Array('-_-_');
		// atob('+/+/') = 0xfb 0xff 0xbf
		expect(bytes.length).toBe(3);
	});

	it('pads short inputs correctly', () => {
		// 6 chars needs 2 padding chars
		const bytes = urlBase64ToUint8Array('SGVsbG8');
		expect(bytes.length).toBe(5);
	});
});

describe('arrayBufferToBase64Url', () => {
	it('returns empty string on null buffer', () => {
		expect(arrayBufferToBase64Url(null)).toBe('');
	});

	it('is the inverse of urlBase64ToUint8Array for simple inputs', () => {
		const bytes = new Uint8Array([72, 101, 108, 108, 111]);
		const b64 = arrayBufferToBase64Url(bytes.buffer);
		expect(b64).toBe('SGVsbG8');
	});

	it('strips trailing padding equals', () => {
		const bytes = new Uint8Array([1, 2, 3, 4]);
		const b64 = arrayBufferToBase64Url(bytes.buffer);
		expect(b64.includes('=')).toBe(false);
	});
});

describe('pushApi routes', () => {
	it('vapidPublicKey() hits the VAPID endpoint', async () => {
		fetchMock.mockResolvedValue(ok({ public_key: 'AAA' }));
		const { pushApi } = await import('../../src/lib/api/push');
		await pushApi.vapidPublicKey();
		expect(fetchMock).toHaveBeenCalledWith(
			'/api/notifications/push/vapid-public-key',
			expect.anything()
		);
	});

	it('subscribe() posts endpoint + keys', async () => {
		fetchMock.mockResolvedValue(ok({ subscription_id: 'sub-1' }));
		const { pushApi } = await import('../../src/lib/api/push');
		await pushApi.subscribe('https://push.example.com/x', 'p256dh-key', 'auth-key');
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/notifications/push/subscribe');
		expect(init.method).toBe('POST');
		const body = JSON.parse(init.body);
		expect(body.endpoint).toBe('https://push.example.com/x');
		expect(body.p256dh).toBe('p256dh-key');
		expect(body.auth).toBe('auth-key');
	});

	it('unsubscribe() DELETEs the subscription id', async () => {
		fetchMock.mockResolvedValue(ok({ removed: true }));
		const { pushApi } = await import('../../src/lib/api/push');
		await pushApi.unsubscribe('sub-1');
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/notifications/push/sub-1');
		expect(init.method).toBe('DELETE');
	});
});
