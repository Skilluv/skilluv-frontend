<script lang="ts">
	/**
	 * SKI-237 — design contest discovery.
	 *
	 * A design contest is a `brief_contest` tournament scoped to the design
	 * domain. `GET /tournaments` has no `kind` filter, so the narrowing happens
	 * client-side over a capped page — see `listDesignContests`.
	 *
	 * The annual Design Awards live at `/design/awards`, on the `awards` module
	 * — an edition, its categories, its nominees and a two-ballot vote. They
	 * were assumed absent when this page was written; they were not, they were
	 * simply unconsumed.
	 */
	import { onMount } from 'svelte';
	import { listDesignContests } from '$lib/api/design';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import { ContestCard } from '$components/design';
	import type { Tournament } from '$types';

	let contests = $state<Tournament[]>([]);
	let loading = $state(true);
	let loadError = $state('');

	/** Three shelves, from the dates rather than the status: a contest whose
	 *  status lags behind its own calendar should still read correctly. */
	let live = $derived(
		contests.filter((c) => {
			const now = Date.now();
			return (
				new Date(c.starts_at).getTime() <= now &&
				new Date(c.ends_at).getTime() > now &&
				c.status !== 'cancelled'
			);
		})
	);
	let upcoming = $derived(
		contests.filter(
			(c) => new Date(c.starts_at).getTime() > Date.now() && c.status !== 'cancelled'
		)
	);
	let past = $derived(
		contests.filter((c) => new Date(c.ends_at).getTime() <= Date.now() || c.status === 'concluded')
	);

	async function load() {
		loading = true;
		loadError = '';
		try {
			contests = await listDesignContests();
		} catch (err) {
			loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('designContests.title')} | Skilluv</title>
	<meta name="description" content={i18n.t('designContests.subtitle')} />
	<meta property="og:title" content="{i18n.t('designContests.title')} | Skilluv" />
	<meta property="og:description" content={i18n.t('designContests.subtitle')} />
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-8" data-testid="design-contests-page">
	<header class="mb-10 max-w-2xl">
		<h1 class="text-4xl font-bold text-text-primary">{i18n.t('designContests.title')}</h1>
		<p class="mt-3 text-lg text-text-muted">{i18n.t('designContests.subtitle')}</p>
		<!-- The awards are the yearly companion to the contests, and nothing
		     else on the site links to them. -->
		<div class="mt-3 flex flex-wrap gap-4 text-sm">
			<a
				href="/design/awards"
				class="text-accent underline-offset-4 hover:underline"
				data-testid="design-awards-link"
			>
				{i18n.t('designAwards.title')}
			</a>
			<a
				href="/design/series"
				class="text-accent underline-offset-4 hover:underline"
				data-testid="design-series-link"
			>
				{i18n.t('designSeries.title')}
			</a>
			<a
				href="/design/toolkit"
				class="text-accent underline-offset-4 hover:underline"
				data-testid="design-toolkit-link"
			>
				{i18n.t('designPractice.title')}
			</a>
		</div>
	</header>

	{#if loading}
		<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{#each Array(6) as _, i (i)}
				<Skeleton class="h-80 w-full" rounded="xl" />
			{/each}
		</div>
	{:else if loadError}
		<div class="rounded-2xl border border-error/40 bg-error/5 p-6 text-center" role="alert">
			<p class="text-sm text-error">{loadError}</p>
			<Button variant="ghost" size="sm" class="mt-3" onclick={load}>
				{i18n.t('common.actions.retry')}
			</Button>
		</div>
	{:else if contests.length === 0}
		<EmptyState
			variant="scroll"
			title={i18n.t('designContests.emptyTitle')}
			body={i18n.t('designContests.emptyBody')}
		/>
	{:else}
		{#each [{ rows: live, title: i18n.t('designContests.liveTitle') }, { rows: upcoming, title: i18n.t('designContests.upcomingTitle') }, { rows: past, title: i18n.t('designContests.pastTitle') }] as shelf (shelf.title)}
			{#if shelf.rows.length > 0}
				<section class="mb-12">
					<h2 class="mb-5 text-xs font-bold uppercase tracking-wider text-accent">
						{shelf.title}
					</h2>
					<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{#each shelf.rows as contest (contest.id)}
							<ContestCard {contest} />
						{/each}
					</div>
				</section>
			{/if}
		{/each}
	{/if}

	<p class="mt-8 border-t border-border pt-6 text-sm text-text-muted">
		{i18n.t('designContests.awardsNotice')}
		<a href="/design/awards" class="ml-1 text-accent underline-offset-4 hover:underline">
			{i18n.t('designAwards.title')}
		</a>
	</p>
</div>
