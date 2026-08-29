<script lang="ts">
	/**
	 * One tracked goal (SKI-38): where it stands, what is still missing, and
	 * how long the current pace says it will take.
	 *
	 * The per-criterion breakdown is the point — a bare percentage tells a
	 * user they are at 50% without telling them that the missing half is one
	 * attestation they cannot grind for.
	 */
	import { CalendarClock, Check, Trash2 } from '@lucide/svelte';
	import { i18n } from '$lib/i18n';
	import Badge from '$components/ui/Badge.svelte';
	import type { GoalProgress } from '$types';

	interface Props {
		progress: GoalProgress;
		ondelete?: (id: string) => void;
	}

	let { progress, ondelete }: Props = $props();

	let goal = $derived(progress.goal);
	let pct = $derived(Math.max(0, Math.min(100, progress.progress_pct)));

	/** Human target: a rank name, a capability label, a level, or a count. */
	let targetLabel = $derived.by(() => {
		switch (goal.kind) {
			case 'rank':
				return i18n.t(`common.titles.${goal.target_value}`);
			case 'capability':
				return i18n.t(`capabilities.items.${goal.target_value}.label`);
			case 'skill_level':
				return i18n.t('skillTree.levelLabel', { n: goal.target_value });
			default:
				return goal.target_value;
		}
	});

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	/** Criteria carry stable names; an unknown one falls back to its raw name. */
	function criterionLabel(name: string): string {
		const key = `goals.criteria.${name}`;
		const translated = i18n.t(key);
		return translated === key ? name : translated;
	}
</script>

<article
	class="rounded-2xl border bg-surface-elevated p-5 {progress.achieved
		? 'border-success/40'
		: 'border-border'}"
	data-testid="goal-card"
>
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div class="min-w-0 flex-1">
			<p class="text-xs uppercase tracking-wide text-text-muted">
				{i18n.t(`goals.kinds.${goal.kind}`)}
			</p>
			<h3 class="mt-1 text-lg font-bold text-text-primary">{targetLabel}</h3>
		</div>
		<div class="flex items-center gap-2">
			{#if progress.achieved}
				<Badge variant="success" size="sm">
					<span class="inline-flex items-center gap-1">
						<Check size={11} strokeWidth={3} />
						{i18n.t('goals.achievedLabel')}
					</span>
				</Badge>
			{/if}
			{#if goal.archived_at}
				<Badge size="sm">{i18n.t('goals.archivedLabel')}</Badge>
			{/if}
			{#if ondelete && !goal.archived_at}
				<button
					type="button"
					onclick={() => ondelete?.(goal.id)}
					aria-label={i18n.t('goals.deleteCta')}
					title={i18n.t('goals.deleteCta')}
					class="rounded-full border border-border p-2 text-text-muted transition-colors duration-200 hover:border-error hover:text-error"
				>
					<Trash2 size={14} strokeWidth={2} />
				</button>
			{/if}
		</div>
	</div>

	<div class="mt-4">
		<div class="mb-1.5 flex items-center justify-between text-xs">
			<span class="text-text-muted">{i18n.t('goals.progressLabel', { pct })}</span>
			<span class="text-text-muted">
				{#if progress.eta_days_at_current_pace !== null}
					{i18n.t('goals.etaDays', { n: progress.eta_days_at_current_pace })}
				{:else if !progress.achieved}
					{i18n.t('goals.etaUnknown')}
				{/if}
			</span>
		</div>
		<div
			class="h-2 w-full overflow-hidden rounded-full bg-surface-overlay"
			role="progressbar"
			aria-valuenow={pct}
			aria-valuemin={0}
			aria-valuemax={100}
			aria-label={targetLabel}
		>
			<div
				class="h-full rounded-full transition-all duration-500 {progress.achieved
					? 'bg-success'
					: 'bg-accent'}"
				style="width: {pct}%"
			></div>
		</div>
	</div>

	{#if progress.criteria.length > 0}
		<div class="mt-4">
			<p class="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
				{i18n.t('goals.criteriaTitle')}
			</p>
			<ul class="space-y-1.5" role="list">
				{#each progress.criteria as criterion (criterion.name)}
					{@const met = criterion.current >= criterion.required}
					<li class="flex items-center justify-between text-sm">
						<span class={met ? 'text-text-muted line-through' : 'text-text-primary'}>
							{criterionLabel(criterion.name)}
						</span>
						<span class="font-mono text-xs {met ? 'text-success' : 'text-text-muted'}">
							{i18n.t('goals.criteriaProgress', {
								current: criterion.current,
								required: criterion.required
							})}
						</span>
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<p class="mt-4 flex items-center gap-1.5 text-xs text-text-muted">
		<CalendarClock size={12} strokeWidth={2} />
		{#if goal.deadline}
			{i18n.t('goals.deadlineLabel', { date: fmtDate(goal.deadline) })}
		{:else}
			{i18n.t('goals.noDeadline')}
		{/if}
	</p>
</article>
