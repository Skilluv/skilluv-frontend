<script lang="ts">
	import { notificationsApi } from '$api/notifications';
	import { notifications } from '$stores/notifications.svelte';
	import { SkilluError } from '$api/client';
	import Button from '$components/ui/Button.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import { i18n } from '$lib/i18n';
	import type { Notification } from '$types';

	let items = $state<Notification[]>([]);
	let loading = $state(true);
	let error = $state('');
	let filterRead = $state<boolean | undefined>(false);

	const typeIcons: Record<string, string> = {
		interest_request_received: '💼',
		interest_accepted: '✅',
		interest_declined: '↩',
		new_message: '💬',
		challenge_approved: '🎯',
		challenge_rejected: '↻',
		account_banned: '⛔',
		account_unbanned: '🔓'
	};

	$effect(() => {
		loadNotifications();
	});

	async function loadNotifications() {
		loading = true;
		try {
			const res = await notificationsApi.list({ read: filterRead, per_page: 50 });
			items = res.data;
		} catch (err) {
			if (err instanceof SkilluError) error = err.message;
			else error = 'Impossible de charger les notifications.';
		} finally {
			loading = false;
		}
	}

	async function markRead(notif: Notification) {
		if (notif.read) return;
		try {
			await notificationsApi.markRead(notif.id);
			notif.read = true;
			notifications.decrement();
		} catch { /* silent */ }
	}

	async function markAllRead() {
		try {
			await notificationsApi.markAllRead();
			items.forEach((n) => (n.read = true));
			notifications.reset();
		} catch { /* silent */ }
	}

	function formatDate(iso: string): string {
		const d = new Date(iso);
		const now = new Date();
		const diff = now.getTime() - d.getTime();
		if (diff < 3600000) return `${Math.floor(diff / 60000)}min`;
		if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
		return d.toLocaleDateString('fr', { day: 'numeric', month: 'short' });
	}
</script>

<svelte:head>
	<title>{i18n.t('notifications.title')} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-8">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-bold">{i18n.t('notifications.title')}</h1>
		{#if items.some((n) => !n.read)}
			<Button variant="ghost" size="sm" onclick={markAllRead}>{i18n.t('notifications.markAllRead')}</Button>
		{/if}
	</div>

	<!-- Filtres -->
	<div class="mb-4 flex gap-2">
		<button
			class="rounded-lg px-3 py-1.5 text-xs font-medium {filterRead === false ? 'bg-primary text-white' : 'bg-surface-elevated text-text-muted'}"
			onclick={() => { filterRead = false; loadNotifications(); }}
		>{i18n.t('notifications.unread')}</button>
		<button
			class="rounded-lg px-3 py-1.5 text-xs font-medium {filterRead === undefined ? 'bg-primary text-white' : 'bg-surface-elevated text-text-muted'}"
			onclick={() => { filterRead = undefined; loadNotifications(); }}
		>{i18n.t('notifications.all')}</button>
	</div>

	{#if loading}
		<div class="flex flex-col gap-3">
			{#each Array(5) as _}
				<Skeleton class="h-16 w-full" rounded="xl" />
			{/each}
		</div>
	{:else if error}
		<p class="py-8 text-center text-text-muted">{error}</p>
	{:else if items.length === 0}
		<div class="py-12 text-center">
			<p class="mb-2 text-4xl">🔔</p>
			<p class="text-text-muted">{i18n.t('notifications.empty')}</p>
		</div>
	{:else}
		<div class="flex flex-col gap-2">
			{#each items as notif}
				<button
					type="button"
					class="flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors
						{notif.read ? 'border-border bg-surface' : 'border-accent/20 bg-accent/5'}"
					onclick={() => markRead(notif)}
				>
					<span class="mt-0.5 text-lg">{typeIcons[notif.notification_type] ?? '🔔'}</span>
					<div class="flex-1">
						<p class="text-sm font-medium {notif.read ? 'text-text-muted' : 'text-text-primary'}">{notif.title}</p>
						{#if notif.body}
							<p class="text-xs text-text-muted">{notif.body}</p>
						{/if}
					</div>
					<span class="shrink-0 text-xs text-text-muted">{formatDate(notif.created_at)}</span>
					{#if !notif.read}
						<span class="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent"></span>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>
