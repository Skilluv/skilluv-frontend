<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { notifications } from '$stores/notifications.svelte';
	import { notificationsApi } from '$api/notifications';
	import { notifBody, notifAge } from '$lib/utils/notifications';
	import type { Notification } from '$lib/types';
	import { Bell } from '@lucide/svelte';

	/**
	 * The bell, and the five rows behind it.
	 *
	 * ## Why a panel and not just a link
	 *
	 * The bell was a link to `/notifications`, so finding out whether anything
	 * had happened cost a page. The badge said *how many*, never *what*, and
	 * most of the time the answer is one line somebody wants to read and
	 * dismiss. Five rows and a way through to the rest covers that without
	 * taking the reader off whatever they were doing.
	 *
	 * ## Why it loads on open and not on mount
	 *
	 * Every authenticated page renders this. Fetching on mount would be a
	 * request per navigation for a panel most visits never open, on a product
	 * whose connectivity target is intermittent. The unread count is already
	 * polled for the badge; the rows are fetched when somebody asks to see them,
	 * and refetched on each open so the panel is never stale.
	 *
	 * ## Reading a row marks it read
	 *
	 * Opening the panel does not: seeing that something exists is not reading
	 * it, and marking all five read on open would empty the badge for somebody
	 * who glanced and moved on. Clicking one does, and the count follows without
	 * waiting for the next poll.
	 */

	const PANEL_SIZE = 5;

	let open = $state(false);
	let loading = $state(false);
	let failed = $state(false);
	let items = $state<Notification[]>([]);
	let panel = $state<HTMLElement | null>(null);

	async function load() {
		loading = true;
		failed = false;
		try {
			const res = await notificationsApi.list({ page: 1, per_page: PANEL_SIZE });
			items = res.data ?? [];
		} catch {
			// A panel that says nothing happened when the request failed is a
			// lie. It says it could not look instead.
			failed = true;
			items = [];
		} finally {
			loading = false;
		}
	}

	function toggle() {
		open = !open;
		if (open) void load();
	}

	async function read(n: Notification) {
		if (n.read) return;
		// Optimistic: the row is already off the reader's list in their head.
		items = items.map((i) => (i.id === n.id ? { ...i, read: true } : i));
		notifications.decrement();
		try {
			await notificationsApi.markRead(n.id);
		} catch {
			// Left as read locally. The next poll corrects the count, and
			// re-marking it unread under the reader's eyes would be worse than
			// a count that is briefly one short.
		}
	}

	async function markAllRead() {
		items = items.map((i) => ({ ...i, read: true }));
		notifications.reset();
		try {
			await notificationsApi.markAllRead();
		} catch {
			// Same reasoning as `read`.
		}
	}

	/** Escape closes it, and the click that opened it must not close it again. */
	function onWindowClick(event: MouseEvent) {
		if (!open) return;
		const target = event.target as Node | null;
		if (target && panel?.contains(target)) return;
		open = false;
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) {
			open = false;
			(panel?.querySelector('button') as HTMLElement | null)?.focus();
		}
	}

	const unread = $derived(notifications.unreadCount);
	const label = $derived(
		unread > 0
			? i18n.t('notifications.bellUnread', { n: unread })
			: i18n.t('notifications.bell')
	);
</script>

<svelte:window onclick={onWindowClick} onkeydown={onKeydown} />

<div class="relative" bind:this={panel}>
	<button
		type="button"
		onclick={toggle}
		aria-expanded={open}
		aria-haspopup="menu"
		aria-label={label}
		data-testid="notification-bell"
		class="relative flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition-colors duration-200 hover:bg-surface-overlay hover:text-text-primary"
	>
		<Bell size={18} strokeWidth={1.5} />
		{#if unread > 0}
			<!-- The count is on the badge and in the button's name: a number
			     rendered only as a coloured disc says nothing to a screen reader. -->
			<span
				aria-hidden="true"
				data-testid="notification-count"
				class="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-fg"
			>
				{unread > 9 ? '9+' : unread}
			</span>
		{/if}
	</button>

	{#if open}
		<div
			role="menu"
			aria-label={i18n.t('notifications.title')}
			data-testid="notification-panel"
			class="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-lg"
		>
			<div class="flex items-center justify-between border-b border-border px-3 py-2">
				<p class="text-xs font-bold uppercase tracking-widest text-text-muted">
					{i18n.t('notifications.title')}
				</p>
				{#if unread > 0}
					<button
						type="button"
						onclick={markAllRead}
						class="text-[11px] font-medium text-text-muted transition-colors hover:text-text-primary"
					>
						{i18n.t('notifications.markAllRead')}
					</button>
				{/if}
			</div>

			{#if loading}
				<p class="px-3 py-6 text-center text-sm text-text-muted">
					{i18n.t('common.actions.loading')}
				</p>
			{:else if failed}
				<p class="px-3 py-6 text-center text-sm text-text-muted">
					{i18n.t('notifications.panelError')}
				</p>
			{:else if items.length === 0}
				<p class="px-3 py-6 text-center text-sm text-text-muted">
					{i18n.t('notifications.empty')}
				</p>
			{:else}
				<ul class="max-h-96 overflow-y-auto">
					{#each items as item (item.id)}
						<li class="border-b border-border last:border-b-0">
							<a
								href="/notifications"
								role="menuitem"
								onclick={() => read(item)}
								class="flex gap-2.5 px-3 py-2.5 transition-colors hover:bg-surface-overlay"
							>
								<span
									aria-hidden="true"
									class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full {item.read
										? 'bg-transparent'
										: 'bg-accent'}"
								></span>
								<span class="min-w-0 flex-1">
									<span class="flex items-baseline justify-between gap-2">
										<span class="truncate text-sm font-semibold text-text-primary">
											{item.title}
										</span>
										<span class="shrink-0 text-[10px] text-text-muted">
											{notifAge(item.updated_at ?? item.created_at)}
										</span>
									</span>
									<!-- Two lines, then it stops: a panel whose rows are as tall
									     as the body they carry stops being scannable. -->
									<span class="mt-0.5 line-clamp-2 block text-xs leading-snug text-text-muted">
										{notifBody(item)}
									</span>
								</span>
							</a>
						</li>
					{/each}
				</ul>
			{/if}

			<a
				href="/notifications"
				role="menuitem"
				data-testid="notification-see-all"
				class="block border-t border-border px-3 py-2.5 text-center text-xs font-bold uppercase tracking-widest text-text-muted transition-colors hover:bg-surface-overlay hover:text-text-primary"
			>
				{i18n.t('notifications.seeAll')}
			</a>
		</div>
	{/if}
</div>
