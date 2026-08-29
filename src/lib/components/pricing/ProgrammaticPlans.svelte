<script lang="ts">
	/**
	 * The two plans nobody buys on a whim: programmatic access to the talent
	 * score, and corporate learning seats.
	 *
	 * Both sit under the human pricing rather than beside it, because a person
	 * comparing subscriptions is not the person buying an API key — and a page
	 * that mixed them would make the ordinary reader scroll past a quota table
	 * to find their own price.
	 *
	 * ## Attribution is part of the price
	 *
	 * `attribution_required` obliges the caller to credit Skilluv wherever the
	 * score appears. That is a term of the licence, not a feature, and a
	 * company discovering it after integrating has been misled — so it renders
	 * with the quota rather than in a footnote.
	 *
	 * ## A null quota is unbounded, not zero
	 *
	 * The same distinction as everywhere else on this platform: absent and none
	 * are different facts, and rendering `null` as `0` would sell an unlimited
	 * plan as an empty one.
	 */
	import { onMount } from 'svelte';
	import { Terminal, GraduationCap } from '@lucide/svelte';
	import { plansApi, type ApiPlan, type LearningPlan } from '$api/finance_data';
	import { i18n } from '$lib/i18n';
	import Badge from '$components/ui/Badge.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';

	let apiPlans = $state<ApiPlan[]>([]);
	let learningPlans = $state<LearningPlan[]>([]);
	let loading = $state(true);

	let hasAnything = $derived(apiPlans.length > 0 || learningPlans.length > 0);

	function money(amount: string, currency: string): string {
		const n = Number(amount);
		if (!Number.isFinite(n)) return `${amount} ${currency}`;
		return n.toLocaleString(i18n.locale, { style: 'currency', currency, maximumFractionDigits: 0 });
	}

	/** Absent is unbounded. Rendering it as zero would sell the wrong plan. */
	function quota(n: number | null): string {
		return n === null ? i18n.t('programmaticPlans.unlimited') : n.toLocaleString(i18n.locale);
	}

	async function load() {
		loading = true;
		const [a, l] = await Promise.allSettled([plansApi.apiPlans(), plansApi.learningPlans()]);
		if (a.status === 'fulfilled') apiPlans = a.value.data?.plans ?? [];
		if (l.status === 'fulfilled') learningPlans = l.value.data?.plans ?? [];
		loading = false;
	}

	onMount(load);
</script>

{#if loading}
	<Skeleton class="h-32 w-full" rounded="xl" />
{:else if hasAnything}
	<div class="space-y-8" data-testid="programmatic-plans">
		{#if apiPlans.length > 0}
			<section class="space-y-3">
				<h2 class="flex items-center gap-2 text-lg font-semibold text-text-primary">
					<Terminal size={18} />
					{i18n.t('programmaticPlans.apiTitle')}
				</h2>
				<p class="text-sm text-text-muted">{i18n.t('programmaticPlans.apiSubtitle')}</p>

				<ul class="grid gap-3 sm:grid-cols-2">
					{#each apiPlans as plan (plan.slug)}
						<li class="rounded-xl border border-border bg-surface-elevated p-4">
							<div class="flex flex-wrap items-baseline justify-between gap-2">
								<h3 class="text-sm font-bold text-text-primary">{plan.label}</h3>
								<span class="text-sm text-text-muted">
									{money(plan.monthly_fee, plan.currency)}
								</span>
							</div>

							<div class="mt-2 space-y-1 text-xs text-text-muted">
								<p>
									{i18n.t('programmaticPlans.monthlyQuota', { n: quota(plan.monthly_quota) })}
								</p>
								<p>
									{i18n.t('programmaticPlans.dailyCeiling', { n: quota(plan.daily_ceiling) })}
								</p>
							</div>

							<div class="mt-2 flex flex-wrap gap-2">
								<!-- A term of the licence, not a feature. Discovering it after
								     integrating means having been misled. -->
								{#if plan.attribution_required}
									<Badge size="sm" variant="warning">
										{i18n.t('programmaticPlans.attributionRequired')}
									</Badge>
								{/if}
								{#if plan.sla}
									<Badge size="sm" variant="success">{i18n.t('programmaticPlans.sla')}</Badge>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if learningPlans.length > 0}
			<section class="space-y-3">
				<h2 class="flex items-center gap-2 text-lg font-semibold text-text-primary">
					<GraduationCap size={18} />
					{i18n.t('programmaticPlans.learningTitle')}
				</h2>
				<p class="text-sm text-text-muted">{i18n.t('programmaticPlans.learningSubtitle')}</p>

				<ul class="grid gap-3 sm:grid-cols-2">
					{#each learningPlans as plan (plan.slug)}
						<li class="rounded-xl border border-border bg-surface-elevated p-4">
							<div class="flex flex-wrap items-baseline justify-between gap-2">
								<h3 class="text-sm font-bold text-text-primary">{plan.label}</h3>
								<span class="text-sm text-text-muted">
									{i18n.t('programmaticPlans.perSeat', {
										amount: money(plan.monthly_fee_per_seat, plan.currency)
									})}
								</span>
							</div>
							{#if plan.features.length > 0}
								<ul class="mt-2 space-y-0.5 text-xs text-text-muted" role="list">
									{#each plan.features as f (f)}
										<li>{f}</li>
									{/each}
								</ul>
							{/if}
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	</div>
{/if}
