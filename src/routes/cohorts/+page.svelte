<script lang="ts">
	/**
	 * SKI-40 — cohort discovery.
	 *
	 * A cohort is neither a team (which ships one artifact) nor a guild
	 * (a long-lived identity): it is a learning cycle with an end date. The
	 * copy says so, because the three would otherwise blur.
	 */
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { CalendarRange, Users } from '@lucide/svelte';
	import { cohortsApi } from '$lib/api/cohorts';
	import { orientationsApi } from '$lib/api/orientations';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import FilterBar from '$components/ui/FilterBar.svelte';
	import Select from '$components/ui/Select.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import type { CohortListing, MyCohort, Orientation } from '$types';

	const PAGE_SIZE = 24;

	let listings = $state<CohortListing[]>([]);
	let mine = $state<MyCohort[]>([]);
	let orientations = $state<Orientation[]>([]);
	let orientationFilter = $state('all');
	let upcomingOnly = $state(false);
	let loading = $state(true);
	let loadingMore = $state(false);
	let exhausted = $state(false);
	let loadError = $state('');
	let joining = $state<string | null>(null);

	let orientationItems = $derived([
		{ value: 'all', label: i18n.t('cohorts.filterAll') },
		...orientations.map((o) => ({ value: o.slug, label: o.name }))
	]);

	let myCohortIds = $derived(new Set(mine.map((m) => m.cohort.id)));

	function params(offset: number) {
		return {
			orientation: orientationFilter === 'all' ? undefined : orientationFilter,
			upcoming_only: upcomingOnly || undefined,
			limit: PAGE_SIZE,
			offset
		};
	}

	async function load() {
		loading = true;
		loadError = '';
		try {
			const res = await cohortsApi.list(params(0));
			listings = res.data?.cohorts ?? [];
			exhausted = listings.length < PAGE_SIZE;
		} catch (err) {
			loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	async function loadMore() {
		loadingMore = true;
		try {
			const res = await cohortsApi.list(params(listings.length));
			const next = res.data?.cohorts ?? [];
			listings = [...listings, ...next];
			exhausted = next.length < PAGE_SIZE;
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			loadingMore = false;
		}
	}

	async function join(listing: CohortListing) {
		joining = listing.cohort.id;
		try {
			await cohortsApi.join(listing.cohort.id);
			mine = [...mine, { cohort: listing.cohort, role: 'member' }];
			listings = listings.map((l) =>
				l.cohort.id === listing.cohort.id
					? { ...l, member_count: l.member_count + 1, seats_left: Math.max(0, l.seats_left - 1) }
					: l
			);
			toast.success(i18n.t('cohorts.joinedToast'));
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			joining = null;
		}
	}

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	/** Where a cohort sits relative to now, for the status badge. */
	function phase(listing: CohortListing): 'notStarted' | 'running' | 'over' {
		const now = Date.now();
		if (new Date(listing.cohort.starts_at).getTime() > now) return 'notStarted';
		if (new Date(listing.cohort.ends_at).getTime() < now) return 'over';
		return 'running';
	}

	onMount(async () => {
		const [, orientationsRes, mineRes] = await Promise.allSettled([
			load(),
			orientationsApi.list(),
			auth.user ? cohortsApi.listMine() : Promise.resolve(null)
		]);
		if (orientationsRes.status === 'fulfilled') {
			orientations = (orientationsRes.value.data ?? []).filter((o) => !o.is_archived);
		}
		if (mineRes.status === 'fulfilled' && mineRes.value) {
			mine = mineRes.value.data?.cohorts ?? [];
		}
	});
</script>

<svelte:head>
	<title>{i18n.t('cohorts.title')} — Skilluv</title>
	<meta name="description" content={i18n.t('cohorts.subtitle')} />
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-8" data-testid="cohorts-page">
	<header class="mb-8 flex flex-wrap items-end justify-between gap-4">
		<div class="max-w-2xl">
			<h1 class="text-3xl font-bold text-text-primary">{i18n.t('cohorts.title')}</h1>
			<p class="mt-2 text-text-muted">{i18n.t('cohorts.subtitle')}</p>
			<p class="mt-1 text-sm text-text-muted">{i18n.t('cohorts.vsTeams')}</p>
		</div>
		{#if auth.user}
			<Button variant="accent" href="/cohorts/new">{i18n.t('cohorts.newCta')}</Button>
		{/if}
	</header>

	{#if mine.length > 0}
		<section class="mb-8" aria-label={i18n.t('cohorts.mineTitle')}>
			<h2 class="mb-3 text-xs font-bold uppercase tracking-wider text-text-muted">
				{i18n.t('cohorts.mineTitle')}
			</h2>
			<div class="flex flex-wrap gap-2">
				{#each mine as row (row.cohort.id)}
					<a
						href={resolve(`/cohorts/${row.cohort.id}`)}
						class="inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated px-4 py-2 text-sm text-text-primary transition-colors duration-200 hover:border-text-muted"
					>
						{row.cohort.name}
						{#if row.role === 'organizer'}
							<Badge variant="accent" size="sm">{i18n.t('cohorts.roleOrganizer')}</Badge>
						{/if}
					</a>
				{/each}
			</div>
		</section>
	{/if}

	<FilterBar label={i18n.t('cohorts.filterOrientation')} class="mb-6">
		<Select
			items={orientationItems}
			value={orientationFilter}
			onchange={(v) => {
				orientationFilter = v;
				void load();
			}}
			size="sm"
			searchable
		/>
		<button
			type="button"
			onclick={() => {
				upcomingOnly = !upcomingOnly;
				void load();
			}}
			aria-pressed={upcomingOnly}
			class="rounded-full border px-3 py-1.5 text-xs transition-colors duration-200 {upcomingOnly
				? 'border-accent/40 bg-accent/10 text-accent'
				: 'border-border bg-surface-elevated text-text-muted hover:text-text-primary'}"
		>
			{i18n.t('cohorts.upcomingOnly')}
		</button>
	</FilterBar>

	{#if loading}
		<div class="grid gap-4 sm:grid-cols-2">
			{#each Array(4) as _, i (i)}
				<Skeleton class="h-40 w-full" rounded="xl" />
			{/each}
		</div>
	{:else if loadError}
		<div class="rounded-2xl border border-error/40 bg-error/5 p-6 text-center" role="alert">
			<p class="text-sm text-error">{loadError}</p>
			<Button variant="ghost" size="sm" class="mt-3" onclick={load}>
				{i18n.t('common.actions.retry')}
			</Button>
		</div>
	{:else if listings.length === 0}
		<EmptyState
			variant="scroll"
			title={i18n.t('cohorts.emptyTitle')}
			body={i18n.t('cohorts.emptyBody')}
		>
			{#snippet action()}
				{#if auth.user}
					<Button variant="accent" href="/cohorts/new">{i18n.t('cohorts.newCta')}</Button>
				{/if}
			{/snippet}
		</EmptyState>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2">
			{#each listings as listing (listing.cohort.id)}
				{@const p = phase(listing)}
				{@const joined = myCohortIds.has(listing.cohort.id)}
				<article class="flex flex-col rounded-2xl border border-border bg-surface-elevated p-5">
					<div class="flex flex-wrap items-start justify-between gap-2">
						<a
							href={resolve(`/cohorts/${listing.cohort.id}`)}
							class="text-lg font-bold text-text-primary underline-offset-4 hover:underline"
						>
							{listing.cohort.name}
						</a>
						<Badge variant={p === 'running' ? 'success' : p === 'over' ? 'default' : 'accent'} size="sm">
							{i18n.t(`cohorts.${p}`)}
						</Badge>
					</div>

					{#if listing.orientation_slug}
						<p class="mt-1 text-xs uppercase tracking-wide text-text-muted">
							{listing.orientation_slug}
						</p>
					{/if}

					{#if listing.cohort.description}
						<p class="mt-3 line-clamp-3 text-sm text-text-muted">{listing.cohort.description}</p>
					{/if}

					<div class="mt-4 flex flex-wrap items-center gap-4 text-xs text-text-muted">
						<span class="inline-flex items-center gap-1.5">
							<CalendarRange size={12} strokeWidth={2} />
							{i18n.t('cohorts.runsFrom', {
								start: fmtDate(listing.cohort.starts_at),
								end: fmtDate(listing.cohort.ends_at)
							})}
						</span>
						<span class="inline-flex items-center gap-1.5">
							<Users size={12} strokeWidth={2} />
							{i18n.t('cohorts.memberCount', { n: listing.member_count })}
						</span>
					</div>

					<div class="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
						<span class="text-xs text-text-muted">
							{listing.seats_left > 0
								? i18n.t('cohorts.seatsLeft', { n: listing.seats_left })
								: i18n.t('cohorts.full')}
						</span>
						{#if joined}
							<Button variant="ghost" size="sm" href="/cohorts/{listing.cohort.id}">
								{i18n.t('common.actions.next')}
							</Button>
						{:else if auth.user && listing.cohort.is_public && listing.seats_left > 0 && p !== 'over'}
							<Button
								variant="accent"
								size="sm"
								loading={joining === listing.cohort.id}
								onclick={() => join(listing)}
							>
								{i18n.t('cohorts.join')}
							</Button>
						{:else if !listing.cohort.is_public}
							<Badge size="sm">{i18n.t('cohorts.privateLabel')}</Badge>
						{/if}
					</div>
				</article>
			{/each}
		</div>

		{#if !exhausted}
			<div class="mt-6 text-center">
				<Button variant="ghost" loading={loadingMore} onclick={loadMore}>
					{i18n.t('common.actions.loadMore')}
				</Button>
			</div>
		{/if}
	{/if}
</div>
