<script lang="ts">
	/**
	 * C-04 and C-05 — the annual awards edition and the design sprints, which
	 * are the same object read two ways.
	 *
	 * Migration 0249 is the argument this page is built on: neither is a new
	 * format. An awards edition is thirteen contests judged in parallel and
	 * read as one event; a sprint is a contest with a very short window, run
	 * again every few weeks. What both needed was a way to say *these contests
	 * are one thing*, and that is a series.
	 *
	 * So this page does not split them into two boards. It lists series, says
	 * which kind each is, and lets the detail page do the reading — because
	 * `kind` is stored precisely so one set of routes serves both without a
	 * client guessing from the number of contests.
	 *
	 * `/design/awards` is a different surface and stays: it is the nomination
	 * and vote machinery of an edition. This is how an edition is read once the
	 * contests inside it have concluded.
	 */
	import { onMount } from 'svelte';
	import { CalendarRange } from '@lucide/svelte';
	import { seriesApi, isRunning } from '$api/series';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import type { TournamentSeries } from '$types';

	let series = $state<TournamentSeries[]>([]);
	let loading = $state(true);
	let loadError = $state('');

	/**
	 * Design series, plus the ones open to every domain.
	 *
	 * Narrowed here because `GET /series` filters on `kind`, not on domain. A
	 * null `skill_domain` means the series is open to everybody, so it belongs
	 * on this page too.
	 */
	let visible = $derived(
		series.filter((s) => s.skill_domain === 'design' || s.skill_domain === null)
	);

	let running = $derived(visible.filter((s) => isRunning(s)));
	let others = $derived(visible.filter((s) => !isRunning(s)));

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

	async function load() {
		loading = true;
		loadError = '';
		try {
			const res = await seriesApi.list({ limit: 50 });
			series = res.data?.series ?? [];
		} catch (err) {
			series = [];
			loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('designSeries.title')} · Skilluv</title>
	<meta name="description" content={i18n.t('designSeries.subtitle')} />
	<meta property="og:title" content={i18n.t('designSeries.title')} />
	<meta property="og:description" content={i18n.t('designSeries.subtitle')} />
</svelte:head>

<div class="mx-auto max-w-3xl space-y-8 px-4 py-8" data-testid="design-series-page">
	<header class="space-y-2">
		<h1 class="flex items-center gap-2 text-2xl font-bold text-text">
			<CalendarRange size={22} />
			{i18n.t('designSeries.title')}
		</h1>
		<p class="text-sm text-text-muted">{i18n.t('designSeries.subtitle')}</p>
	</header>

	{#if loading}
		<Skeleton class="h-64 w-full" rounded="xl" />
	{:else if loadError}
		<p class="rounded-lg border border-error/40 bg-error/5 px-4 py-3 text-sm text-error">
			{loadError}
		</p>
	{:else if visible.length === 0}
		<EmptyState
			title={i18n.t('designSeries.empty')}
			body={i18n.t('designSeries.emptyHint')}
			size="sm"
		/>
	{:else}
		{#each [{ rows: running, title: i18n.t('designSeries.runningTitle') }, { rows: others, title: i18n.t('designSeries.pastTitle') }] as shelf (shelf.title)}
			{#if shelf.rows.length > 0}
				<section class="space-y-3">
					<h2 class="text-sm font-bold uppercase tracking-wider text-text-muted">
						{shelf.title}
					</h2>
					<ul class="space-y-3">
						{#each shelf.rows as row (row.slug)}
							<li
								class="rounded-xl border border-border bg-surface-elevated p-4"
								data-testid="design-series-row"
							>
								<div class="flex flex-wrap items-start justify-between gap-2">
									<div class="min-w-0 space-y-1">
										<h3 class="truncate text-sm font-bold text-text">{row.name}</h3>
										{#if row.description}
											<p class="text-sm text-text-muted">{row.description}</p>
										{/if}
									</div>
									<Button href="/design/series/{row.slug}" size="sm" variant="ghost">
										{i18n.t('designSeries.openCta')}
									</Button>
								</div>
								<div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
									<Badge size="sm" variant={isRunning(row) ? 'accent' : 'default'}>
										{kindLabel(row.kind)}
									</Badge>
									<span>{fmtDate(row.starts_at)} → {fmtDate(row.ends_at)}</span>
									{#if row.skill_domain === null}
										<span>{i18n.t('designSeries.everyDomain')}</span>
									{/if}
								</div>
							</li>
						{/each}
					</ul>
				</section>
			{/if}
		{/each}
	{/if}

	<div class="flex flex-wrap gap-2">
		<Button href="/design/contests" size="sm" variant="ghost">
			{i18n.t('designContests.title')}
		</Button>
		<Button href="/design/awards" size="sm" variant="ghost">{i18n.t('designAwards.title')}</Button>
	</div>
</div>
