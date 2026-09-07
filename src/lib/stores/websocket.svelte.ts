import { notifications } from './notifications.svelte';
import { wsUrl } from '$api/origin';
import { authApi } from '$api/auth';

export type WsEvent =
	| 'connected'
	/**
	 * The server's own error frame. It was not in this union, so it fell
	 * through `dispatch` to nobody — including the one that matters:
	 * `AUTH_UNAUTHORIZED`, sent the instant an unauthenticated socket opens,
	 * immediately before the server closes it without a close frame.
	 *
	 * That abrupt close is what a dev proxy reports as `read ECONNRESET`, which
	 * is why the log said the connection had been reset when the server had in
	 * fact answered clearly and been ignored.
	 */
	| 'error'
	| 'fragment.earned'
	| 'badge.earned'
	| 'leaderboard.updated'
	| 'challenge.submission'
	| 'notification'
	/**
	 * A CTF challenge solved before anybody else (SKI-141).
	 *
	 * Broadcast twice by the server and the two are not the same message:
	 * globally, because a first blood is community news, and into `ctf:{id}`,
	 * because a page showing one challenge cannot filter the global stream down
	 * to itself without receiving every other challenge's traffic first. Which
	 * one a surface wants depends on what it renders — `room` says which
	 * arrived.
	 */
	| 'security.first_solve'
	/** A correct flag moved the board. Room-scoped: `ctf:{id}`. */
	| 'security.scoreboard_changed'
	/** A tournament standing moved. Room-scoped: `tournament:{id}`. */
	| 'tournament.leaderboard_changed'
	/** A tournament ended and its final ranking is readable. */
	| 'tournament.concluded';

interface WsMessage {
	event: WsEvent;
	room?: string;
	payload?: unknown;
}

type WsHandler = (payload: unknown, room?: string) => void;

class WebSocketState {
	connected = $state(false);
	private ws: WebSocket | null = null;
	private handlers = new Map<WsEvent, Set<WsHandler>>();
	private reconnectTimer: ReturnType<typeof setTimeout> | undefined;
	private reconnectDelay = 1000;
	/**
	 * One refresh per refusal, so a stale token is retried and a genuinely
	 * signed-out session is not hammered.
	 */
	private refreshing = false;

	connect() {
		if (this.ws?.readyState === WebSocket.OPEN) return;
		if (typeof window === 'undefined') return;

		// Follows the API origin, not the page: the socket is the backend's,
		// and the SvelteKit server has no /ws route to answer on.
		this.ws = new WebSocket(wsUrl());

		this.ws.onopen = () => {
			this.connected = true;
			this.reconnectDelay = 1000;
		};

		this.ws.onmessage = (e) => {
			try {
				const msg: WsMessage = JSON.parse(e.data);
				if (msg.event === 'error' && this.isAuthRefusal(msg.payload)) {
					void this.recoverFromAuthRefusal();
					return;
				}
				this.dispatch(msg.event, msg.payload, msg.room);
			} catch {
				// malformed message
			}
		};

		this.ws.onclose = () => {
			this.connected = false;
			this.scheduleReconnect();
		};

		this.ws.onerror = () => {
			this.ws?.close();
		};
	}

	disconnect() {
		clearTimeout(this.reconnectTimer);
		this.ws?.close();
		this.ws = null;
		this.connected = false;
	}

	/**
	 * Rejoindre une room (leaderboard, challenge, etc.)
	 *
	 * Rooms are not access-controlled beyond `cohort:` — joining one only
	 * decides what reaches this socket, never what the reader is allowed to
	 * know. Every payload sent to `ctf:` and `tournament:` is already public on
	 * the page that renders it.
	 */
	join(room: string) {
		this.send({ action: 'join', room });
	}

	/** Quitter une room */
	leave(room: string) {
		this.send({ action: 'leave', room });
	}

	/** S'abonner à un event */
	on(event: WsEvent, handler: WsHandler) {
		if (!this.handlers.has(event)) this.handlers.set(event, new Set());
		this.handlers.get(event)!.add(handler);
		return () => this.handlers.get(event)?.delete(handler);
	}

	private send(data: Record<string, unknown>) {
		if (this.ws?.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify(data));
		}
	}

	private dispatch(event: WsEvent, payload: unknown, room?: string) {
		// Notification intégrée — incrémenter le compteur
		if (event === 'notification') {
			notifications.fetchCount();
		}

		const handlers = this.handlers.get(event);
		if (handlers) {
			for (const h of handlers) h(payload, room);
		}
	}

	private isAuthRefusal(payload: unknown): boolean {
		return (
			typeof payload === 'object' &&
			payload !== null &&
			(payload as { code?: string }).code === 'AUTH_UNAUTHORIZED'
		);
	}

	/**
	 * The socket was refused for want of a session, which reconnecting cannot fix.
	 *
	 * An access token lasts fifteen minutes. HTTP calls renew it on their own —
	 * the client posts `/auth/refresh` on a 401 and replays the request — but
	 * the socket took no part in that: it reconnected on a loop against a cookie
	 * that would stay stale until something else happened to refresh it. On a
	 * dev proxy that is a reset every second, and in production a socket that
	 * silently stops delivering notifications while the rest of the app works.
	 *
	 * So the refusal is answered rather than retried: refresh once, reconnect,
	 * and if the refresh fails there is no session to recover — back off at the
	 * ceiling instead of from a second, so a signed-out tab costs one attempt
	 * every thirty seconds rather than a stream of them.
	 */
	private async recoverFromAuthRefusal() {
		if (this.refreshing) return;
		this.refreshing = true;
		try {
			await authApi.refresh();
			this.reconnectDelay = 1000;
		} catch {
			this.reconnectDelay = 30000;
		} finally {
			this.refreshing = false;
			// The close handler schedules the reconnect; the server is about to
			// close this socket anyway, and closing it here makes that immediate
			// rather than waiting on a reset.
			this.ws?.close();
		}
	}

	private scheduleReconnect() {
		this.reconnectTimer = setTimeout(() => {
			this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
			this.connect();
		}, this.reconnectDelay);
	}
}

export const ws = new WebSocketState();

/**
 * The room a CTF challenge publishes into.
 *
 * Named here rather than interpolated at each call site: the server formats it
 * as `ctf:{id}` in one place, and a client that spells it differently gets a
 * socket that connects, joins nothing, and reports no error at all.
 */
export function ctfRoom(challengeId: string): string {
	return `ctf:${challengeId}`;
}

/** The room a tournament publishes into. Same reasoning as `ctfRoom`. */
export function tournamentRoom(tournamentId: string): string {
	return `tournament:${tournamentId}`;
}
