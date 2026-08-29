<script lang="ts">
	/**
	 * O-02 — what to spend this week on, in whichever domain asked.
	 *
	 * Challenges and contests arrive in one ranked list because they answer the
	 * same question for the reader. Two lists would make this component merge
	 * two rankings whose scores were never comparable, and would make "you have
	 * done three contests in a row" impossible to notice.
	 *
	 * Every row shows the clauses that earned it its points. That is not
	 * decoration either: a recommendation nobody can argue with is a
	 * recommendation nobody trusts, which is why the endpoint returns `reasons`
	 * at all.
	 *
	 * The hour-long cache is surfaced rather than hidden. A list that changed on
	 * every page load would stop reading as advice, and saying so is cheaper
	 * than a reader wondering why the order moved.
	 */
	import { onMount } from 'svelte';
	import { ArrowRight, RefreshCw, Sparkles } from '@lucide/svelte';
	import { dashboardApi } from '$api/dashboard';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import type { NextChallenge } from '$types';

	interface Props {
		/**
		 * Which domain to recommend within.
		 *
		 * Required rather than defaulted: the endpoint answers 400 for an
		 * account that never finished onboarding instead of guessing, and a
		 * default of `design` would have made a cyber surface silently
		 * recommend design work to a security researcher.
		 */
		domain: string;
		limit?: number;
		/** Drops the heading when the parent already has one. */
		bare?: boolean;
		/** Prefixes the testids, so each domain's list stays addressable. */
		testPrefix?: string;
	}

	let { domain, limit = 5, bare = false, testPrefix = domain }: Props = $props();

	let suggestions = $state<NextChallenge[]>([]);
	let cached = $state(false);
	let loading = $state(true);
	let loadError = $state('');

	function formatLabel(format: string): string {
		const key = `nextChallenges.formats.${format}`;
		const translated = i18n.t(key);
		return translated === key ? format : translated;
	}

	/**
	 * Where a suggestion points.
	 *
	 * `target_kind` is the authority when the server sends it: it names what
	 * the target *is*, so a third format or a moved route cannot silently send
	 * a click elsewhere. The format is only the fallback for a deployment that
	 * predates the field.
	 *
	 * A row with no slug is not linked at all rather than linked wrongly.
	 */
	function hrefFor(suggestion: NextChallenge): string | null {
		if (!suggestion.slug) return null;
		const kind = suggestion.target_kind ?? (suggestion.format === 'contest' ? 'tournament' : 'slice');
		if (kind === 'tournament') return `/tournaments/${suggestion.slug}`;
		if (kind === 'slice') return `/slices/${suggestion.id}`;
		// A kind this build has not heard of: better unlinked than wrong.
		return null;
	}

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, { day: 'numeric', month: 'short' });
	}

	async function load() {
		loading = true;
		loadError = '';
		try {
			const res = await dashboardApi.nextChallenges({ domain, limit });
			suggestions = res.data?.suggestions ?? [];
			cached = res.data?.cached ?? false;
		} catch (err) {
			suggestions = [];
			loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	onMount(load);
</script>

<section class="space-y-4" data-testid="{testPrefix}-next-challenges">
	{#if !bare}
		<header class="flex items-start justify-between gap-3">
			<div class="space-y-1">
				<h2 class="flex items-center gap-2 text-lg font-bold text-text">
					<Sparkles size={18} />
					{i18n.t('nextChallenges.title')}
				</h2>
				<p class="text-sm text-text-muted">{i18n.t('nextChallenges.subtitle')}</p>
			</div>
			<Button variant="ghost" size="sm" loading={loading} onclick={load}>
				<RefreshCw size={15} />
				{i18n.t('nextChallenges.refresh')}
			</Button>
		</header>
	{/if}

	{#if loading}
		<Skeleton class="h-40 w-full" rounded="xl" />
	{:else if loadError}
		<p class="rounded-lg border border-error/40 bg-error/5 px-4 py-3 text-sm text-error">
			{loadError}
		</p>
	{:else if suggestions.length === 0}
		<EmptyState
			title={i18n.t('nextChallenges.empty')}
			body={i18n.t('nextChallenges.emptyHint')}
			size="sm"
		/>
	{:else}
		<ul class="space-y-3">
			{#each suggestions as suggestion (suggestion.id)}
				{@const href = hrefFor(suggestion)}
				<li
					class="rounded-xl border border-border bg-surface-elevated p-4"
					data-testid="{testPrefix}-suggestion"
				>
					<div class="flex flex-wrap items-start justify-between gap-2">
						<div class="min-w-0 space-y-1">
							<h3 class="truncate text-sm font-bold text-text">{suggestion.title}</h3>
							<div class="flex flex-wrap items-center gap-2 text-xs text-text-muted">
								<Badge variant={suggestion.format === 'contest' ? 'accent' : 'default'}>
									{formatLabel(suggestion.format)}
								</Badge>
								{#if suggestion.family}<span>{suggestion.family}</span>{/if}
								{#if suggestion.difficulty !== null}
									<span>{i18n.t('nextChallenges.difficulty', { n: suggestion.difficulty })}</span>
								{/if}
								{#if suggestion.estimated_hours !== null}
									<span>{i18n.t('nextChallenges.hours', { n: suggestion.estimated_hours })}</span>
								{/if}
								{#if suggestion.closes_at}
									<span>{i18n.t('nextChallenges.closesAt', { date: fmtDate(suggestion.closes_at) })}</span>
								{/if}
							</div>
						</div>
						{#if href}
							<Button {href} size="sm" variant="ghost">
								{i18n.t('nextChallenges.openCta')}
								<ArrowRight size={15} />
							</Button>
						{/if}
					</div>

					{#if suggestion.reasons.length > 0}
						<div class="mt-3 border-t border-border pt-3">
							<span class="text-xs font-bold uppercase tracking-wider text-text-muted">
								{i18n.t('nextChallenges.whyTitle')}
							</span>
							<ul class="mt-1 space-y-0.5">
								{#each suggestion.reasons as reason (reason)}
									<li class="text-sm text-text-muted">{reason}</li>
								{/each}
							</ul>
						</div>
					{/if}
				</li>
			{/each}
		</ul>

		{#if cached}
			<p class="text-xs text-text-muted" data-testid="{testPrefix}-next-cached">
				{i18n.t('nextChallenges.cachedNote')}
			</p>
		{/if}
	{/if}
</section>
