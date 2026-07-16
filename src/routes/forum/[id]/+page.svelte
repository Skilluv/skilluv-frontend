<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import { forumApi, type ForumPost } from '$api/forum';
	import { socialApi, type SocialComment } from '$api/social';
	import { moderationApi, type ForumModerateBody } from '$lib/api/moderation';
	import { toast } from '$stores/toast.svelte';
	import { SkilluError } from '$api/client';
	import { InlineModerateButton, ConfirmDangerousDialog } from '$lib/components/moderation';
	import { Trash2, Flag, VolumeX } from '@lucide/svelte';

	let postId = $derived(page.params.id ?? '');
	let post = $state<ForumPost | null>(null);
	let comments = $state<SocialComment[]>([]);
	let loading = $state(true);
	let newComment = $state('');
	let posting = $state(false);

	async function load() {
		loading = true;
		try {
			const [pRes, cRes] = await Promise.all([
				forumApi.get(postId),
				socialApi.listComments('forum_post', postId).catch(() => null)
			]);
			post = pRes.data.post;
			if (cRes) comments = cRes.data.comments;
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			loading = false;
		}
	}

	async function submitComment(e: SubmitEvent) {
		e.preventDefault();
		if (!newComment.trim() || posting) return;
		posting = true;
		try {
			await socialApi.createComment('forum_post', postId, newComment.trim());
			newComment = '';
			await load();
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			posting = false;
		}
	}

	async function acceptAnswer(commentId: string) {
		try {
			await forumApi.acceptAnswer(postId, commentId);
			toast.success(i18n.locale === 'fr' ? 'Réponse marquée acceptée' : 'Answer marked accepted');
			await load();
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		}
	}

	async function react(target: 'forum_post' | 'forum_comment', targetId: string) {
		try {
			await socialApi.toggleReaction(target === 'forum_post' ? 'forum_post' : 'forum_post' as any, targetId, 'up');
			await load();
		} catch {
			// no-op
		}
	}

	function fmtDate(iso: string): string {
		return new Intl.DateTimeFormat(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', {
			day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
		}).format(new Date(iso));
	}

	let isAuthor = $derived(auth.isAuthenticated && post !== null && post.author_id === auth.user?.id);
	let isQuestion = $derived(post?.kind === 'question');

	// --- Moderation state ---
	let modDialogOpen = $state(false);
	let modDialogAction = $state<'delete' | 'mute_author' | 'mark_spam' | null>(null);
	let modSubmitting = $state(false);
	let muteDurationHours = $state(24);

	function openModAction(action: 'delete' | 'mute_author' | 'mark_spam', close: () => void) {
		modDialogAction = action;
		modDialogOpen = true;
		close();
	}

	function closeModDialog() {
		if (modSubmitting) return;
		modDialogOpen = false;
		modDialogAction = null;
	}

	async function submitModAction(reason: string) {
		if (!post || !modDialogAction) return;
		modSubmitting = true;
		try {
			if (modDialogAction === 'mute_author' && post.author_id) {
				await moderationApi.forum.muteAuthor(post.author_id, muteDurationHours, reason);
			} else {
				const body: ForumModerateBody = {
					action: modDialogAction,
					reason
				};
				await moderationApi.forum.moderatePost(post.id, body);
			}
			toast.success(i18n.t('moderation.toast.done'));
			modDialogOpen = false;
			modDialogAction = null;
			if (modDialogAction === 'delete' || modDialogAction === 'mark_spam') {
				await load();
			}
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('moderation.toast.failed'));
		} finally {
			modSubmitting = false;
		}
	}

	let modDialogTitle = $derived.by(() => {
		if (modDialogAction === 'delete') return i18n.t('moderation.forum.actionDelete');
		if (modDialogAction === 'mute_author') return i18n.t('moderation.forum.actionMuteAuthor');
		if (modDialogAction === 'mark_spam') return i18n.t('moderation.forum.actionMarkSpam');
		return '';
	});

	let modDialogBody = $derived.by(() => {
		if (modDialogAction === 'delete') return i18n.t('moderation.forum.confirmDeleteBody');
		if (modDialogAction === 'mute_author') return i18n.t('moderation.forum.confirmMuteBody');
		if (modDialogAction === 'mark_spam') return i18n.t('moderation.forum.confirmSpamBody');
		return '';
	});

	onMount(() => void load());
</script>

<svelte:head>
	<title>{post?.title ?? 'Forum'} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-10 sm:py-14">
	<nav class="mb-6 flex items-center gap-2 text-sm text-text-muted">
		<a href="/forum" class="hover:text-text-primary">Forum</a>
		<span>›</span>
		<span class="text-text-primary truncate">{post?.title ?? '...'}</span>
	</nav>

	{#if loading}
		<div class="animate-pulse space-y-4">
			<div class="h-32 rounded bg-surface-elevated"></div>
			<div class="h-64 rounded bg-surface-elevated"></div>
		</div>
	{:else if post}
		<!-- Post header -->
		<article class="mb-8 rounded-2xl border border-border bg-surface-elevated p-6 sm:p-8">
			<div class="mb-3 flex items-center gap-2 flex-wrap">
				<Badge variant={isQuestion ? 'primary' : 'accent'} size="sm">{post.kind}</Badge>
				{#if post.pinned}<Badge variant="accent" size="sm">▲ Pin</Badge>{/if}
				{#if post.locked}<Badge variant="error" size="sm">
					<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
					<span class="ml-1">Locked</span>
				</Badge>{/if}
				{#if post.accepted_answer_id}
					<Badge variant="success" size="sm">✓ {i18n.locale === 'fr' ? 'Résolu' : 'Solved'}</Badge>
				{/if}
				{#if post.bounty_fragments > 0}
					<Badge variant="accent" size="sm">
						★ {post.bounty_fragments} {i18n.locale === 'fr' ? 'fragments' : 'fragments'}
					</Badge>
				{/if}
			</div>
			<div class="flex items-start justify-between gap-3">
				<h1 class="text-3xl sm:text-4xl font-black leading-tight tracking-tight">{post.title}</h1>
				<InlineModerateButton capability="forum_moderator" size="md">
					{#snippet children({ close })}
						<button
							type="button"
							role="menuitem"
							onclick={() => openModAction('delete', close)}
							class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-primary transition-colors hover:bg-error/10 hover:text-error"
						>
							<Trash2 size={14} strokeWidth={2} />
							{i18n.t('moderation.forum.actionDelete')}
						</button>
						<button
							type="button"
							role="menuitem"
							onclick={() => openModAction('mark_spam', close)}
							class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-primary transition-colors hover:bg-warning/10 hover:text-warning"
						>
							<Flag size={14} strokeWidth={2} />
							{i18n.t('moderation.forum.actionMarkSpam')}
						</button>
						<button
							type="button"
							role="menuitem"
							onclick={() => openModAction('mute_author', close)}
							class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-primary transition-colors hover:bg-surface-overlay"
						>
							<VolumeX size={14} strokeWidth={2} />
							{i18n.t('moderation.forum.actionMuteAuthor')}
						</button>
					{/snippet}
				</InlineModerateButton>
			</div>
			<div class="mt-2 flex items-center gap-2 text-sm text-text-muted">
				<span>@{post.author_username ?? '?'}</span>
				<span>·</span>
				<span>{fmtDate(post.created_at)}</span>
			</div>
			<div class="mt-6 whitespace-pre-wrap text-base leading-relaxed">{post.body}</div>
		</article>

		<!-- Comments -->
		<section>
			<h2 class="mb-4 text-xs font-bold uppercase tracking-wider text-accent">
				{isQuestion
					? (i18n.locale === 'fr' ? `${comments.length} réponse${comments.length > 1 ? 's' : ''}` : `${comments.length} answer${comments.length > 1 ? 's' : ''}`)
					: (i18n.locale === 'fr' ? `${comments.length} commentaire${comments.length > 1 ? 's' : ''}` : `${comments.length} comment${comments.length > 1 ? 's' : ''}`)}
			</h2>

			<div class="space-y-3">
				{#each comments as c}
					<article
						class="rounded-2xl border {c.accepted ? 'border-success/40 bg-success/5' : 'border-border bg-surface-elevated'} p-5"
					>
						{#if c.accepted}
							<Badge variant="success" size="sm">✓ {i18n.locale === 'fr' ? 'Réponse acceptée' : 'Accepted answer'}</Badge>
						{/if}
						<div class="mt-2 flex items-start justify-between gap-3">
							<div class="flex items-center gap-2 text-sm text-text-muted">
								<span class="font-semibold text-text-primary">@{c.author_username}</span>
								<span>·</span>
								<span>{fmtDate(c.created_at)}</span>
								{#if c.edited}<span class="italic">({i18n.locale === 'fr' ? 'modifié' : 'edited'})</span>{/if}
							</div>
							<div class="flex items-center gap-1 text-sm shrink-0">
								<button
									onclick={() => void react('forum_post', c.id)}
									class="rounded-full border border-border px-3 py-1 hover:border-primary hover:text-primary transition-colors"
									aria-label="upvote"
								>
									▲ {c.reaction_up}
								</button>
								{#if isAuthor && isQuestion && !c.accepted && !post.accepted_answer_id}
									<button
										onclick={() => void acceptAnswer(c.id)}
										class="rounded-full border border-success bg-success/10 px-3 py-1 text-success text-xs font-semibold hover:bg-success/20"
									>
										✓ {i18n.locale === 'fr' ? 'Accepter' : 'Accept'}
									</button>
								{/if}
							</div>
						</div>
						<div class="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{c.body}</div>
					</article>
				{/each}
			</div>

			<!-- New comment form -->
			{#if auth.isAuthenticated && !post.locked}
				<form onsubmit={submitComment} class="mt-6 rounded-2xl border border-border bg-surface-elevated p-5">
					<label for="new-c" class="mb-2 block text-xs font-bold uppercase tracking-wider text-text-muted">
						{isQuestion
							? (i18n.locale === 'fr' ? 'Votre réponse' : 'Your answer')
							: (i18n.locale === 'fr' ? 'Votre commentaire' : 'Your comment')}
					</label>
					<textarea
						id="new-c"
						bind:value={newComment}
						rows="4"
						required
						class="w-full rounded-xl border border-border bg-surface-overlay px-4 py-3 text-sm placeholder:text-text-muted focus:border-primary focus:outline-none"
					></textarea>
					<div class="mt-3 flex justify-end">
						<Button variant="accent" loading={posting} disabled={!newComment.trim()}>
							{i18n.locale === 'fr' ? 'Publier' : 'Post'}
						</Button>
					</div>
				</form>
			{:else if !auth.isAuthenticated}
				<div class="mt-6 rounded-2xl border border-border bg-surface-elevated p-6 text-center">
					<p class="mb-3 text-sm text-text-muted">
						{i18n.locale === 'fr' ? 'Connecte-toi pour participer.' : 'Log in to participate.'}
					</p>
					<Button variant="accent" href={`/auth/login?redirect=/forum/${postId}`}>
						{i18n.locale === 'fr' ? 'Se connecter' : 'Log in'}
					</Button>
				</div>
			{:else}
				<div class="mt-6 rounded-2xl border border-warning/30 bg-warning/5 p-4 text-center text-sm text-text-muted flex items-center justify-center gap-2">
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
					<span>{i18n.locale === 'fr' ? 'Ce fil est verrouillé.' : 'This thread is locked.'}</span>
				</div>
			{/if}
		</section>
	{/if}
</div>

<ConfirmDangerousDialog
	open={modDialogOpen}
	title={modDialogTitle}
	body={modDialogBody}
	submitting={modSubmitting}
	onConfirm={submitModAction}
	onClose={closeModDialog}
/>

{#if modDialogOpen && modDialogAction === 'mute_author'}
	<div class="fixed bottom-4 right-4 z-[91] flex items-center gap-2 rounded-xl border border-border bg-surface-elevated px-4 py-3 shadow-lg">
		<label for="mute_duration" class="text-xs font-semibold text-text-muted">
			{i18n.t('moderation.durationHours')}
		</label>
		<select
			id="mute_duration"
			bind:value={muteDurationHours}
			class="rounded-lg border border-border bg-surface-overlay px-2 py-1 text-xs text-text-primary"
		>
			<option value={24}>{i18n.t('moderation.forum.muteDuration24')}</option>
			<option value={72}>{i18n.t('moderation.forum.muteDuration72')}</option>
			<option value={168}>{i18n.t('moderation.forum.muteDuration168')}</option>
		</select>
	</div>
{/if}
