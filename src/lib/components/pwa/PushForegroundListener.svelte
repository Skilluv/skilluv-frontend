<script lang="ts">
	import { onMount } from 'svelte';
	import { i18n } from '$lib/i18n';
	import { toast } from '$lib/stores/toast.svelte';
	import { notifications } from '$lib/stores/notifications.svelte';
	import { goto } from '$app/navigation';

	/**
	 * Écoute les postMessage émis par service-worker.js quand un push arrive
	 * et que la fenêtre courante a le focus. Un push reçu en foreground
	 * remplace l'OS notification par un toast in-app + refresh du badge
	 * notifications, plus proche du contexte utilisateur.
	 */
	interface PushMessage {
		type: 'skilluv-push';
		payload: {
			title?: string;
			body?: string;
			url?: string;
		};
	}

	function isPushMessage(data: unknown): data is PushMessage {
		return (
			typeof data === 'object' &&
			data !== null &&
			(data as { type?: unknown }).type === 'skilluv-push'
		);
	}

	function handleMessage(event: MessageEvent<unknown>) {
		if (!isPushMessage(event.data)) return;
		const { title, body, url } = event.data.payload;
		const label = title || i18n.t('push.toast.receivedFallback');
		toast.info(body ? `${label} — ${body}` : label);
		void notifications.fetchCount();
		if (url && url !== window.location.pathname) {
			// Do not auto-navigate — respect the user's current context.
			// The toast is enough to surface the event; user clicks the notif
			// bell to navigate.
		}
		// url intentionally unused for now; kept in payload for future
		// deep-link CTA on the toast itself.
		void url;
		void goto;
	}

	onMount(() => {
		if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
		navigator.serviceWorker.addEventListener('message', handleMessage);
		return () => {
			navigator.serviceWorker.removeEventListener('message', handleMessage);
		};
	});
</script>
