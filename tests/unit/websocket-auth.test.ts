import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * What the socket does when the server refuses it.
 *
 * The server accepts the upgrade, sends one frame — `{"event":"error",
 * "payload":{"code":"AUTH_UNAUTHORIZED"}}` — and closes without a close frame.
 * Verified against the deployed API both ways: without a session cookie that
 * is exactly what comes back, and with one the first frame is `connected`.
 *
 * The client ignored it. `'error'` was not in the `WsEvent` union, so the frame
 * dispatched to nobody, and the close handler treated the refusal as a dropped
 * connection and reconnected — against a cookie that reconnecting cannot
 * change. An access token lasts fifteen minutes; HTTP calls renew it on a 401
 * and the socket took no part in that.
 *
 * On a dev proxy that abrupt close is reported as `read ECONNRESET`, which is
 * how a clear answer from the server ended up looking like a network fault.
 */

class FakeSocket {
	static last: FakeSocket | null = null;
	static opened = 0;
	static readonly OPEN = 1;
	readyState = 0;
	onopen: (() => void) | null = null;
	onmessage: ((e: { data: string }) => void) | null = null;
	onclose: (() => void) | null = null;
	onerror: (() => void) | null = null;
	closed = false;

	constructor(public url: string) {
		FakeSocket.last = this;
		FakeSocket.opened += 1;
	}

	close() {
		this.closed = true;
		this.onclose?.();
	}

	send() {}

	/** What the server sends an unauthenticated socket, immediately. */
	refuse() {
		this.onmessage?.({
			data: JSON.stringify({
				event: 'error',
				payload: { code: 'AUTH_UNAUTHORIZED', message: 'Authentication required' }
			})
		});
	}
}

let refreshMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
	vi.resetModules();
	FakeSocket.last = null;
	FakeSocket.opened = 0;
	refreshMock = vi.fn().mockResolvedValue({ data: {} });
	vi.doMock('../../src/lib/api/auth', () => ({ authApi: { refresh: refreshMock } }));
	vi.stubGlobal('WebSocket', FakeSocket);
	vi.stubGlobal('window', globalThis);
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.doUnmock('../../src/lib/api/auth');
	vi.useRealTimers();
});

describe('a socket the server refuses', () => {
	it('renews the session instead of reconnecting through the refusal', async () => {
		const { ws } = await import('../../src/lib/stores/websocket.svelte');
		ws.connect();
		FakeSocket.last!.refuse();
		await vi.waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(1));

		// Reconnecting cannot change the cookie the server just rejected. The
		// only thing that can is a refresh, which is what HTTP calls already do
		// on a 401 and the socket did not.
		ws.disconnect();
	});

	it('does not treat the refusal as a message anybody subscribed to', async () => {
		const { ws } = await import('../../src/lib/stores/websocket.svelte');
		const heard = vi.fn();
		ws.on('error', heard);
		ws.connect();
		FakeSocket.last!.refuse();
		await vi.waitFor(() => expect(refreshMock).toHaveBeenCalled());

		// It is handled, not broadcast: a subscriber would otherwise have to
		// know that this one error means "renew and come back" rather than
		// "show something to the reader".
		expect(heard).not.toHaveBeenCalled();
		ws.disconnect();
	});

	it('closes the socket it was refused on rather than waiting for the reset', async () => {
		const { ws } = await import('../../src/lib/stores/websocket.svelte');
		ws.connect();
		const socket = FakeSocket.last!;
		socket.refuse();
		await vi.waitFor(() => expect(socket.closed).toBe(true));
		ws.disconnect();
	});

	it('backs off at the ceiling when there is no session to recover', async () => {
		refreshMock.mockRejectedValue(new Error('no session'));
		vi.useFakeTimers();
		const { ws } = await import('../../src/lib/stores/websocket.svelte');
		ws.connect();
		FakeSocket.last!.refuse();
		await vi.waitFor(() => expect(refreshMock).toHaveBeenCalled(), { timeout: 2000 });

		// A signed-out tab costs one attempt every thirty seconds, not a stream
		// of them starting a second apart.
		const opened = FakeSocket.opened;
		await vi.advanceTimersByTimeAsync(29_000);
		expect(FakeSocket.opened).toBe(opened);
		await vi.advanceTimersByTimeAsync(2_000);
		expect(FakeSocket.opened).toBe(opened + 1);
		ws.disconnect();
	});
});
