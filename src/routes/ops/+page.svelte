<script lang="ts">
	/**
	 * The ops workbench: objectives, incidents, and cost work.
	 *
	 * Eleven endpoints served, one read. An operations person could be seen to
	 * have run something and had nowhere to record running it.
	 *
	 * ## Three sections because they are three different claims
	 *
	 * An **objective** is a promise made in advance and judged after. An
	 * **incident** is a thing that happened, and its value is in the postmortem
	 * and the follow-up actions rather than in the outage. **Cost work** is a
	 * saving, which is only an achievement once somebody checked the service
	 * still meets its objective — halving a bill by turning the service off is
	 * a saving too.
	 *
	 * ## What the page refuses to do
	 *
	 * It never computes a saving, a percentage or a duration. `record_cost_work`
	 * returns `annual_saving` and `reduction_percent` from the server, and the
	 * incident row carries its own minutes. A client that recomputed either
	 * would eventually disagree with the record, and the record is the thing
	 * somebody is judged on.
	 *
	 * It does not render an open objective as failed. `achieved_percent` is null
	 * while the window is still running, and "not yet measured" is not "missed"
	 * — reading a commitment as a verdict before its window closes is the one
	 * mistake this surface could make that would matter.
	 */
	import { onMount } from 'svelte';
	import { Activity, Gauge, PiggyBank } from '@lucide/svelte';
	import { opsApi, isResolved, objectiveMet, type Incident, type Objective } from '$api/ops';
	import { i18n } from '$lib/i18n';
	import Badge from '$components/ui/Badge.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';

	let objectives = $state<Objective[]>([]);
	let incidents = $state<Incident[]>([]);
	let loading = $state(true);

	let nothing = $derived(objectives.length === 0 && incidents.length === 0);

	const severityVariant: Record<string, 'error' | 'warning' | 'default'> = {
		sev1: 'error',
		sev2: 'error',
		sev3: 'warning',
		sev4: 'default'
	};

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	/** Minutes as a duration somebody reads, from the server's own number. */
	function fmtMinutes(m: number | null): string | null {
		if (m === null) return null;
		if (m < 60) return i18n.t('ops.minutes', { n: m });
		const h = Math.floor(m / 60);
		const rest = m % 60;
		return rest > 0 ? `${h}h${String(rest).padStart(2, '0')}` : `${h}h`;
	}

	async function load() {
		loading = true;
		const [o, i] = await Promise.allSettled([opsApi.objectives(), opsApi.incidents()]);
		if (o.status === 'fulfilled') objectives = o.value.data?.objectives ?? [];
		if (i.status === 'fulfilled') incidents = i.value.data?.incidents ?? [];
		loading = false;
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('ops.title')} · Skilluv</title>
	<meta name="description" content={i18n.t('ops.subtitle')} />
</svelte:head>

<div class="mx-auto max-w-3xl space-y-8 px-4 py-8" data-testid="ops-page">
	<header class="space-y-2">
		<h1 class="flex items-center gap-2 text-2xl font-bold text-text">
			<Activity size={22} />
			{i18n.t('ops.title')}
		</h1>
		<p class="text-sm text-text-muted">{i18n.t('ops.subtitle')}</p>
	</header>

	{#if loading}
		<Skeleton class="h-64 w-full" rounded="xl" />
	{:else if nothing}
		<EmptyState title={i18n.t('ops.empty')} body={i18n.t('ops.emptyHint')} size="sm" />
	{:else}
		{#if objectives.length > 0}
			<section class="space-y-3" data-testid="ops-objectives">
				<h2 class="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-muted">
					<Gauge size={14} />
					{i18n.t('ops.objectivesTitle')}
				</h2>
				<!-- A promise made in advance and judged after. -->
				<p class="text-sm text-text-muted">{i18n.t('ops.objectivesHint')}</p>
				<ul class="space-y-3">
					{#each objectives as o (o.id)}
						{@const met = objectiveMet(o)}
						{@const running = o.closed_at === null}
						<li class="rounded-xl border border-border bg-surface-elevated p-4">
							<div class="flex flex-wrap items-start justify-between gap-2">
								<div class="min-w-0 space-y-1">
									<h3 class="text-sm font-bold text-text">{o.service_name}</h3>
									<p class="text-xs text-text-muted">
										{i18n.t('ops.targetOver', {
											target: o.target_percent,
											days: o.window_days
										})}
									</p>
								</div>
								<!-- Open is open. "Not yet measured" is not "missed", and
								     rendering it as a failure would read a commitment as a
								     verdict before its window closed. -->
								{#if running}
									<Badge size="sm">{i18n.t('ops.running')}</Badge>
								{:else if met === true}
									<Badge size="sm" variant="success">{i18n.t('ops.met')}</Badge>
								{:else if met === false}
									<Badge size="sm" variant="warning">{i18n.t('ops.missed')}</Badge>
								{/if}
							</div>

							<div class="mt-2 flex flex-wrap items-center gap-x-3 text-xs text-text-muted">
								{#if o.achieved_percent}
									<span class="font-mono">{o.achieved_percent}%</span>
								{/if}
								{#if o.verified_at}
									<Badge size="sm" variant="success">{i18n.t('ops.verified')}</Badge>
								{:else if !running}
									<!-- Closed by its own owner and not yet checked by anybody
									     else. Said, because that is the difference between a
									     record and a claim. -->
									<span>{i18n.t('ops.selfReported')}</span>
								{/if}
								{#if o.public_observation}
									<span>{i18n.t('ops.observedOutside')}</span>
								{/if}
								{#if o.evidence_url}
									<a
										href={o.evidence_url}
										target="_blank"
										rel="external noopener noreferrer nofollow ugc"
										class="ml-auto text-accent hover:underline"
									>
										{i18n.t('ops.evidence')}
									</a>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if incidents.length > 0}
			<section class="space-y-3" data-testid="ops-incidents">
				<h2 class="text-sm font-bold uppercase tracking-wider text-text-muted">
					{i18n.t('ops.incidentsTitle')}
				</h2>
				<!-- The value is the postmortem and what was done after, not the
				     outage. -->
				<p class="text-sm text-text-muted">{i18n.t('ops.incidentsHint')}</p>
				<ul class="space-y-3">
					{#each incidents as inc (inc.id)}
						{@const detect = fmtMinutes(inc.time_to_detect_minutes)}
						{@const resolve = fmtMinutes(inc.time_to_resolve_minutes)}
						<li class="rounded-xl border border-border bg-surface-elevated p-4">
							<div class="flex flex-wrap items-start justify-between gap-2">
								<div class="min-w-0 space-y-1">
									<h3 class="text-sm font-bold text-text">{inc.title}</h3>
									<p class="text-xs text-text-muted">{fmtDate(inc.started_at)}</p>
								</div>
								<div class="flex flex-wrap items-center gap-2">
									<Badge size="sm" variant={severityVariant[inc.severity] ?? 'default'}>
										{inc.severity}
									</Badge>
									{#if !isResolved(inc)}
										<Badge size="sm" variant="warning">{i18n.t('ops.ongoing')}</Badge>
									{/if}
								</div>
							</div>

							<div class="mt-2 flex flex-wrap items-center gap-x-3 text-xs text-text-muted">
								{#if detect}
									<span>{i18n.t('ops.timeToDetect', { d: detect })}</span>
								{/if}
								{#if resolve}
									<span>{i18n.t('ops.timeToResolve', { d: resolve })}</span>
								{/if}
								{#if inc.postmortem_published_at}
									<Badge size="sm" variant="success">{i18n.t('ops.postmortemPublished')}</Badge>
								{:else if isResolved(inc)}
									<!-- Resolved and unwritten. The thing worth prompting, since
									     a postmortem nobody wrote is the incident wasted. -->
									<span class="text-warning">{i18n.t('ops.postmortemMissing')}</span>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	{/if}

	<!-- Cost work is recorded against a slice or a project, so it is entered
	     where that work is rather than from a page with a free-text scope. The
	     saving and the percentage come back computed by the server. -->
	<p class="flex items-center gap-2 text-xs text-text-muted">
		<PiggyBank size={14} />
		{i18n.t('ops.costWorkNote')}
	</p>
</div>
