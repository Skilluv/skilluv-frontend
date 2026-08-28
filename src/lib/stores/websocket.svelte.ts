import { notifications } from './notifications.svelte';

export type WsEvent =
	| 'connected'
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

	connect() {
		if (this.ws?.readyState === WebSocket.OPEN) return;
		if (typeof window === 'undefined') return;

		const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
		const url = `${protocol}//${window.location.host}/ws`;

		this.ws = new WebSocket(url);

		this.ws.onopen = () => {
			this.connected = true;
			this.reconnectDelay = 1000;
		};

		this.ws.onmessage = (e) => {
			try {
				const msg: WsMessage = JSON.parse(e.data);
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
