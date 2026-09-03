<script lang="ts">
	/** SKI-37 — every private note the user wrote, newest edit first. */
	import { onMount } from 'svelte';
	import { Trash2 } from '@lucide/svelte';
	import { userNotesApi } from '$lib/api/user_notes';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import FilterBar from '$components/ui/FilterBar.svelte';
	import Select from '$components/ui/Select.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import { SavedTargetLink } from '$components/saved';
	import { SAVED_TARGET_TYPES, type SavedTargetType, type UserNote } from '$types';

	const PAGE_SIZE = 50;

	let rows = $state<UserNote[]>([]);
	let typeFilter = $state<SavedTargetType | 'all'>('all');
	let loading = $state(true);
	let loadingMore = $state(false);
	let exhausted = $state(false);
	let loadError = $state('');

	let typeItems = $derived([
		{ value: 'all' as const, label: i18n.t('bookmarks.filterAll') },
		...SAVED_TARGET_TYPES.map((t) => ({
			value: t,
			label: i18n.t(`bookmarks.targetTypes.${t}`)
		}))
	]);

	function params(offset: number) {
		return {
			target_type: typeFilter === 'all' ? undefined : typeFilter,
			limit: PAGE_SIZE,
			offset
		};
	}

	async function load() {
		loading = true;
		loadError = '';
		try {
			const res = await userNotesApi.listMine(params(0));
			rows = res.data?.notes ?? [];
			exhausted = rows.length < PAGE_SIZE;
		} catch (err) {
			loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	async function loadMore() {
		loadingMore = true;
		try {
			const res = await userNotesApi.listMine(params(rows.length));
			const next = res.data?.notes ?? [];
			rows = [...rows, ...next];
			exhausted = next.length < PAGE_SIZE;
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			loadingMore = false;
		}
	}

	async function remove(row: UserNote) {
		if (!confirm(i18n.t('notes.removeConfirm'))) return;
		try {
			await userNotesApi.remove(row.target_type, row.target_id);
			rows = rows.filter(
				(r) => !(r.target_type === row.target_type && r.target_id === row.target_id)
			);
			toast.success(i18n.t('notes.removedToast'));
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		}
	}

	function onTypeChange(v: SavedTargetType | 'all') {
		typeFilter = v;
		void load();
	}

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('notes.title')} | Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-8" data-testid="dashboard-notes-page">
	<header class="mb-8">
		<h1 class="text-3xl font-bold text-text-primary">{i18n.t('notes.title')}</h1>
		<p class="mt-2 text-text-muted">{i18n.t('notes.subtitle')}</p>
	</header>

	<FilterBar label={i18n.t('bookmarks.filterType')} class="mb-6">
		<Select items={typeItems} value={typeFilter} onchange={onTypeChange} size="sm" />
	</FilterBar>

	{#if loading}
		<div class="space-y-3">
			{#each Array(3) as _, i (i)}
				<Skeleton class="h-24 w-full" rounded="xl" />
			{/each}
		</div>
	{:else if loadError}
		<div class="rounded-2xl border border-error/40 bg-error/5 p-6 text-center" role="alert">
			<p class="text-sm text-error">{loadError}</p>
			<Button variant="ghost" size="sm" class="mt-3" onclick={load}>
				{i18n.t('common.actions.retry')}
			</Button>
		</div>
	{:else if rows.length === 0}
		<EmptyState
			variant="scroll"
			title={i18n.t('notes.emptyTitle')}
			body={i18n.t('notes.emptyBody')}
		/>
	{:else}
		<ul class="space-y-3" role="list">
			{#each rows as row (`${row.target_type}:${row.target_id}`)}
				<li class="rounded-2xl border border-border bg-surface-elevated p-5">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div class="min-w-0 flex-1">
							<SavedTargetLink
								target={row.target}
								targetType={row.target_type}
								targetId={row.target_id}
							/>
							<p class="mt-2 whitespace-pre-wrap text-sm text-text-muted">{row.body}</p>
							<p class="mt-2 text-xs text-text-muted">
								{i18n.t('notes.lastEdited', { date: fmtDate(row.updated_at) })}
							</p>
						</div>
						<button
							type="button"
							onclick={() => remove(row)}
							aria-label={i18n.t('notes.remove')}
							title={i18n.t('notes.remove')}
							class="rounded-full border border-border p-2 text-text-muted transition-colors duration-200 hover:border-error hover:text-error"
						>
							<Trash2 size={14} strokeWidth={2} />
						</button>
					</div>
				</li>
			{/each}
		</ul>

		{#if !exhausted}
			<div class="mt-6 text-center">
				<Button variant="ghost" loading={loadingMore} onclick={loadMore}>
					{i18n.t('common.actions.loadMore')}
				</Button>
			</div>
		{/if}
	{/if}
</div>
