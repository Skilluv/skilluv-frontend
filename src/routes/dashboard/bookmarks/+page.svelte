<script lang="ts">
	/** SKI-36 — everything the user put aside, with folder and type facets. */
	import { onMount } from 'svelte';
	import { Trash2 } from '@lucide/svelte';
	import { bookmarksApi, UNFILED_FOLDER } from '$lib/api/bookmarks';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { bookmarks as bookmarksStore } from '$stores/bookmarks.svelte';
	import { toast } from '$stores/toast.svelte';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import FilterBar from '$components/ui/FilterBar.svelte';
	import Select from '$components/ui/Select.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import { SavedTargetLink } from '$components/saved';
	import { SAVED_TARGET_TYPES, type Bookmark, type BookmarkFolder, type SavedTargetType } from '$types';

	const PAGE_SIZE = 50;

	let rows = $state<Bookmark[]>([]);
	let folders = $state<BookmarkFolder[]>([]);
	let typeFilter = $state<SavedTargetType | 'all'>('all');
	let folderFilter = $state<string>('all');
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

	let folderItems = $derived([
		{ value: 'all', label: i18n.t('bookmarks.allFolders') },
		...folders.map((f) => ({
			value: f.folder_slug ?? UNFILED_FOLDER,
			label: `${f.folder_slug ?? i18n.t('bookmarks.unfiled')} (${f.count})`
		}))
	]);

	function params(offset: number) {
		return {
			target_type: typeFilter === 'all' ? undefined : typeFilter,
			folder_slug: folderFilter === 'all' ? undefined : folderFilter,
			limit: PAGE_SIZE,
			offset
		};
	}

	async function load() {
		loading = true;
		loadError = '';
		try {
			const [list, facets] = await Promise.all([
				bookmarksApi.listMine(params(0)),
				bookmarksApi.folders()
			]);
			rows = list.data?.bookmarks ?? [];
			folders = facets.data?.folders ?? [];
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
			const res = await bookmarksApi.listMine(params(rows.length));
			const next = res.data?.bookmarks ?? [];
			rows = [...rows, ...next];
			exhausted = next.length < PAGE_SIZE;
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			loadingMore = false;
		}
	}

	async function remove(row: Bookmark) {
		try {
			await bookmarksApi.remove(row.id);
			rows = rows.filter((r) => r.id !== row.id);
			bookmarksStore.forget(row.target_type, row.target_id);
			// The facet counts moved with it; re-reading them is one small
			// request and beats decrementing a bucket by hand.
			folders = (await bookmarksApi.folders()).data?.folders ?? [];
			toast.success(i18n.t('bookmarks.removedToast'));
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		}
	}

	function onTypeChange(v: SavedTargetType | 'all') {
		typeFilter = v;
		void load();
	}

	function onFolderChange(v: string) {
		folderFilter = v;
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
	<title>{i18n.t('bookmarks.title')} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-8" data-testid="dashboard-bookmarks-page">
	<header class="mb-8">
		<h1 class="text-3xl font-bold text-text-primary">{i18n.t('bookmarks.title')}</h1>
		<p class="mt-2 text-text-muted">{i18n.t('bookmarks.subtitle')}</p>
	</header>

	<FilterBar label={i18n.t('bookmarks.filterType')} class="mb-6">
		<Select items={typeItems} value={typeFilter} onchange={onTypeChange} size="sm" />
		<Select items={folderItems} value={folderFilter} onchange={onFolderChange} size="sm" searchable />
	</FilterBar>

	{#if loading}
		<div class="space-y-3">
			{#each Array(4) as _, i (i)}
				<Skeleton class="h-20 w-full" rounded="xl" />
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
			variant="bookmark"
			title={i18n.t('bookmarks.emptyTitle')}
			body={i18n.t('bookmarks.emptyBody')}
		>
			{#snippet action()}
				<Button variant="accent" href="/challenges">{i18n.t('common.nav.challenges')}</Button>
			{/snippet}
		</EmptyState>
	{:else}
		<p class="mb-3 text-xs uppercase tracking-wide text-text-muted">
			{i18n.t('bookmarks.countLabel', { n: rows.length })}
		</p>
		<ul class="space-y-3" role="list">
			{#each rows as row (row.id)}
				<li class="rounded-2xl border border-border bg-surface-elevated p-5">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div class="min-w-0 flex-1">
							<SavedTargetLink
								target={row.target}
								targetType={row.target_type}
								targetId={row.target_id}
							/>
							{#if row.notes}
								<p class="mt-2 whitespace-pre-wrap text-sm text-text-muted">{row.notes}</p>
							{/if}
							<p class="mt-2 text-xs text-text-muted">
								{#if row.folder_slug}
									<span class="rounded-full bg-surface-overlay px-2 py-0.5">{row.folder_slug}</span>
									<span class="mx-1.5">·</span>
								{/if}
								{fmtDate(row.created_at)}
							</p>
						</div>
						<button
							type="button"
							onclick={() => remove(row)}
							aria-label={i18n.t('bookmarks.removeAria')}
							title={i18n.t('bookmarks.removeAria')}
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
