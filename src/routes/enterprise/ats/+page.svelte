<script lang="ts">
	/**
	 * The applicant tracker, in the enterprise console.
	 *
	 * Seven endpoints served and none read. A company could pay for a plan it
	 * had no way to claim and open positions it had no way to see.
	 *
	 * ## Why it lives here and not in the member app
	 *
	 * Every row is scoped to the calling person's enterprise, and the backend
	 * refuses any cross-company read: *these rows belong to the company that
	 * entered them, and Skilluv holding them does not make them Skilluv's to
	 * read.* A tracker reachable from the member navigation would suggest
	 * otherwise.
	 *
	 * ## Retention sits next to the price
	 *
	 * `retention_days` decides whether a pipeline is still there when somebody
	 * comes back to it in three months. On a plan comparison that is not a
	 * footnote — it is half the decision — so it is rendered beside the fee
	 * rather than under a "details" link.
	 *
	 * ## What this page does not do
	 *
	 * It does not add candidates. A candidate is either a Skilluv member or an
	 * external person whose name and email a recruiter types in — somebody who
	 * never chose to be on this platform. That form needs its own thought about
	 * what is shown back and to whom, and guessing at it from a list page would
	 * be the wrong place to make that call. `atsApi.addCandidate` is ready.
	 */
	import { onMount } from 'svelte';
	import { Users } from '@lucide/svelte';
	import { atsApi, openingIsOpen, type AtsPlan, type Opening } from '$api/ats';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';

	let plans = $state<AtsPlan[]>([]);
	let current = $state<AtsPlan | null>(null);
	let openings = $state<Opening[]>([]);
	let loading = $state(true);
	let busy = $state<Record<string, boolean>>({});

	let live = $derived(openings.filter(openingIsOpen));
	let closed = $derived(openings.filter((o) => !openingIsOpen(o)));

	function money(amount: string, currency: string): string {
		const n = Number(amount);
		if (!Number.isFinite(n)) return `${amount} ${currency}`;
		return n.toLocaleString(i18n.locale, { style: 'currency', currency, maximumFractionDigits: 0 });
	}

	/** A null ceiling is unbounded, which is not the same as none. */
	function ceiling(n: number | null): string {
		return n === null ? i18n.t('ats.unlimited') : String(n);
	}

	async function load() {
		loading = true;
		const [p, s, o] = await Promise.allSettled([
			atsApi.plans(),
			atsApi.subscription(),
			atsApi.openings()
		]);
		if (p.status === 'fulfilled') plans = p.value.data?.plans ?? [];
		if (s.status === 'fulfilled') current = s.value.data?.plan ?? null;
		if (o.status === 'fulfilled') openings = o.value.data?.openings ?? [];
		loading = false;
	}

	async function run(key: string, fn: () => Promise<unknown>, done: string) {
		if (busy[key]) return;
		busy = { ...busy, [key]: true };
		try {
			await fn();
			toast.success(done);
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			busy = { ...busy, [key]: false };
		}
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('ats.title')} · Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-4xl space-y-8 px-4 py-8" data-testid="ats-page">
	<header class="space-y-2">
		<h1 class="flex items-center gap-2 text-2xl font-bold text-text-primary">
			<Users size={22} />
			{i18n.t('ats.title')}
		</h1>
		<p class="text-sm text-text-muted">{i18n.t('ats.subtitle')}</p>
	</header>

	{#if loading}
		<Skeleton class="h-64 w-full" rounded="xl" />
	{:else}
		<section class="space-y-3" data-testid="ats-plans">
			<h2 class="text-sm font-bold uppercase tracking-wider text-text-muted">
				{i18n.t('ats.plansTitle')}
			</h2>
			{#if current}
				<p class="text-sm text-text-muted">
					{i18n.t('ats.currentPlan', { plan: current.label })}
				</p>
			{:else}
				<!-- Nothing is assumed on a company that has not chosen, including
				     the free tier. So the state is "none", not "free". -->
				<p class="text-sm text-text-muted">{i18n.t('ats.noPlan')}</p>
			{/if}

			<ul class="grid gap-3 sm:grid-cols-2">
				{#each plans as plan (plan.slug)}
					{@const isCurrent = current?.slug === plan.slug}
					<li class="rounded-xl border border-border bg-surface-elevated p-4">
						<div class="flex flex-wrap items-start justify-between gap-2">
							<div class="min-w-0">
								<h3 class="text-sm font-bold text-text-primary">{plan.label}</h3>
								<p class="text-xs text-text-muted">
									{money(plan.monthly_fee, plan.currency)}
								</p>
							</div>
							{#if isCurrent}
								<Badge size="sm" variant="success">{i18n.t('ats.currentBadge')}</Badge>
							{:else}
								<Button
									size="sm"
									variant="ghost"
									loading={busy[plan.slug]}
									onclick={() =>
										run(plan.slug, () => atsApi.subscribe(plan.slug), i18n.t('ats.subscribed'))}
									data-testid="ats-subscribe"
								>
									{i18n.t('ats.chooseCta')}
								</Button>
							{/if}
						</div>

						<div class="mt-2 space-y-1 text-xs text-text-muted">
							<p>{i18n.t('ats.maxOpenings', { n: ceiling(plan.max_open_positions) })}</p>
							<p>
								{i18n.t('ats.maxCandidates', { n: ceiling(plan.max_candidates_per_opening) })}
							</p>
							<!-- Half the decision, so it sits with the price rather than
							     behind a details link. -->
							<p class="font-medium text-text-primary">
								{i18n.t('ats.retention', { n: plan.retention_days })}
							</p>
						</div>
					</li>
				{/each}
			</ul>
		</section>

		<section class="space-y-3" data-testid="ats-openings">
			<h2 class="text-sm font-bold uppercase tracking-wider text-text-muted">
				{i18n.t('ats.openingsTitle')}
			</h2>

			{#if openings.length === 0}
				<EmptyState title={i18n.t('ats.noOpenings')} body={i18n.t('ats.noOpeningsHint')} size="sm" />
			{:else}
				{#each [{ rows: live, title: i18n.t('ats.liveTitle') }, { rows: closed, title: i18n.t('ats.closedTitle') }] as shelf (shelf.title)}
					{#if shelf.rows.length > 0}
						<div class="space-y-2">
							<h3 class="text-xs font-bold uppercase tracking-wider text-text-muted">
								{shelf.title}
							</h3>
							<ul class="space-y-2">
								{#each shelf.rows as o (o.id)}
									<li class="rounded-xl border border-border bg-surface-elevated p-4">
										<div class="flex flex-wrap items-start justify-between gap-2">
											<div class="min-w-0 space-y-1">
												<h4 class="text-sm font-bold text-text-primary">{o.title}</h4>
												<p class="text-xs text-text-muted">
													{i18n.t('ats.positions', { n: o.positions_count })}
													{#if o.remote_ok}· {i18n.t('ats.remoteOk')}{/if}
													{#if o.location}· {o.location}{/if}
												</p>
											</div>
											{#if openingIsOpen(o)}
												<Button
													size="sm"
													variant="ghost"
													loading={busy[o.id]}
													onclick={() =>
														run(o.id, () => atsApi.closePosition(o.id), i18n.t('ats.closed'))}
													data-testid="ats-close"
												>
													{i18n.t('ats.closeCta')}
												</Button>
											{:else}
												<Badge size="sm">{o.status}</Badge>
											{/if}
										</div>
									</li>
								{/each}
							</ul>
						</div>
					{/if}
				{/each}
			{/if}
		</section>
	{/if}

	<!-- Said plainly, because a recruiter reading this page is the person who
	     decides what goes into it. -->
	<p class="text-xs text-text-muted">{i18n.t('ats.scopeNote')}</p>
</div>
