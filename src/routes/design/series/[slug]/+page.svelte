<script lang="ts">
	/**
	 * One series, and every podium in it.
	 *
	 * This is the page an awards edition is actually read on: thirteen
	 * contests, each with its podium, under one name. A sprint reads the same
	 * way with one contest in it — which is why the backend stores `kind`
	 * rather than letting a client guess from the count.
	 *
	 * The podium lines here carry `username` and `display_name`, unlike a bare
	 * tournament leaderboard row. That is the difference that makes this page
	 * worth having: a series result can name its winners, where
	 * `/tournaments/[slug]` still has to rank anonymous participants.
	 */
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { Trophy } from '@lucide/svelte';
	import { seriesApi } from '$api/series';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import type { CategoryStanding, TournamentSeries } from '$types';

	let slug = $derived(page.params.slug ?? '');

	let series = $state<TournamentSeries | null>(null);
	let categories = $state<CategoryStanding[]>([]);
	let loading = $state(true);
	let missing = $state(false);
	let loadError = $state('');

	function kindLabel(kind: string): string {
		const key = `designSeries.kinds.${kind}`;
		const translated = i18n.t(key);
		return translated === key ? kind : translated;
	}

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	/** A podium line's name, or its UUID when the account is gone. */
	function entrantName(line: CategoryStanding['podium'][number]): string {
		return line.display_name ?? line.username ?? line.participant_id;
	}

	async function load() {
		loading = true;
		missing = false;
		loadError = '';
		try {
			const res = await seriesApi.standings(slug);
			series = res.data?.series ?? null;
			categories = res.data?.categories ?? [];
		} catch (err) {
			series = null;
			categories = [];
			if (err instanceof SkilluError && err.status === 404) missing = true;
			else loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	onMount(load);
</script>

<svelte:head>
	<title>{series?.name ?? i18n.t('designSeries.title')} · Skilluv</title>
	{#if series}
		<meta property="og:title" content={series.name} />
		{#if series.description}
			<meta property="og:description" content={series.description} />
		{/if}
	{/if}
</svelte:head>

<div class="mx-auto max-w-3xl space-y-8 px-4 py-8" data-testid="design-series-detail">
	{#if loading}
		<Skeleton class="h-64 w-full" rounded="xl" />
	{:else if missing}
		<p class="rounded-xl border border-border bg-surface-elevated px-4 py-6 text-sm text-text-muted">
			{i18n.t('designSeries.notFound')}
		</p>
	{:else if loadError}
		<p class="rounded-lg border border-error/40 bg-error/5 px-4 py-3 text-sm text-error">
			{loadError}
		</p>
	{:else if series}
		<header class="space-y-2">
			<h1 class="flex items-center gap-2 text-2xl font-bold text-text">
				<Trophy size={22} />
				{series.name}
			</h1>
			{#if series.description}
				<p class="text-sm text-text-muted">{series.description}</p>
			{/if}
			<div class="flex flex-wrap items-center gap-2 text-xs text-text-muted">
				<Badge size="sm">{kindLabel(series.kind)}</Badge>
				<span>{fmtDate(series.starts_at)} → {fmtDate(series.ends_at)}</span>
			</div>
		</header>

		{#if categories.length === 0}
			<EmptyState title={i18n.t('designSeries.noStandings')} size="sm" />
		{:else}
			<ul class="space-y-4">
				{#each categories as standing (standing.tournament_id)}
					<li
						class="rounded-xl border border-border bg-surface-elevated p-5"
						data-testid="design-series-category"
					>
						<div class="flex flex-wrap items-start justify-between gap-2">
							<div class="min-w-0">
								{#if standing.category}
									<p class="text-xs font-bold uppercase tracking-wider text-text-muted">
										{standing.category}
									</p>
								{/if}
								<a
									href={resolve(`/design/contests/${standing.tournament_slug}`)}
									class="text-sm font-bold text-text hover:underline"
								>
									{standing.tournament_name}
								</a>
							</div>
							<span class="text-xs text-text-muted">{fmtDate(standing.ends_at)}</span>
						</div>

						{#if standing.podium.length === 0}
							<p class="mt-2 text-sm text-text-muted">
								{i18n.t('designSeries.noPodium')}
							</p>
						{:else}
							<ol class="mt-3 space-y-1.5">
								{#each standing.podium as line (line.participant_id)}
									<li class="flex flex-wrap items-center justify-between gap-2 text-sm">
										<span class="flex items-center gap-2">
											<span class="w-6 text-center font-black text-text-muted">#{line.rank}</span>
											<!-- Named, unlike a bare tournament leaderboard: this
											     payload joins the identity. -->
											{#if line.username}
												<a href={resolve(`/profile/${line.username}`)} class="text-text hover:underline">
													{entrantName(line)}
												</a>
											{:else}
												<span class="font-mono text-xs text-text-muted">{entrantName(line)}</span>
											{/if}
										</span>
										<span class="font-medium text-text">{line.score.toLocaleString()}</span>
									</li>
								{/each}
							</ol>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}

		<Button href="/design/series" size="sm" variant="ghost">
			{i18n.t('designSeries.backCta')}
		</Button>
	{/if}
</div>
