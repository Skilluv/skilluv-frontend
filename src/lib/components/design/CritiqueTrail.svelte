<script lang="ts">
	/**
	 * The critique trail on a design slice: every round, the automatic checks,
	 * and a comparison between any two rounds.
	 *
	 * Consumes W-08 (`/auto-checks`) and W-09 (`/reviews`, `/compare`,
	 * `/versions/{round}`), all four of which are public — deliberately, and the
	 * component says so. The backend's argument is that the sequence of rounds
	 * is the most convincing thing a designer can show, and hiding it would
	 * leave a profile saying "validated" and nothing about how.
	 *
	 * Two things this must never do, both of which the backend is explicit
	 * about:
	 *
	 * 1. **Present a check as a verdict.** A version can carry an `error` and be
	 *    approved; a clean run followed by a rejection is the common case. The
	 *    checks section carries that sentence rather than colour-coding its way
	 *    into implying otherwise.
	 * 2. **Compute a diff.** `compare` returns both versions, everything said
	 *    between them, and a `diff_strategy` naming what is worth comparing for
	 *    this subtype. Rendering a pixel diff of somebody's Figma node is not
	 *    something a browser can honestly do, so the comparison is presented
	 *    side by side and the reader does the comparing.
	 */
	import { onMount } from 'svelte';
	import { AlertTriangle, ExternalLink, Info, ShieldAlert } from '@lucide/svelte';
	import { designApi } from '$api/design';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import Select from '$components/ui/Select.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import type { DesignAutoCheck, DesignComparison, DesignReviewRound } from '$types';

	interface Props {
		sliceId: string;
		/** What the brief announced, when the slice carries it. Shown as a
		 * record, never as a gate: the five-round ceiling is enforced on the
		 * decision journal server-side, not here. */
		expectedRounds?: number | null;
	}

	let { sliceId, expectedRounds = null }: Props = $props();

	let rounds = $state<DesignReviewRound[]>([]);
	let checks = $state<DesignAutoCheck[]>([]);
	let loading = $state(true);
	let loadError = $state('');

	let compareFrom = $state<number>(1);
	let compareTo = $state<number>(2);
	let comparison = $state<DesignComparison | null>(null);
	let comparing = $state(false);
	let compareError = $state('');

	let roundOptions = $derived(
		rounds.map((r) => ({
			value: r.round,
			label: i18n.t('designWorkshop.roundLabel', { n: r.round })
		}))
	);

	let canCompare = $derived(rounds.length >= 2 && compareFrom < compareTo);

	/** Checks grouped by the round they ran on, so they read next to the
	 * critique that closed that round rather than as one undated list. */
	let checksByRound = $derived.by(() => {
		const map = new Map<number, DesignAutoCheck[]>();
		for (const check of checks) {
			const bucket = map.get(check.round);
			if (bucket) bucket.push(check);
			else map.set(check.round, [check]);
		}
		return map;
	});

	function decisionLabel(decision: string | null): string {
		if (!decision) return i18n.t('designWorkshop.decisions.pending');
		const key = `designWorkshop.decisions.${decision}`;
		const translated = i18n.t(key);
		return translated === key ? decision : translated;
	}

	function decisionVariant(decision: string | null): 'success' | 'warning' | 'error' | 'default' {
		if (decision === 'approve') return 'success';
		if (decision === 'iterate') return 'warning';
		if (decision === 'reject') return 'error';
		return 'default';
	}

	function severityLabel(severity: string): string {
		const key = `designWorkshop.severities.${severity}`;
		const translated = i18n.t(key);
		return translated === key ? severity : translated;
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
			// Both are public and independent; a slice with no automatic check
			// configured still has a trail worth reading, so a failure on one
			// must not blank the other.
			const [trail, ran] = await Promise.allSettled([
				designApi.reviewHistory(sliceId),
				designApi.autoChecks(sliceId)
			]);

			if (trail.status === 'fulfilled') {
				rounds = trail.value.data?.rounds ?? [];
			} else {
				loadError =
					trail.reason instanceof SkilluError
						? trail.reason.message
						: i18n.t('errors.generic');
			}

			checks = ran.status === 'fulfilled' ? (ran.value.data?.checks ?? []) : [];

			if (rounds.length >= 2) {
				compareFrom = rounds[rounds.length - 2].round;
				compareTo = rounds[rounds.length - 1].round;
			}
		} finally {
			loading = false;
		}
	}

	async function runCompare() {
		if (!canCompare) {
			compareError = i18n.t('designWorkshop.compareSameRound');
			return;
		}
		comparing = true;
		compareError = '';
		try {
			const res = await designApi.compare(sliceId, compareFrom, compareTo);
			comparison = res.data?.comparison ?? null;
		} catch (err) {
			comparison = null;
			compareError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			comparing = false;
		}
	}

	onMount(load);

	export function refresh() {
		return load();
	}
</script>

{#if loading}
	<Skeleton class="h-64 w-full" rounded="xl" />
{:else}
	<section class="space-y-6" data-testid="design-critique-trail">
		<header class="space-y-1">
			<h2 class="text-lg font-bold text-text">{i18n.t('designWorkshop.trailTitle')}</h2>
			<p class="text-xs text-text-muted">{i18n.t('designWorkshop.trailPublicNote')}</p>
			{#if expectedRounds}
				<p class="text-xs text-text-muted" data-testid="design-rounds-used">
					{i18n.t('designWorkshop.roundsUsed', {
						used: rounds.length,
						expected: expectedRounds
					})}
					<span class="ml-1">{i18n.t('designWorkshop.roundsCeiling')}</span>
				</p>
			{/if}
		</header>

		{#if loadError}
			<p class="rounded-lg border border-error/40 bg-error/5 px-4 py-3 text-sm text-error">
				{loadError}
			</p>
		{:else if rounds.length === 0}
			<p class="rounded-lg border border-border bg-surface-elevated px-4 py-6 text-sm text-text-muted">
				{i18n.t('designWorkshop.trailEmpty')}
			</p>
		{:else}
			<ol class="space-y-4">
				{#each rounds as round (round.round)}
					<li
						class="rounded-xl border border-border bg-surface-elevated p-5"
						data-testid="design-round"
					>
						<div class="flex flex-wrap items-center justify-between gap-2">
							<span class="text-sm font-bold text-text">
								{i18n.t('designWorkshop.roundLabel', { n: round.round })}
							</span>
							<div class="flex items-center gap-2">
								<Badge variant={decisionVariant(round.decision)}>
									{decisionLabel(round.decision)}
								</Badge>
								<span class="text-xs text-text-muted">{fmtDate(round.decided_at)}</span>
							</div>
						</div>

						{#if round.reviewed_artifact_url}
							<a
								href={round.reviewed_artifact_url}
								target="_blank"
								rel="noopener noreferrer"
								class="mt-3 inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
							>
								<ExternalLink size={14} />
								{i18n.t('designWorkshop.openArtifact')}
							</a>
						{/if}

						{#if round.reviewed_artifact_notes_md}
							<div class="mt-3">
								<span class="text-xs font-bold uppercase tracking-wider text-text-muted">
									{i18n.t('designWorkshop.authorNotes')}
								</span>
								<p class="mt-1 whitespace-pre-line text-sm text-text">
									{round.reviewed_artifact_notes_md}
								</p>
							</div>
						{/if}

						{#if round.blocking_reason}
							<div class="mt-3">
								<span class="text-xs font-bold uppercase tracking-wider text-text-muted">
									{i18n.t('designWorkshop.blockingReason')}
								</span>
								<p class="mt-1 text-sm text-text">{round.blocking_reason}</p>
							</div>
						{/if}

						{#if round.reason}
							<div class="mt-3">
								<span class="text-xs font-bold uppercase tracking-wider text-text-muted">
									{i18n.t('designWorkshop.reviewerFeedback')}
								</span>
								<p class="mt-1 whitespace-pre-line text-sm text-text">{round.reason}</p>
							</div>
						{/if}

						{#if round.grid_scores && Object.keys(round.grid_scores).length > 0}
							<div class="mt-3">
								<span class="text-xs font-bold uppercase tracking-wider text-text-muted">
									{i18n.t('designWorkshop.gridTitle')}
								</span>
								<dl class="mt-1 grid gap-x-4 gap-y-1 sm:grid-cols-2">
									{#each Object.entries(round.grid_scores) as [criterion, value] (criterion)}
										<div class="flex items-baseline justify-between gap-3 text-sm">
											<dt class="text-text-muted">{criterion}</dt>
											<dd class="font-medium text-text">{String(value)}</dd>
										</div>
									{/each}
								</dl>
							</div>
						{/if}

						{#if checksByRound.get(round.round)}
							<ul class="mt-3 space-y-1.5 border-t border-border pt-3">
								{#each checksByRound.get(round.round) ?? [] as check (check.check_type + check.ran_at)}
									<li class="flex items-start gap-2 text-sm">
										{#if check.severity === 'error'}
											<ShieldAlert size={15} class="mt-0.5 shrink-0 text-error" />
										{:else if check.severity === 'warning'}
											<AlertTriangle size={15} class="mt-0.5 shrink-0 text-warning" />
										{:else}
											<Info size={15} class="mt-0.5 shrink-0 text-text-muted" />
										{/if}
										<span class="text-text">
											<span class="text-text-muted">{severityLabel(check.severity)} · </span>
											{check.message}
										</span>
									</li>
								{/each}
							</ul>
						{/if}
					</li>
				{/each}
			</ol>
		{/if}

		{#if checks.length > 0}
			<p
				class="rounded-lg border border-border bg-surface px-4 py-3 text-xs text-text-muted"
				data-testid="design-checks-disclaimer"
			>
				{i18n.t('designWorkshop.checksNotAVerdict')}
			</p>
		{/if}

		{#if rounds.length >= 2}
			<section class="rounded-xl border border-border bg-surface-elevated p-5">
				<h3 class="text-sm font-bold text-text">{i18n.t('designWorkshop.compareTitle')}</h3>
				<div class="mt-3 flex flex-wrap items-end gap-3">
					<label class="flex flex-col gap-1 text-xs text-text-muted">
						{i18n.t('designWorkshop.compareFrom')}
						<Select items={roundOptions} bind:value={compareFrom} shape="rounded" size="sm" />
					</label>
					<label class="flex flex-col gap-1 text-xs text-text-muted">
						{i18n.t('designWorkshop.compareTo')}
						<Select items={roundOptions} bind:value={compareTo} shape="rounded" size="sm" />
					</label>
					<Button size="sm" loading={comparing} disabled={!canCompare} onclick={runCompare}>
						{i18n.t('designWorkshop.compareCta')}
					</Button>
				</div>

				{#if compareError}
					<p class="mt-3 text-sm text-error">{compareError}</p>
				{/if}

				{#if comparison}
					<div class="mt-4 space-y-4" data-testid="design-comparison">
						<div>
							<span class="text-xs font-bold uppercase tracking-wider text-text-muted">
								{i18n.t('designWorkshop.compareStrategy')}
							</span>
							<p class="mt-1 text-sm text-text">
								{comparison.diff_strategy ?? i18n.t('designWorkshop.compareStrategyUnknown')}
							</p>
						</div>

						<div class="grid gap-4 sm:grid-cols-2">
							{#each [comparison.from, comparison.to] as version (version.round)}
								<div class="rounded-lg border border-border bg-surface p-4">
									<div class="flex items-center justify-between gap-2">
										<span class="text-sm font-bold text-text">
											{i18n.t('designWorkshop.roundLabel', { n: version.round })}
										</span>
										<Badge variant={decisionVariant(version.decision)}>
											{decisionLabel(version.decision)}
										</Badge>
									</div>
									{#if version.artifact_url}
										<a
											href={version.artifact_url}
											target="_blank"
											rel="noopener noreferrer"
											class="mt-2 inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
										>
											<ExternalLink size={14} />
											{i18n.t('designWorkshop.openArtifact')}
										</a>
									{/if}
									{#if version.author_notes_md}
										<p class="mt-2 whitespace-pre-line text-sm text-text-muted">
											{version.author_notes_md}
										</p>
									{/if}
								</div>
							{/each}
						</div>

						{#if comparison.critiques_between.length > 0}
							<div>
								<span class="text-xs font-bold uppercase tracking-wider text-text-muted">
									{i18n.t('designWorkshop.compareBetween')}
								</span>
								<ul class="mt-2 space-y-2">
									{#each comparison.critiques_between as between (between.round)}
										<li class="rounded-lg border border-border bg-surface p-3 text-sm">
											<span class="font-medium text-text">
												{i18n.t('designWorkshop.roundLabel', { n: between.round })}
											</span>
											{#if between.reason}
												<p class="mt-1 whitespace-pre-line text-text-muted">{between.reason}</p>
											{/if}
										</li>
									{/each}
								</ul>
							</div>
						{/if}
					</div>
				{/if}
			</section>
		{/if}
	</section>
{/if}
