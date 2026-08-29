<script lang="ts">
	/**
	 * T-05 — the hall of fame.
	 *
	 * Public and cached server-side, because it is a heavy read of a slowly
	 * changing set and it is the page a disclosure gets shared to.
	 *
	 * The anonymity handling is the part worth getting right. A reporter who
	 * asked not to be named comes back as `{ alias }` rather than `{ username }`
	 * — a stable per-person alias, so their entries group without identifying
	 * them. The page must never fall back to "unknown" or drop the row: they
	 * did the work, they are on the list, they simply chose the alias.
	 *
	 * `top_severity` arrives as a number, 5 for critical down to 1. It is a
	 * sort key, not a label, and is turned back into a word rather than printed.
	 */
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { ExternalLink, Trophy } from '@lucide/svelte';
	import { securityApi, severityFromRank } from '$api/security';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import Badge from '$components/ui/Badge.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import type { FindingReporter, HallOfFame } from '$types';
	import { FeaturedTalent } from '$components/domain';

	let board = $state<HallOfFame | null>(null);
	let loading = $state(true);
	let loadError = $state('');

	let isEmpty = $derived(
		!board || (board.top_contributors.length === 0 && board.recent_findings.length === 0)
	);

	function severityLabel(tier: string | null): string {
		if (!tier) return '';
		const key = `securityMyReports.severities.${tier}`;
		const translated = i18n.t(key);
		return translated === key ? tier : translated;
	}

	/** A name, or the stable alias of somebody who asked not to be named. */
	function reporterName(reporter: FindingReporter): string {
		return (
			reporter.display_name ??
			reporter.username ??
			reporter.alias ??
			i18n.t('securityFinding.anonymousReporter')
		);
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
			const res = await securityApi.hallOfFame();
			board = res.data ?? null;
		} catch (err) {
			board = null;
			loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('securityHallOfFame.title')} · Skilluv</title>
	<meta name="description" content={i18n.t('securityHallOfFame.subtitle')} />
	<meta property="og:title" content={i18n.t('securityHallOfFame.title')} />
	<meta property="og:description" content={i18n.t('securityHallOfFame.subtitle')} />
</svelte:head>

<div class="mx-auto max-w-3xl space-y-8 px-4 py-8" data-testid="security-hall-of-fame-page">
	<header class="space-y-2">
		<h1 class="flex items-center gap-2 text-2xl font-bold text-text">
			<Trophy size={22} />
			{i18n.t('securityHallOfFame.title')}
		</h1>
		<p class="text-sm text-text-muted">{i18n.t('securityHallOfFame.subtitle')}</p>
	</header>

	<!-- SKI-279 — the researcher of the week. `GET /featured/{domain}` serves
	     every domain from one route and had a design-only surface, so this one
	     was live and called by nothing. It belongs on the hall of fame rather
	     than on a page of its own: both answer "who does this platform put
	     forward", on different timescales. Renders its own empty state between
	     weeks. -->
	<FeaturedTalent domain="security" testPrefix="security" />

	{#if loading}
		<Skeleton class="h-80 w-full" rounded="xl" />
	{:else if loadError}
		<p class="rounded-lg border border-error/40 bg-error/5 px-4 py-3 text-sm text-error">
			{loadError}
		</p>
	{:else if isEmpty}
		<EmptyState
			title={i18n.t('securityHallOfFame.empty')}
			body={i18n.t('securityHallOfFame.emptyHint')}
			size="sm"
		/>
	{:else if board}
		<section class="grid gap-3 sm:grid-cols-3" data-testid="security-stats">
			{#each [{ n: board.stats.confirmed, label: i18n.t('securityHallOfFame.statConfirmed') }, { n: board.stats.published, label: i18n.t('securityHallOfFame.statPublished') }, { n: board.stats.reporters, label: i18n.t('securityHallOfFame.statReporters') }] as stat (stat.label)}
				<div class="rounded-xl border border-border bg-surface-elevated p-4 text-center">
					<p class="text-2xl font-black text-text">{stat.n}</p>
					<p class="mt-1 text-xs text-text-muted">{stat.label}</p>
				</div>
			{/each}
		</section>

		{#if board.stats.median_days_to_publication}
			<p class="text-xs text-text-muted">
				{board.stats.median_days_to_publication}
				{i18n.t('securityHallOfFame.statMedianDays')}
			</p>
		{/if}

		{#if board.top_contributors.length > 0}
			<section class="space-y-3">
				<h2 class="text-sm font-bold uppercase tracking-wider text-text-muted">
					{i18n.t('securityHallOfFame.contributorsTitle')}
				</h2>
				<ol class="space-y-2">
					{#each board.top_contributors as row, index (row.reporter.username ?? row.reporter.alias ?? index)}
						{@const named = !!row.reporter.username}
						<li
							class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-elevated p-4"
							data-testid="hall-of-fame-row"
						>
							<div class="flex min-w-0 items-center gap-3">
								<span class="w-6 shrink-0 text-center text-sm font-black text-text-muted">
									{index + 1}
								</span>
								{#if named && row.reporter.avatar_url}
									<img
										src={row.reporter.avatar_url}
										alt=""
										loading="lazy"
										class="h-9 w-9 rounded-full object-cover"
									/>
								{/if}
								<div class="min-w-0">
									{#if named}
										<a
											href={resolve(`/profile/${row.reporter.username}`)}
											class="truncate text-sm font-bold text-text hover:underline"
										>
											{row.reporter.display_name ?? row.reporter.username}
										</a>
									{:else}
										<!-- A stable alias, not a missing name: they did the work
										     and asked not to be listed under it. -->
										<span class="truncate font-mono text-sm text-text">{row.reporter.alias}</span>
										<p class="text-xs text-text-muted">{i18n.t('securityHallOfFame.anonymous')}</p>
									{/if}
									<p class="text-xs text-text-muted">
										{i18n.t('securityHallOfFame.since', { date: fmtDate(row.first_finding_at) })}
									</p>
								</div>
							</div>

							<div class="flex flex-wrap items-center gap-2">
								{#if row.rank}<Badge size="sm">{row.rank}</Badge>{/if}
								<Badge variant="accent" size="sm">
									{i18n.t('securityHallOfFame.findingCount', { n: row.findings })}
								</Badge>
								{#if severityFromRank(row.top_severity)}
									<span class="text-xs text-text-muted">
										{i18n.t('securityHallOfFame.topSeverity', {
											tier: severityLabel(severityFromRank(row.top_severity))
										})}
									</span>
								{/if}
							</div>
						</li>
					{/each}
				</ol>
			</section>
		{/if}

		{#if board.recent_findings.length > 0}
			<section class="space-y-3">
				<h2 class="text-sm font-bold uppercase tracking-wider text-text-muted">
					{i18n.t('securityHallOfFame.recentTitle')}
				</h2>
				<ul class="space-y-2">
					{#each board.recent_findings as finding (finding.id)}
						<li class="rounded-xl border border-border bg-surface-elevated p-4">
							<div class="flex flex-wrap items-start justify-between gap-2">
								<a href={resolve(`/security/findings/${finding.id}`)} class="text-sm font-bold text-text hover:underline">
									{finding.title}
								</a>
								<Badge size="sm">{severityLabel(finding.severity_tier)}</Badge>
							</div>
							<div class="mt-1 flex flex-wrap items-center gap-3 text-xs text-text-muted">
								<span>{fmtDate(finding.published_at)}</span>
								<span>{reporterName(finding.reporter)}</span>
								{#if finding.writeup_url}
									<a
										href={finding.writeup_url}
										target="_blank"
										rel="external noopener noreferrer"
										class="inline-flex items-center gap-1 text-accent hover:underline"
									>
										<ExternalLink size={12} />
										{i18n.t('securityFinding.writeupCta')}
									</a>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	{/if}
</div>
