<script lang="ts">
	import { onMount } from 'svelte';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import { goto } from '$app/navigation';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import { dmApi, type DmConversation } from '$api/dm';
	import { toast } from '$stores/toast.svelte';
	import { SkilluError } from '$api/client';

	let convs = $state<DmConversation[]>([]);
	let loading = $state(true);

	async function load() {
		loading = true;
		try {
			const res = await dmApi.listConversations();
			convs = res.data.conversations;
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			loading = false;
		}
	}

	function fmtRelative(iso: string | null): string {
		if (!iso) return '';
		const d = new Date(iso);
		const diff = Math.floor((Date.now() - d.getTime()) / 1000);
		if (diff < 60) return i18n.locale === 'fr' ? "à l'instant" : 'just now';
		if (diff < 3600) return `${Math.floor(diff / 60)}m`;
		if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
		return new Intl.DateTimeFormat(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'short' }).format(d);
	}

	onMount(() => {
		if (!auth.isAuthenticated) {
			goto('/auth/login?redirect=/messages');
			return;
		}
		void load();
	});
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Messages — Skilluv' : 'Messages — Skilluv'}</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-10 sm:py-14">
	<div class="mb-10">
		<p class="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">Direct</p>
		<h1 class="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight">
			{i18n.locale === 'fr' ? 'Messages.' : 'Messages.'}
		</h1>
	</div>

	{#if loading}
		<div class="space-y-2">
			{#each Array(5) as _}
				<div class="animate-pulse rounded-2xl border border-border bg-surface-elevated h-16"></div>
			{/each}
		</div>
	{:else if convs.length === 0}
		<div class="rounded-2xl border border-border bg-surface-elevated p-10 text-center">
			<div class="mb-3 text-4xl text-text-muted">◈</div>
			<p class="mb-4 text-text-muted">
				{i18n.locale === 'fr' ? 'Aucune conversation pour l\'instant.' : 'No conversation yet.'}
			</p>
			<Button variant="ghost" href="/find-talents">
				{i18n.locale === 'fr' ? 'Découvrir des talents' : 'Discover talents'}
			</Button>
		</div>
	{:else}
		<div class="divide-y divide-border rounded-2xl border border-border bg-surface-elevated overflow-hidden">
			{#each convs as c}
				<a
					href={`/messages/${c.id}`}
					class="flex items-center gap-4 p-4 hover:bg-surface-overlay transition-colors"
				>
					<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-black text-primary relative">
						{c.other_display_name.charAt(0)}
						{#if c.unread_count > 0}
							<span class="absolute -right-1 -top-1 min-w-[20px] h-5 px-1.5 rounded-full bg-accent text-accent-fg text-xs font-bold flex items-center justify-center">
								{c.unread_count}
							</span>
						{/if}
					</div>
					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-2 justify-between">
							<span class="font-semibold truncate">{c.other_display_name}</span>
							<span class="text-xs text-text-muted shrink-0">{fmtRelative(c.last_message_at)}</span>
						</div>
						<p class="mt-0.5 truncate text-sm {c.unread_count > 0 ? 'font-semibold' : 'text-text-muted'}">
							{c.last_message_preview ?? (i18n.locale === 'fr' ? 'Nouvelle conversation' : 'New conversation')}
						</p>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
