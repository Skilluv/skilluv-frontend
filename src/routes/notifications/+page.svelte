<script lang="ts">
	import { notificationsApi } from '$api/notifications';
	import { notifications } from '$stores/notifications.svelte';
	import { SkilluError } from '$api/client';
	import Button from '$components/ui/Button.svelte';
	import SegmentedControl from '$components/ui/SegmentedControl.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import { i18n } from '$lib/i18n';
	import type { Notification } from '$types';

	let items = $state<Notification[]>([]);
	let loading = $state(true);
	let error = $state('');
	let filterRead = $state<boolean | undefined>(false);
	let filterValue = $derived(filterRead === false ? 'unread' : 'all');

	/** Couleur accent par type — l'icône est rendue via le composant NotifIcon plus bas. */
	const typeColor: Record<string, string> = {
		interest_request_received: 'text-primary',
		interest_accepted: 'text-success',
		interest_declined: 'text-text-muted',
		new_message: 'text-primary',
		challenge_approved: 'text-success',
		challenge_rejected: 'text-warning',
		account_banned: 'text-error',
		account_unbanned: 'text-success'
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
	<div class="mb-4">
		<SegmentedControl
			items={[
				{ value: 'unread', label: i18n.t('notifications.unread') },
				{ value: 'all', label: i18n.t('notifications.all') }
			]}
			value={filterValue}
			onchange={(v) => { filterRead = v === 'unread' ? false : undefined; loadNotifications(); }}
			size="sm"
		/>
	</div>

	{#if loading}
		<div class="flex flex-col gap-2" aria-busy="true">
			{#each Array(5) as _}
				<div class="flex w-full items-start gap-3 rounded-2xl border border-border bg-surface p-4">
					<!-- type dot placeholder -->
					<div class="mt-2 h-2 w-2 shrink-0 rounded-full bg-surface-overlay animate-[skeleton-pulse_1.5s_ease-in-out_infinite]"></div>
					<div class="flex-1 space-y-2">
						<!-- title -->
						<div class="h-4 w-2/3 rounded bg-surface-overlay animate-[skeleton-pulse_1.5s_ease-in-out_infinite]"></div>
						<!-- body -->
						<div class="h-3 w-full rounded bg-surface-overlay animate-[skeleton-pulse_1.5s_ease-in-out_infinite]"></div>
					</div>
					<!-- date -->
					<div class="h-3 w-8 shrink-0 rounded bg-surface-overlay animate-[skeleton-pulse_1.5s_ease-in-out_infinite]"></div>
				</div>
			{/each}
		</div>
	{:else if error}
		<p class="py-8 text-center text-text-muted">{error}</p>
	{:else if items.length === 0}
		<EmptyState
			variant="seal-intact"
			title={i18n.locale === 'fr' ? 'Boîte vide.' : 'Inbox is quiet.'}
			body={i18n.locale === 'fr'
				? 'Quand quelqu\'un t\'aidera ou qu\'un challenge sera validé, tu recevras un sceau ici.'
				: 'When someone helps you or a challenge is validated, a seal will land here.'}
		/>
	{:else}
		<div class="flex flex-col gap-2">
			{#each items as notif}
				<button
					type="button"
					class="flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors
						{notif.read ? 'border-border bg-surface' : 'border-accent/20 bg-accent/5'}"
					onclick={() => markRead(notif)}
				>
					<!-- Type indicator dot -->
					<span class="mt-2 h-2 w-2 shrink-0 rounded-full {typeColor[notif.notification_type] ?? 'text-text-muted'} bg-current"></span>
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
