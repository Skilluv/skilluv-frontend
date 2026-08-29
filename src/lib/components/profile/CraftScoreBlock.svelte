<script lang="ts">
	/**
	 * The score, its tier and what counted — for the nested `CraftScore` shape.
	 *
	 * Six of the eight domains return it this way (design, code, quality, ops,
	 * leadership, security); `ai` and `audio` return the same six fields
	 * flattened, which is why `CraftSection` exists alongside. Reconciling that
	 * is a backend ticket; here the point is that the *drawing* of a score
	 * happens once, whichever domain asked for it.
	 */
	import { i18n } from '$lib/i18n';
	import Badge from '$components/ui/Badge.svelte';
	import type { CraftScoreValue } from '$types';

	interface Props {
		score: CraftScoreValue;
		/** Extra line under the tier, when the domain has one worth saying. */
		note?: string;
	}

	let { score, note }: Props = $props();

	let open = $state(false);

	/** Terms that actually contributed, biggest first. */
	let contributing = $derived(
		score.breakdown.filter((t) => t.points > 0).sort((a, b) => b.points - a.points)
	);

	let pct = $derived.by(() => {
		const next = score.next_tier_at;
		if (!next || next <= 0) return 100;
		return Math.min(100, Math.round((score.score / next) * 100));
	});

	/** A counting term is whole; a scaled one arrives as a raw figure. */
	function fmtMeasured(value: number): string {
		return Number.isInteger(value) ? String(value) : value.toFixed(1);
	}
</script>

<div>
	<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
		{i18n.t('craftProfile.craftScoreTitle')}
	</p>
	<div class="mt-2 flex flex-wrap items-baseline gap-3">
		<span class="font-mono text-4xl font-black text-text-primary">
			{score.score.toLocaleString()}
		</span>
		<Badge variant="accent" size="sm">
			{i18n.t('craftProfile.tierLabel', { name: score.tier_name })}
		</Badge>
		{#if score.capped}
			<span class="text-xs text-text-muted">{i18n.t('craftProfile.cappedNotice')}</span>
		{/if}
	</div>
	<p class="mt-1 text-sm text-text-muted">{score.tier_description}</p>
	{#if note}
		<p class="mt-1 text-xs text-text-muted">{note}</p>
	{/if}

	{#if score.next_tier_at}
		<div class="mt-3">
			<div
				class="h-2 w-full overflow-hidden rounded-full bg-surface-overlay"
				role="progressbar"
				aria-valuenow={pct}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-label={i18n.t('craftProfile.craftScoreTitle')}
			>
				<div class="h-full rounded-full bg-accent" style="width: {pct}%"></div>
			</div>
			<p class="mt-1.5 text-xs text-text-muted">
				{i18n.t('craftProfile.nextTierAt', { n: score.next_tier_at.toLocaleString() })}
			</p>
		</div>
	{/if}

	{#if contributing.length > 0}
		<button
			type="button"
			onclick={() => (open = !open)}
			aria-expanded={open}
			class="mt-3 text-xs text-text-muted underline-offset-4 hover:text-text-primary hover:underline"
		>
			{i18n.t('craftProfile.breakdownTitle')}
		</button>
		{#if open}
			<ul class="mt-2 space-y-1.5" role="list">
				{#each contributing as term (term.term)}
					<li class="flex items-baseline justify-between gap-3 text-xs">
						<span class="text-text-primary">{term.explanation}</span>
						<span class="shrink-0 font-mono text-text-muted">
							{fmtMeasured(term.measured)} → +{term.points}
						</span>
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</div>
