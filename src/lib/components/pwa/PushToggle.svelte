<script lang="ts">
	import { onMount } from 'svelte';
	import { i18n } from '$lib/i18n';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import { pushApi, urlBase64ToUint8Array, arrayBufferToBase64Url } from '$api/push';
	import { toast } from '$stores/toast.svelte';
	import { Check, X } from '@lucide/svelte';

	let supported = $state(false);
	let permission = $state<NotificationPermission>('default');
	let subscribed = $state(false);
	let localSubId = $state<string | null>(null);
	let busy = $state(false);

	const STORAGE_KEY = 'skilluv-push-sub-id';

	onMount(async () => {
		if (typeof window === 'undefined') return;
		supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
		if (!supported) return;
		permission = Notification.permission;
		try {
			localSubId = localStorage.getItem(STORAGE_KEY);
		} catch {
			localSubId = null;
		}
		// Check existing subscription
		try {
			const reg = await navigator.serviceWorker.getRegistration();
			if (reg) {
				const existing = await reg.pushManager.getSubscription();
				subscribed = !!existing;
			}
		} catch {
			// noop
		}
	});

	async function subscribe() {
		if (busy) return;
		busy = true;
		try {
			// 1. Ask permission
			if (permission !== 'granted') {
				permission = await Notification.requestPermission();
				if (permission !== 'granted') {
					toast.error(i18n.t('push.toast.permissionDenied'));
					return;
				}
			}
			// 2. Register SW if not already
			let reg = await navigator.serviceWorker.getRegistration();
			if (!reg) {
				reg = await navigator.serviceWorker.register('/service-worker.js');
			}
			// 3. Fetch VAPID public key
			const vapidRes = await pushApi.vapidPublicKey();
			const pk = vapidRes.data.public_key;
			const appServerKey = urlBase64ToUint8Array(pk);
			// 4. Subscribe. Cast to BufferSource because TS Uint8Array<ArrayBufferLike>
			// doesn't match `applicationServerKey: BufferSource` typing exactly.
			const sub = await reg.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: appServerKey.buffer as ArrayBuffer
			});
			// 5. Send to backend
			const p256dh = arrayBufferToBase64Url(sub.getKey('p256dh'));
			const authKey = arrayBufferToBase64Url(sub.getKey('auth'));
			const stored = await pushApi.subscribe(sub.endpoint, p256dh, authKey);
			localSubId = stored.data.subscription_id;
			try {
				localStorage.setItem(STORAGE_KEY, localSubId);
			} catch {
				// noop
			}
			subscribed = true;
			toast.success(i18n.t('push.toast.enabled'));
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Erreur');
		} finally {
			busy = false;
		}
	}

	async function unsubscribe() {
		if (busy) return;
		busy = true;
		try {
			const reg = await navigator.serviceWorker.getRegistration();
			if (reg) {
				const existing = await reg.pushManager.getSubscription();
				if (existing) await existing.unsubscribe();
			}
			if (localSubId) {
				await pushApi.unsubscribe(localSubId).catch(() => null);
				try {
					localStorage.removeItem(STORAGE_KEY);
				} catch {
					// noop
				}
				localSubId = null;
			}
			subscribed = false;
			toast.success(i18n.t('push.toast.disabled'));
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Erreur');
		} finally {
			busy = false;
		}
	}
</script>

{#if supported}
	<div class="rounded-2xl border border-border bg-surface-elevated p-6">
		<div class="mb-4 flex items-center gap-3">
			<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
				</svg>
			</div>
			<div class="flex-1">
				<p class="text-xs font-bold uppercase tracking-wider text-text-muted">{i18n.t('push.category')}</p>
				<h3 class="text-base font-semibold">
					{i18n.t('push.title')}
				</h3>
			</div>
			{#if subscribed}
				<Badge variant="success" size="sm">
					<Check size={12} strokeWidth={2.5} />
					{i18n.t('push.statusOn')}
				</Badge>
			{:else if permission === 'denied'}
				<Badge variant="error" size="sm">
					<X size={12} strokeWidth={2.5} />
					{i18n.t('push.statusBlocked')}
				</Badge>
			{:else}
				<Badge variant="default" size="sm">
					{i18n.t('push.statusOff')}
				</Badge>
			{/if}
		</div>
		<p class="mb-4 text-sm text-text-muted">
			{i18n.t('push.description')}
		</p>
		{#if permission === 'denied'}
			<p class="text-xs text-error">
				{i18n.t('push.blockedHint')}
			</p>
		{:else if subscribed}
			<Button variant="ghost" loading={busy} onclick={unsubscribe}>
				{i18n.t('push.disableBtn')}
			</Button>
		{:else}
			<Button variant="accent" loading={busy} onclick={subscribe}>
				{i18n.t('push.enableBtn')}
			</Button>
		{/if}
	</div>
{:else}
	<div class="rounded-2xl border border-border bg-surface-elevated p-6 text-sm text-text-muted">
		{i18n.t('push.unsupported')}
	</div>
{/if}
