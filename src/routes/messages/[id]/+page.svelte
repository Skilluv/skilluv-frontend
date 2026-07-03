<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { page } from '$app/state';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import { goto } from '$app/navigation';
	import Button from '$components/ui/Button.svelte';
	import { dmApi, type DmMessage } from '$api/dm';
	import { toast } from '$stores/toast.svelte';
	import { SkilluError } from '$api/client';

	let convId = $derived(page.params.id ?? '');
	let messages = $state<DmMessage[]>([]);
	let loading = $state(true);
	let composing = $state('');
	let sending = $state(false);
	let scrollEl: HTMLDivElement | undefined = $state();

	async function load() {
		loading = true;
		try {
			const res = await dmApi.getMessages(convId, { limit: 50 });
			messages = res.data.messages;
			await dmApi.markRead(convId).catch(() => null);
			await tick();
			scrollToBottom();
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			loading = false;
		}
	}

	function scrollToBottom() {
		if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight;
	}

	async function send(e: SubmitEvent) {
		e.preventDefault();
		const body = composing.trim();
		if (!body || sending) return;
		sending = true;
		try {
			const res = await dmApi.sendMessage(convId, body);
			messages = [...messages, res.data.message];
			composing = '';
			await tick();
			scrollToBottom();
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			sending = false;
		}
	}

	function fmtTime(iso: string): string {
		return new Intl.DateTimeFormat(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', {
			hour: '2-digit', minute: '2-digit'
		}).format(new Date(iso));
	}

	function isMine(m: DmMessage): boolean {
		return m.sender_id === auth.user?.id;
	}

	onMount(() => {
		if (!auth.isAuthenticated) {
			goto('/auth/login?redirect=/messages');
			return;
		}
		void load();
		const iv = setInterval(() => {
			// Petit poll léger (5s) — le backend expose des WebSocket qu'on
			// pourra brancher plus tard pour du realtime propre.
			dmApi.getMessages(convId, { limit: 50 }).then((res) => {
				if (res.data.messages.length !== messages.length) {
					messages = res.data.messages;
					void tick().then(scrollToBottom);
				}
			}).catch(() => null);
		}, 5000);
		return () => clearInterval(iv);
	});
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Conversation — Skilluv' : 'Conversation — Skilluv'}</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-6 flex flex-col h-[calc(100vh-140px)]">
	<nav class="mb-4 flex items-center gap-2 text-sm text-text-muted">
		<a href="/messages" class="hover:text-text-primary">Messages</a>
		<span>›</span>
		<span class="text-text-primary">Conversation</span>
	</nav>

	<!-- Messages -->
	<div bind:this={scrollEl} class="flex-1 overflow-y-auto rounded-2xl border border-border bg-surface-elevated p-4 mb-3">
		{#if loading}
			<div class="animate-pulse space-y-3">
				{#each Array(4) as _}
					<div class="h-16 rounded-xl bg-surface-overlay"></div>
				{/each}
			</div>
		{:else if messages.length === 0}
			<div class="flex h-full items-center justify-center text-center">
				<p class="text-text-muted">
					{i18n.locale === 'fr' ? 'Aucun message pour l\'instant. Écris le premier.' : 'No message yet. Write the first one.'}
				</p>
			</div>
		{:else}
			<div class="space-y-3">
				{#each messages as m}
					<div class="flex {isMine(m) ? 'justify-end' : 'justify-start'}">
						<div
							class="max-w-[75%] rounded-2xl px-4 py-2 {isMine(m)
								? 'bg-primary text-primary-fg'
								: 'border border-border bg-surface-overlay'}"
						>
							<p class="whitespace-pre-wrap break-words text-sm leading-relaxed">{m.body}</p>
							<p class="mt-1 text-[10px] {isMine(m) ? 'text-primary-fg/60' : 'text-text-muted'}">
								{fmtTime(m.created_at)}
								{#if isMine(m) && m.read_at}
									· ✓✓
								{/if}
							</p>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Compose -->
	<form onsubmit={send} class="flex gap-2">
		<textarea
			bind:value={composing}
			rows="1"
			placeholder={i18n.locale === 'fr' ? 'Écris un message...' : 'Type a message...'}
			class="flex-1 rounded-2xl border border-border bg-surface-elevated px-4 py-2.5 text-sm placeholder:text-text-muted focus:border-primary focus:outline-none resize-none"
			onkeydown={(e) => {
				if (e.key === 'Enter' && !e.shiftKey) {
					e.preventDefault();
					send(new SubmitEvent('submit'));
				}
			}}
		></textarea>
		<Button variant="accent" loading={sending} disabled={!composing.trim()}>
			{i18n.locale === 'fr' ? 'Envoyer' : 'Send'}
		</Button>
	</form>
</div>
