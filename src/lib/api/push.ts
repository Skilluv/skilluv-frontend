import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export const pushApi = {
	vapidPublicKey() {
		return api.get<ApiResponse<{ public_key: string }>>('/notifications/push/vapid-public-key');
	},

	subscribe(endpoint: string, p256dh: string, auth: string) {
		return api.post<ApiResponse<{ subscription_id: string }>>('/notifications/push/subscribe', {
			endpoint,
			p256dh,
			auth
		});
	},

	unsubscribe(subscriptionId: string) {
		return api.delete<ApiResponse<{ removed: boolean }>>(`/notifications/push/${subscriptionId}`);
	}
};

// --- Helpers browser side ---

/** Convertit une clé VAPID base64 URL-safe en Uint8Array (requis par PushManager). */
export function urlBase64ToUint8Array(base64: string): Uint8Array {
	const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
	const b64 = padded.replace(/-/g, '+').replace(/_/g, '/');
	const raw = atob(b64);
	const out = new Uint8Array(raw.length);
	for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
	return out;
}

/** Sérialise une clé ECDH ArrayBuffer en base64 URL-safe. */
export function arrayBufferToBase64Url(buf: ArrayBuffer | null): string {
	if (!buf) return '';
	const bytes = new Uint8Array(buf);
	let s = '';
	for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
	return btoa(s).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}
