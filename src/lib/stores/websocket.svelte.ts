import { notifications } from './notifications.svelte';

export type WsEvent =
	| 'connected'
	| 'fragment.earned'
	| 'badge.earned'
	| 'leaderboard.updated'
	| 'challenge.submission'
	| 'notification';

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

	/** Rejoindre une room (leaderboard, challenge, etc.) */
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
