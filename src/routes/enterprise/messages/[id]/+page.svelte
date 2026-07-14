<script lang="ts">
	import { page } from '$app/stores';
	import { contactApi } from '$api/contact';
	import { auth } from '$stores/auth.svelte';
	import { SkilluError } from '$api/client';
	import Button from '$components/ui/Button.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import { i18n } from '$lib/i18n';
	import type { Conversation, Message } from '$types';
	import { ArrowLeft } from '@lucide/svelte';

	let conversationId = $derived($page.params.id ?? '');
	let conversation = $state<Conversation | null>(null);
	let messages = $state<Message[]>([]);
	let loading = $state(true);
	let sending = $state(false);
	let error = $state('');
	let newMessage = $state('');
	let messagesContainer: HTMLDivElement;

	$effect(() => {
		if (conversationId) loadConversation(conversationId);
	});

	async function loadConversation(id: string) {
		loading = true;
		try {
			const res = await contactApi.getConversation(id);
			conversation = res.data.conversation;
			messages = res.data.messages;
			scrollToBottom();
		} catch (err) {
			if (err instanceof SkilluError) error = err.message;
			else error = i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	async function handleSend(e: SubmitEvent) {
		e.preventDefault();
		if (!newMessage.trim() || !conversationId) return;

		sending = true;
		try {
			const res = await contactApi.sendMessage(conversationId, newMessage.trim());
			messages = [...messages, res.data.message];
			newMessage = '';
			scrollToBottom();
		} catch (err) {
			if (err instanceof SkilluError) error = err.message;
		} finally {
			sending = false;
		}
	}

	function scrollToBottom() {
		requestAnimationFrame(() => {
			messagesContainer?.scrollTo({ top: messagesContainer.scrollHeight, behavior: 'smooth' });
		});
	}

	function formatTime(iso: string): string {
		return new Date(iso).toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' });
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('fr', { day: 'numeric', month: 'long' });
	}
</script>

<svelte:head>
	<title>{conversation?.other_party.name ?? 'Conversation'} — Skilluv</title>
</svelte:head>

<div class="flex h-[calc(100vh-4rem)] flex-col">
	<!-- Header -->
	<div class="flex items-center gap-3 border-b border-border bg-surface-elevated px-4 py-3">
		<a href="/enterprise/messages" class="text-text-muted hover:text-text-primary lg:hidden" aria-label={i18n.locale === 'fr' ? 'Retour' : 'Back'}>
			<ArrowLeft size={18} strokeWidth={2} />
		</a>
		{#if conversation}
			<div class="flex h-8 w-8 items-center justify-center rounded-full bg-surface-overlay text-sm font-bold text-text-muted">
				{conversation.other_party.name.charAt(0).toUpperCase()}
			</div>
			<div>
				<p class="text-sm font-medium">{conversation.other_party.name}</p>
				{#if conversation.closed}
					<p class="text-xs text-text-muted">{i18n.t('enterprise.messages.closed')}</p>
				{/if}
			</div>
		{:else}
			<Skeleton class="h-5 w-32" />
		{/if}
	</div>

	<!-- Messages -->
	<div bind:this={messagesContainer} class="flex-1 overflow-y-auto p-4">
		{#if loading}
			<div class="flex flex-col gap-3">
				{#each Array(5) as _}
					<Skeleton class="h-12 w-2/3" rounded="xl" />
				{/each}
			</div>
		{:else}
			<div class="flex flex-col gap-3">
				{#each messages as msg, i}
					{@const isMe = msg.sender_id === auth.user?.id}
					{@const showDate = i === 0 || formatDate(messages[i - 1].created_at) !== formatDate(msg.created_at)}

					{#if showDate}
						<p class="my-2 text-center text-xs text-text-muted">{formatDate(msg.created_at)}</p>
					{/if}

					<div class="flex {isMe ? 'justify-end' : 'justify-start'}">
						<div
							class="max-w-[75%] rounded-2xl px-4 py-2 text-sm
								{isMe
								? 'bg-primary text-primary-fg rounded-br-sm'
								: 'bg-surface-elevated text-text-primary rounded-bl-sm'}"
						>
							<p class="whitespace-pre-wrap">{msg.content}</p>
							<p class="mt-1 text-[10px] {isMe ? 'text-primary-fg/60' : 'text-text-muted'}">
								{formatTime(msg.created_at)}
							</p>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Input -->
	{#if conversation && !conversation.closed}
		<form onsubmit={handleSend} class="flex items-center gap-3 border-t border-border bg-surface-elevated px-4 py-3">
			<input
				bind:value={newMessage}
				placeholder={i18n.t('enterprise.messages.inputPlaceholder')}
				class="flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary"
				maxlength="5000"
				disabled={sending}
			/>
			<Button variant="accent" size="sm" type="submit" loading={sending} disabled={!newMessage.trim()}>
				{i18n.t('enterprise.messages.sendBtn')}
			</Button>
		</form>
	{/if}
</div>
