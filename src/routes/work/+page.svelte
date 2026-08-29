<script lang="ts">
	/**
	 * SKI-325 — the three ways to work that are neither a challenge nor a
	 * mission.
	 *
	 * `/studios`, `/labs` and `/proposals` were all served and read by nothing,
	 * which left the platform looking like it knew exactly two modes: alone on
	 * a challenge, or hired for a mission. It knows five.
	 *
	 * ## Three sections because they are three different bargains
	 *
	 * A **studio** sells days as a standing team — you join people, not a task.
	 * A **lab** pays a community monthly to keep using a product and report on
	 * it; the money is a pool, not a fee. A **proposal** is the only one that
	 * runs backwards: a contributor noticed a problem and goes looking for the
	 * company, rather than a company arriving having already decided.
	 *
	 * That last inversion is why proposals carry a `facilitation_percent` and
	 * an initiator rather than an enterprise, and why the section says so. A
	 * reader who takes a proposal for a job posting will wait for a recruiter
	 * who is never coming.
	 *
	 * ## What this page does not do
	 *
	 * It lists and it joins. It does not draft proposals: drafting needs a
	 * slug, a problem statement and an approach, which is a writing surface and
	 * not a card with a button. `workApi.draftProposal` is ready for it.
	 *
	 * `POST /proposals/{id}/interest` is absent for a different reason — it is
	 * a *company* saying it has the problem, and belongs to the enterprise
	 * console rather than here.
	 */
	import { onMount } from 'svelte';
	import { Building2, FlaskConical, Lightbulb } from '@lucide/svelte';
	import { workApi, type Lab, type Proposal, type Studio } from '$api/work';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';

	let studios = $state<Studio[]>([]);
	let labs = $state<Lab[]>([]);
	let proposals = $state<Proposal[]>([]);
	let loading = $state(true);
	let busy = $state<Record<string, boolean>>({});

	let nothing = $derived(studios.length === 0 && labs.length === 0 && proposals.length === 0);

	function money(amount: string, currency: string): string {
		const n = Number(amount);
		if (!Number.isFinite(n)) return `${amount} ${currency}`;
		return n.toLocaleString(i18n.locale, { style: 'currency', currency, maximumFractionDigits: 0 });
	}

	async function load() {
		loading = true;
		// Three independent listings; one refusing must not blank the others.
		const [s, l, p] = await Promise.allSettled([
			workApi.studios(),
			workApi.labs(),
			workApi.proposals()
		]);
		if (s.status === 'fulfilled') studios = s.value.data?.studios ?? [];
		if (l.status === 'fulfilled') labs = l.value.data?.labs ?? [];
		if (p.status === 'fulfilled') proposals = p.value.data?.proposals ?? [];
		loading = false;
	}

	async function joinLab(id: string) {
		if (busy[id]) return;
		busy = { ...busy, [id]: true };
		try {
			await workApi.joinLab(id);
			toast.success(i18n.t('work.labJoined'));
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			busy = { ...busy, [id]: false };
		}
	}

	async function respond(id: string, accept: boolean) {
		if (busy[id]) return;
		busy = { ...busy, [id]: true };
		try {
			await workApi.respondToProposal(id, accept);
			toast.success(accept ? i18n.t('work.proposalAccepted') : i18n.t('work.proposalDeclined'));
			await load();
		} catch (err) {
			// 404 here means "you are not on this proposal", which is worth
			// showing as sent: it is a different thing from a failure.
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			busy = { ...busy, [id]: false };
		}
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('work.title')} · Skilluv</title>
	<meta name="description" content={i18n.t('work.subtitle')} />
	<meta property="og:title" content={i18n.t('work.title')} />
	<meta property="og:description" content={i18n.t('work.subtitle')} />
</svelte:head>

<div class="mx-auto max-w-3xl space-y-8 px-4 py-8" data-testid="work-page">
	<header class="space-y-2">
		<h1 class="text-2xl font-bold text-text">{i18n.t('work.title')}</h1>
		<p class="text-sm text-text-muted">{i18n.t('work.subtitle')}</p>
	</header>

	{#if loading}
		<Skeleton class="h-64 w-full" rounded="xl" />
	{:else if nothing}
		<EmptyState title={i18n.t('work.empty')} body={i18n.t('work.emptyHint')} size="sm" />
	{:else}
		{#if studios.length > 0}
			<section class="space-y-3" data-testid="work-studios">
				<h2 class="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-muted">
					<Building2 size={14} />
					{i18n.t('work.studiosTitle')}
				</h2>
				<!-- You join people, not a task. Said before the day rate, because
				     the rate is what makes it look like a job board. -->
				<p class="text-sm text-text-muted">{i18n.t('work.studiosHint')}</p>
				<ul class="space-y-3">
					{#each studios as s (s.id)}
						<li class="rounded-xl border border-border bg-surface-elevated p-4">
							<div class="flex flex-wrap items-start justify-between gap-2">
								<div class="min-w-0 space-y-1">
									<h3 class="text-sm font-bold text-text">{s.name}</h3>
									<p class="text-sm text-text-muted">{s.specialization}</p>
								</div>
								<Badge size="sm">{s.status}</Badge>
							</div>
							<div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
								<span>{i18n.t('work.dayRate', { amount: money(s.day_rate, s.currency) })}</span>
								<span>{i18n.t('work.maxMembers', { n: s.max_members })}</span>
								{#each s.domains as d (d)}
									<span
										class="rounded-full border border-border bg-surface-overlay px-2 py-0.5"
									>
										{d}
									</span>
								{/each}
							</div>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if labs.length > 0}
			<section class="space-y-3" data-testid="work-labs">
				<h2 class="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-muted">
					<FlaskConical size={14} />
					{i18n.t('work.labsTitle')}
				</h2>
				<!-- Monthly, and out of a pool rather than per head. Somebody
				     joining should know their share depends on who else joins. -->
				<p class="text-sm text-text-muted">{i18n.t('work.labsHint')}</p>
				<ul class="space-y-3">
					{#each labs as l (l.id)}
						<li class="rounded-xl border border-border bg-surface-elevated p-4">
							<div class="flex flex-wrap items-start justify-between gap-2">
								<div class="min-w-0 space-y-1">
									<h3 class="text-sm font-bold text-text">{l.product_name}</h3>
									<p class="text-sm text-text-muted">{l.scope_md}</p>
								</div>
								<Button size="sm" loading={busy[l.id]} onclick={() => joinLab(l.id)}>
									{i18n.t('work.joinCta')}
								</Button>
							</div>
							<div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
								<Badge size="sm" variant="accent">
									{i18n.t('work.monthlyPool', {
										amount: money(l.monthly_reward_pool, l.currency)
									})}
								</Badge>
								<span>{i18n.t('work.communityTarget', { n: l.community_target })}</span>
								{#each l.activity_types as a (a)}
									<span
										class="rounded-full border border-border bg-surface-overlay px-2 py-0.5"
									>
										{a}
									</span>
								{/each}
							</div>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if proposals.length > 0}
			<section class="space-y-3" data-testid="work-proposals">
				<h2 class="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-muted">
					<Lightbulb size={14} />
					{i18n.t('work.proposalsTitle')}
				</h2>
				<!-- The one that runs backwards. A reader who takes this for a job
				     posting will wait for a recruiter who is never coming. -->
				<p class="text-sm text-text-muted">{i18n.t('work.proposalsHint')}</p>
				<ul class="space-y-3">
					{#each proposals as p (p.id)}
						<li class="rounded-xl border border-border bg-surface-elevated p-4">
							<div class="flex flex-wrap items-start justify-between gap-2">
								<div class="min-w-0 space-y-1">
									<h3 class="text-sm font-bold text-text">{p.title}</h3>
									<p class="text-sm text-text-muted">{p.problem_md}</p>
								</div>
								<Badge size="sm">{p.status}</Badge>
							</div>

							<p class="mt-2 text-sm text-text-muted">{p.approach_md}</p>

							<div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
								{#if p.budget_estimate}
									<span>
										{i18n.t('work.budgetEstimate', {
											amount: money(p.budget_estimate, p.currency)
										})}
									</span>
								{/if}
								{#each p.target_industries as t (t)}
									<span
										class="rounded-full border border-border bg-surface-overlay px-2 py-0.5"
									>
										{t}
									</span>
								{/each}
							</div>

							{#if p.status === 'drafting'}
								<!-- Only somebody actually named on it can answer, and the
								     server says so with a 404 rather than a silent no-op. -->
								<div class="mt-3 flex flex-wrap gap-2">
									<Button size="sm" loading={busy[p.id]} onclick={() => respond(p.id, true)}>
										{i18n.t('work.acceptCta')}
									</Button>
									<Button
										size="sm"
										variant="ghost"
										loading={busy[p.id]}
										onclick={() => respond(p.id, false)}
									>
										{i18n.t('work.declineCta')}
									</Button>
								</div>
							{/if}
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	{/if}
</div>
