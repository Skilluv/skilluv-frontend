<script lang="ts">
	import { onMount } from 'svelte';
	import { mentionsApi, type Mention } from '$lib/api/mentions';
	import { SkilluError } from '$lib/api/client';
	import { i18n } from '$lib/i18n';
	import { auth } from '$lib/stores/auth.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';

	let items = $state<Mention[]>([]);
	let page = $state(1);
	let totalPages = $state(1);
	let loading = $state(true);
	let loadError = $state(false);

	const unreadCount = $derived(items.filter((m) => !m.read_at).length);

	async function load(target = page) {
		loading = true;
		loadError = false;
		try {
			const res = await mentionsApi.list({ page: target, per_page: 20 });
			items = res.data;
			page = res.pagination.page;
			totalPages = res.pagination.total_pages;
		} catch (err) {
			loadError = true;
			if (!(err instanceof SkilluError)) console.error(err);
		} finally {
			loading = false;
		}
	}

	onMount(() => load(1));

	async function markRead(mention: Mention) {
		if (mention.read_at) return;
		// Optimistic: the dot is a read cue, not state worth blocking navigation on.
		mention.read_at = new Date().toISOString();
		try {
			await mentionsApi.markRead(mention.id);
		} catch {
			mention.read_at = null;
		}
	}

	async function markAllRead() {
		const stamp = new Date().toISOString();
		const previous = items.map((m) => m.read_at);
		items.forEach((m) => (m.read_at = m.read_at ?? stamp));
		try {
			await mentionsApi.markAllRead();
		} catch {
			items.forEach((m, i) => (m.read_at = previous[i]));
		}
	}

	function formatDate(iso: string): string {
		const d = new Date(iso);
		const diff = Date.now() - d.getTime();
		if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}min`;
		if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
		return d.toLocaleDateString(i18n.locale, { day: 'numeric', month: 'short' });
	}
</script>

<svelte:head>
	<title>{i18n.t('mentions.title')} · Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-8" data-testid="mentions-page">
	<div class="flex items-start justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold">{i18n.t('mentions.title')}</h1>
			<p class="mt-1 text-sm text-text-muted">{i18n.t('mentions.subtitle')}</p>
		</div>
		{#if unreadCount > 0}
			<Button variant="ghost" size="sm" onclick={markAllRead}>
				{i18n.t('mentions.markAllRead')}
			</Button>
		{/if}
	</div>

	{#if loading}
		<div class="mt-6 flex flex-col gap-3">
			<Skeleton class="h-24 w-full" />
			<Skeleton class="h-24 w-full" />
			<Skeleton class="h-24 w-full" />
		</div>
	{:else if loadError}
		<div class="mt-6 rounded-2xl border border-border bg-surface-elevated p-6 text-center">
			<p class="text-sm text-text-muted">{i18n.t('mentions.loadError')}</p>
			<Button variant="secondary" size="sm" onclick={() => load(page)} class="mt-3">
				{i18n.t('mentions.retry')}
			</Button>
		</div>
	{:else if items.length === 0}
		<div class="mt-6">
			<EmptyState
				title={i18n.t('mentions.empty')}
				body={i18n.t('mentions.emptyHint', { username: auth.user?.username ?? 'username' })}
			/>
		</div>
	{:else}
		<ul class="mt-6 flex flex-col gap-3">
			{#each items as mention (mention.id)}
				<li>
					<a
						href={mention.source_url}
						rel="external"
						data-testid="mention-item"
						onclick={() => markRead(mention)}
						class="flex gap-3 rounded-2xl border border-border bg-surface-elevated p-4 transition-colors hover:border-accent"
					>
						<span
							class="mt-2 h-2 w-2 shrink-0 rounded-full {mention.read_at
								? 'bg-transparent'
								: 'bg-accent'}"
							aria-hidden="true"
						></span>
						<span class="min-w-0 flex-1">
							<span class="flex flex-wrap items-center gap-2">
								<span class="text-sm font-medium">{mention.author.display_name}</span>
								<Badge size="sm">{i18n.t(`mentions.sources.${mention.source_type}`)}</Badge>
								<span class="text-xs text-text-muted">{formatDate(mention.created_at)}</span>
							</span>
							<span class="mt-1 block truncate text-sm text-text-muted">{mention.excerpt}</span>
						</span>
					</a>
				</li>
			{/each}
		</ul>

		{#if totalPages > 1}
			<div class="mt-6">
				<Pagination current={page} total={totalPages} onchange={(p) => load(p)} />
			</div>
		{/if}
	{/if}
</div>
