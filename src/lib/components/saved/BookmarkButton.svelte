<script lang="ts">
	/**
	 * Save / unsave one polymorphic target (SKI-36).
	 *
	 * State comes from the shared `bookmarks` index rather than a per-button
	 * probe, so a list of thirty cards costs one request instead of thirty.
	 * With `withDialog`, saving opens the folder + reminder form; without it
	 * the click saves straight away, which is what an inline icon in a card
	 * grid wants.
	 */
	import { onMount } from 'svelte';
	import { Bookmark, BookmarkCheck } from '@lucide/svelte';
	import { bookmarksApi } from '$lib/api/bookmarks';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import { bookmarks } from '$stores/bookmarks.svelte';
	import { toast } from '$stores/toast.svelte';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import Modal from '$components/ui/Modal.svelte';
	import type { SavedTargetType } from '$types';

	interface Props {
		targetType: SavedTargetType;
		targetId: string;
		/** Icon only, or icon plus label. */
		variant?: 'icon' | 'labelled';
		size?: 'sm' | 'md';
		/** Ask for a folder and a reminder before saving. */
		withDialog?: boolean;
		class?: string;
	}

	let {
		targetType,
		targetId,
		variant = 'icon',
		size = 'md',
		withDialog = false,
		class: className = ''
	}: Props = $props();

	let busy = $state(false);
	let dialogOpen = $state(false);
	let folderSlug = $state('');
	let note = $state('');

	let saved = $derived(bookmarks.isSaved(targetType, targetId));
	let iconSize = $derived(size === 'sm' ? 14 : 16);

	onMount(() => {
		if (auth.user) void bookmarks.ensureLoaded();
	});

	async function save(folder?: string, reminder?: string) {
		busy = true;
		try {
			const res = await bookmarksApi.create({
				target_type: targetType,
				target_id: targetId,
				folder_slug: folder?.trim() || undefined,
				notes: reminder?.trim() || undefined
			});
			bookmarks.track(res.data.bookmark);
			toast.success(i18n.t('bookmarks.addedToast'));
			dialogOpen = false;
			folderSlug = '';
			note = '';
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			busy = false;
		}
	}

	async function remove() {
		const id = bookmarks.idFor(targetType, targetId);
		if (!id) return;
		busy = true;
		try {
			await bookmarksApi.remove(id);
			bookmarks.forget(targetType, targetId);
			toast.success(i18n.t('bookmarks.removedToast'));
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			busy = false;
		}
	}

	function onclick() {
		if (busy) return;
		if (saved) {
			void remove();
		} else if (withDialog) {
			dialogOpen = true;
		} else {
			void save();
		}
	}
</script>

{#if auth.user}
	<button
		type="button"
		{onclick}
		disabled={busy}
		aria-pressed={saved}
		aria-label={saved ? i18n.t('bookmarks.removeAria') : i18n.t('bookmarks.saveAria')}
		title={saved ? i18n.t('bookmarks.removeAria') : i18n.t('bookmarks.saveAria')}
		data-testid="bookmark-button"
		class="inline-flex items-center gap-1.5 rounded-full border transition-colors duration-200 disabled:opacity-50
			{size === 'sm' ? 'px-2 py-1 text-xs' : 'px-2.5 py-1.5 text-sm'}
			{saved
			? 'border-accent/40 bg-accent/10 text-accent'
			: 'border-border bg-surface-elevated text-text-muted hover:border-text-muted hover:text-text-primary'}
			{className}"
	>
		{#if saved}
			<BookmarkCheck size={iconSize} strokeWidth={2} />
		{:else}
			<Bookmark size={iconSize} strokeWidth={2} />
		{/if}
		{#if variant === 'labelled'}
			<span>{saved ? i18n.t('bookmarks.removeAria') : i18n.t('bookmarks.addCta')}</span>
		{/if}
	</button>
{/if}

<Modal
	open={dialogOpen}
	title={i18n.t('bookmarks.dialogTitle')}
	onclose={() => (dialogOpen = false)}
	size="sm"
>
	<div class="space-y-4">
		<Input
			label={i18n.t('bookmarks.folderLabel')}
			bind:value={folderSlug}
			placeholder={i18n.t('bookmarks.folderPlaceholder')}
			hint={i18n.t('bookmarks.folderHint')}
			maxlength={60}
		/>
		<div>
			<label
				for="bookmark-note"
				class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted"
			>
				{i18n.t('bookmarks.noteLabel')}
			</label>
			<textarea
				id="bookmark-note"
				bind:value={note}
				maxlength={1000}
				rows="3"
				placeholder={i18n.t('bookmarks.notePlaceholder')}
				class="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
			></textarea>
		</div>
	</div>

	{#snippet actions()}
		<Button variant="ghost" onclick={() => (dialogOpen = false)}>
			{i18n.t('common.actions.cancel')}
		</Button>
		<Button variant="accent" loading={busy} onclick={() => save(folderSlug, note)}>
			{i18n.t('common.actions.save')}
		</Button>
	{/snippet}
</Modal>
