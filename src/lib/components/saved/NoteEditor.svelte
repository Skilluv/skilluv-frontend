<script lang="ts">
	/**
	 * Private note on one polymorphic target (SKI-37).
	 *
	 * Unlike bookmarks there is a cheap exact probe — `GET /users/me/notes/
	 * {type}/{id}` answers 200 with `note: null` when there is none — so this
	 * loads its own state instead of leaning on a shared index. It is meant
	 * to sit on a detail page, not in a list.
	 */
	import { onMount } from 'svelte';
	import { NotebookPen, Lock } from '@lucide/svelte';
	import { userNotesApi } from '$lib/api/user_notes';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import { toast } from '$stores/toast.svelte';
	import Button from '$components/ui/Button.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import type { SavedTargetType, UserNote } from '$types';

	interface Props {
		targetType: SavedTargetType;
		targetId: string;
		/** Render collapsed behind a trigger until the reader asks for it. */
		collapsible?: boolean;
	}

	let { targetType, targetId, collapsible = true }: Props = $props();

	const MAX_CHARS = 1000;

	let note = $state<UserNote | null>(null);
	let body = $state('');
	let loading = $state(true);
	let saving = $state(false);
	/** Set once the reader asks for the editor; a non-collapsible one is always open. */
	let expanded = $state(false);
	let open = $derived(expanded || !collapsible);

	let dirty = $derived(body.trim() !== (note?.body ?? ''));
	let tooLong = $derived(body.length > MAX_CHARS);

	onMount(async () => {
		if (!auth.user) {
			loading = false;
			return;
		}
		try {
			const res = await userNotesApi.fetch(targetType, targetId);
			note = res.data.note;
			body = note?.body ?? '';
		} catch {
			// A note that cannot be read leaves an empty editor, which is the
			// same affordance as having no note. Nothing is lost.
		} finally {
			loading = false;
		}
	});

	async function save() {
		const trimmed = body.trim();
		if (!trimmed) {
			toast.error(i18n.t('notes.emptyBodyError'));
			return;
		}
		saving = true;
		try {
			const res = await userNotesApi.upsert(targetType, targetId, trimmed);
			note = res.data.note;
			body = note.body;
			toast.success(i18n.t('notes.savedToast'));
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			saving = false;
		}
	}

	async function remove() {
		if (!note) return;
		if (!confirm(i18n.t('notes.removeConfirm'))) return;
		saving = true;
		try {
			await userNotesApi.remove(targetType, targetId);
			note = null;
			body = '';
			toast.success(i18n.t('notes.removedToast'));
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			saving = false;
		}
	}

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}
</script>

{#if auth.user}
	<section
		class="rounded-2xl border border-border bg-surface-elevated p-5"
		data-testid="note-editor"
		aria-label={i18n.t('notes.editorTitle')}
	>
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div class="flex items-center gap-2">
				<NotebookPen size={16} strokeWidth={2} class="text-text-muted" />
				<h3 class="text-sm font-bold text-text-primary">{i18n.t('notes.editorTitle')}</h3>
				<span class="inline-flex items-center gap-1 text-xs text-text-muted">
					<Lock size={11} strokeWidth={2} />
					{i18n.t('notes.privateHint')}
				</span>
			</div>
			{#if collapsible && !open}
				<Button variant="ghost" size="sm" onclick={() => (expanded = true)}>
					{note ? i18n.t('notes.editCta') : i18n.t('notes.writeCta')}
				</Button>
			{/if}
		</div>

		{#if loading}
			<Skeleton class="mt-4 h-20 w-full" rounded="xl" />
		{:else if open}
			<textarea
				bind:value={body}
				rows="4"
				maxlength={MAX_CHARS}
				placeholder={i18n.t('notes.placeholder')}
				aria-label={i18n.t('notes.editorTitle')}
				class="mt-4 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
			></textarea>

			<div class="mt-3 flex flex-wrap items-center justify-between gap-3">
				<span class="text-xs {tooLong ? 'text-error' : 'text-text-muted'}">
					{i18n.t('notes.charCount', { n: body.length })}
					{#if note}
						<span class="ml-2">{i18n.t('notes.lastEdited', { date: fmtDate(note.updated_at) })}</span>
					{/if}
				</span>
				<div class="flex items-center gap-2">
					{#if note}
						<Button variant="ghost" size="sm" onclick={remove} disabled={saving}>
							{i18n.t('notes.remove')}
						</Button>
					{/if}
					<Button
						variant="accent"
						size="sm"
						loading={saving}
						disabled={!dirty || tooLong}
						onclick={save}
					>
						{i18n.t('notes.save')}
					</Button>
				</div>
			</div>
		{:else if note}
			<p class="mt-3 whitespace-pre-wrap text-sm text-text-muted">{note.body}</p>
		{:else}
			<p class="mt-3 text-sm text-text-muted">{i18n.t('notes.emptyBody')}</p>
		{/if}
	</section>
{/if}
