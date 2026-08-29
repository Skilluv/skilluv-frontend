<script lang="ts">
	/**
	 * T-01 — the scope, and what the programme promises back.
	 *
	 * Unauthenticated, and that is the whole point: a researcher decides what
	 * to touch before they have an account, and a scope behind a login is a
	 * scope nobody reads. The same list that refuses a submission is what is
	 * served here, so the document and the enforcement cannot drift.
	 *
	 * Three rules this page follows without exception:
	 *
	 * 1. **Nothing is paraphrased.** `out_of_scope` is rendered line for line
	 *    as the server wrote it. A rule restated in the front's own words is a
	 *    rule somebody can argue with afterwards, which is precisely what a
	 *    safe harbour exists to prevent.
	 * 2. **The payout table is read, never printed.** `fragments_by_severity`
	 *    comes from `reference`; a figure hardcoded here would eventually be a
	 *    promise the platform does not keep.
	 * 3. **Research mode says what it does not grant.** A researcher who thinks
	 *    a token authorises them to test outside this list is one the safe
	 *    harbour will not protect, and the token page is not where they will
	 *    read that first.
	 */
	import { onMount } from 'svelte';
	import { ExternalLink, ShieldCheck, TriangleAlert } from '@lucide/svelte';
	import { securityApi } from '$api/security';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import { SEVERITY_TIERS, type SecurityReference, type SecurityScope } from '$types';

	let scope = $state<SecurityScope | null>(null);
	let reference = $state<SecurityReference | null>(null);
	let loading = $state(true);
	let loadError = $state('');

	/** Worst first, and only the tiers the server actually priced. */
	let pricedTiers = $derived(
		SEVERITY_TIERS.filter((t) => reference?.fragments_by_severity?.[t] !== undefined)
	);

	function severityLabel(tier: string): string {
		const key = `securityMyReports.severities.${tier}`;
		const translated = i18n.t(key);
		return translated === key ? tier : translated;
	}

	async function load() {
		loading = true;
		loadError = '';
		try {
			// Settled: the scope is the page's reason to exist and the reference
			// only enriches it, so a failure on the second must not hide the first.
			const [s, r] = await Promise.allSettled([securityApi.scope(), securityApi.reference()]);
			scope = s.status === 'fulfilled' ? (s.value.data ?? null) : null;
			reference = r.status === 'fulfilled' ? (r.value.data ?? null) : null;
			if (s.status === 'rejected') {
				loadError = s.reason instanceof SkilluError ? s.reason.message : i18n.t('errors.generic');
			}
		} finally {
			loading = false;
		}
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('securityScope.title')} · Skilluv</title>
	<meta name="description" content={i18n.t('securityScope.subtitle')} />
	<meta property="og:title" content={i18n.t('securityScope.title')} />
	<meta property="og:description" content={i18n.t('securityScope.subtitle')} />
</svelte:head>

<div class="mx-auto max-w-3xl space-y-8 px-4 py-8" data-testid="security-scope-page">
	<header class="space-y-2">
		<h1 class="flex items-center gap-2 text-2xl font-bold text-text">
			<ShieldCheck size={22} />
			{i18n.t('securityScope.title')}
		</h1>
		<p class="text-sm text-text-muted">{i18n.t('securityScope.subtitle')}</p>
	</header>

	{#if loading}
		<Skeleton class="h-96 w-full" rounded="xl" />
	{:else if loadError}
		<p class="rounded-lg border border-error/40 bg-error/5 px-4 py-3 text-sm text-error">
			{loadError}
		</p>
	{:else if scope}
		<section class="rounded-xl border border-success/40 bg-success/5 p-5">
			<h2 class="text-sm font-bold text-text">{i18n.t('securityScope.safeHarbourTitle')}</h2>
			<p class="mt-1 text-sm text-text-muted">{i18n.t('securityScope.safeHarbourBody')}</p>
			<div class="mt-3 flex flex-wrap items-center gap-3">
				<Button href="/security/report" size="sm">{i18n.t('securityScope.reportCta')}</Button>
				<Button href={scope.policy_url} size="sm" variant="ghost" target="_blank" rel="noopener noreferrer">
					<ExternalLink size={14} />
					{i18n.t('securityScope.policyCta')}
				</Button>
			</div>
		</section>

		<div class="grid gap-6 sm:grid-cols-2">
			<section class="space-y-2" data-testid="security-in-scope">
				<h2 class="text-sm font-bold uppercase tracking-wider text-text-muted">
					{i18n.t('securityScope.inScopeTitle')}
				</h2>
				<ul class="space-y-1.5">
					{#each scope.in_scope_hosts as host (host)}
						<li class="rounded-lg border border-border bg-surface-elevated px-3 py-2 font-mono text-sm text-text">
							{host}
						</li>
					{/each}
				</ul>
			</section>

			<section class="space-y-2" data-testid="security-out-of-scope">
				<h2 class="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-muted">
					<TriangleAlert size={14} />
					{i18n.t('securityScope.outOfScopeTitle')}
				</h2>
				<!-- Verbatim, line for line. A paraphrase of an out-of-scope rule
				     is a rule somebody can argue with after the fact. -->
				<ul class="space-y-1.5">
					{#each scope.out_of_scope as rule (rule)}
						<li class="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-muted">
							{rule}
						</li>
					{/each}
				</ul>
			</section>
		</div>

		<section class="flex flex-wrap gap-x-6 gap-y-2 rounded-xl border border-border bg-surface-elevated p-5 text-sm">
			<span class="text-text">{i18n.t('securityScope.slaLabel', { n: scope.triage_sla_days })}</span>
			<span class="text-text">
				{i18n.t('securityScope.embargoLabel', { n: scope.default_embargo_days })}
			</span>
			<span class="text-text-muted">
				{i18n.t('securityScope.contactLabel')} ·
				<a href="mailto:{scope.contact}" class="text-accent hover:underline">{scope.contact}</a>
			</span>
		</section>

		<section class="rounded-xl border border-border bg-surface-elevated p-5" data-testid="security-research-mode-note">
			<h2 class="text-sm font-bold text-text">{i18n.t('securityScope.researchModeTitle')}</h2>
			<p class="mt-1 text-sm text-text-muted">
				{i18n.t('securityScope.researchModeBody', { n: scope.research_mode.multiplier })}
			</p>
			<p class="mt-2 font-mono text-xs text-text-muted">{scope.research_mode.header}</p>
			<Button href="/security/research-mode" size="sm" variant="ghost" class="mt-3">
				{i18n.t('securityScope.researchModeCta')}
			</Button>
		</section>

		{#if pricedTiers.length > 0}
			<section class="space-y-2" data-testid="security-rewards">
				<div>
					<h2 class="text-sm font-bold uppercase tracking-wider text-text-muted">
						{i18n.t('securityScope.rewardsTitle')}
					</h2>
					<p class="mt-1 text-xs text-text-muted">{i18n.t('securityScope.rewardsHint')}</p>
				</div>
				<ul class="flex flex-wrap gap-2">
					{#each pricedTiers as tier (tier)}
						<li class="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm">
							<span class="font-medium text-text">{severityLabel(tier)}</span>
							<span class="ml-2 text-text-muted">
								{i18n.t('securityScope.fragmentsFor', {
									n: reference?.fragments_by_severity[tier] ?? 0
								})}
							</span>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if reference && reference.orientations.length > 0}
			<section class="space-y-2">
				<h2 class="text-sm font-bold uppercase tracking-wider text-text-muted">
					{i18n.t('securityScope.orientationsTitle')}
				</h2>
				<ul class="space-y-2">
					{#each reference.orientations as orientation (orientation.slug)}
						<li class="rounded-xl border border-border bg-surface-elevated p-4">
							<div class="flex flex-wrap items-center justify-between gap-2">
								<h3 class="text-sm font-bold text-text">{orientation.name}</h3>
								{#if orientation.reviewer_group}
									<Badge size="sm">
										{i18n.t('securityScope.reviewerGroup', { group: orientation.reviewer_group })}
									</Badge>
								{/if}
							</div>
							<p class="mt-1 text-sm text-text-muted">{orientation.description}</p>
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	{/if}
</div>
