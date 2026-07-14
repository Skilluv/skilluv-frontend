<script lang="ts">
	import { contactApi } from '$api/contact';
	import { SkilluError } from '$api/client';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import { i18n } from '$lib/i18n';
	import type { Conversation } from '$types';
	import { MessageSquare } from '@lucide/svelte';

	let conversations = $state<Conversation[]>([]);
	let loading = $state(true);
	let error = $state('');

	$effect(() => {
		loadConversations();
	});

	async function loadConversations() {
		loading = true;
		try {
			const res = await contactApi.listConversations();
			conversations = res.data.conversations;
		} catch (err) {
			if (err instanceof SkilluError) error = err.message;
			else error = i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	function formatDate(iso: string): string {
		const d = new Date(iso);
		const now = new Date();
		const diff = now.getTime() - d.getTime();
		if (diff < 86400000) return d.toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' });
		if (diff < 604800000) return d.toLocaleDateString('fr', { weekday: 'short' });
		return d.toLocaleDateString('fr', { day: 'numeric', month: 'short' });
	}
</script>

<svelte:head>
	<title>{i18n.t('enterprise.messages.title')} — Skilluv</title>
</svelte:head>

<div class="p-6 lg:p-8">
	<h1 class="mb-2 text-2xl font-bold">{i18n.t('enterprise.messages.title')}</h1>
	<p class="mb-6 text-text-muted">{i18n.t('enterprise.messages.subtitle')}</p>

	{#if loading}
		<div class="flex flex-col gap-3">
			{#each Array(4) as _}
				<Skeleton class="h-16 w-full" rounded="xl" />
			{/each}
		</div>
	{:else if error}
		<p class="py-8 text-center text-text-muted">{error}</p>
	{:else if conversations.length === 0}
		<div class="py-12 text-center">
			<div class="mb-3 inline-flex justify-center text-text-muted"><MessageSquare size={40} strokeWidth={1.5} /></div>
			<p class="text-text-muted">{i18n.t('enterprise.messages.empty')}</p>
		</div>
	{:else}
		<div class="flex flex-col gap-2">
			{#each conversations as conv}
				<a
					href="/enterprise/messages/{conv.id}"
					class="flex items-center gap-4 rounded-2xl border border-border bg-surface-elevated p-4 transition-all hover:border-primary/30
						{conv.unread_count > 0 ? 'border-l-4 border-l-accent' : ''}"
				>
					<!-- Avatar -->
					<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-overlay font-bold text-text-muted">
						{conv.other_party.name.charAt(0).toUpperCase()}
					</div>

					<!-- Content -->
					<div class="flex-1 overflow-hidden">
						<div class="flex items-center justify-between">
							<p class="font-medium {conv.unread_count > 0 ? 'text-text-primary' : 'text-text-muted'}">
								{conv.other_party.name}
							</p>
							{#if conv.last_message}
								<span class="shrink-0 text-xs text-text-muted">{formatDate(conv.last_message.created_at)}</span>
							{/if}
						</div>
						{#if conv.last_message}
							<p class="truncate text-sm text-text-muted">{conv.last_message.content}</p>
						{/if}
					</div>

					<!-- Unread badge -->
					{#if conv.unread_count > 0}
						<span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-fg">
							{conv.unread_count}
						</span>
					{/if}
				</a>
			{/each}
		</div>
	{/if}
</div>
