<script lang="ts">
	/**
	 * T-10 — the trust centre.
	 *
	 * Reads `GET /trust/summary`, which is the same rows the hall of fame reads
	 * plus what the platform says about itself. One source, so two pages cannot
	 * quote different numbers — the failure a trust page most needs to avoid,
	 * and the reason nothing here recomputes a statistic locally.
	 *
	 * The compliance block is the honest part and the page leans into it. The
	 * backend states GDPR as `self_assessed` with a note saying there is no
	 * external audit, and SOC 2 and ISO 27001 as `not_started`. All three are
	 * rendered the same way, in the same list, at the same size. A trust page
	 * that shows only what it has passed is a trust page nobody should trust.
	 */
	import { onMount } from 'svelte';
	import { ExternalLink, ShieldCheck } from '@lucide/svelte';
	import { securityApi } from '$api/security';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import type { TrustSummary } from '$types';

	let summary = $state<TrustSummary | null>(null);
	let loading = $state(true);
	let loadError = $state('');

	function stateLabel(state: string): string {
		const key = `securityTrust.states.${state}`;
		const translated = i18n.t(key);
		return translated === key ? state : translated;
	}

	function stateVariant(state: string): 'success' | 'warning' | 'default' {
		if (state === 'certified') return 'success';
		if (state === 'self_assessed' || state === 'in_progress') return 'warning';
		return 'default';
	}

	/** Turns `security_policy` into `Security policy` without inventing a
	 * translation for a key list that grows server-side. */
	function documentLabel(key: string): string {
		const words = key.replace(/_/g, ' ');
		return words.charAt(0).toUpperCase() + words.slice(1);
	}

	async function load() {
		loading = true;
		loadError = '';
		try {
			const res = await securityApi.trustSummary();
			summary = res.data ?? null;
		} catch (err) {
			summary = null;
			loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('securityTrust.title')} · Skilluv</title>
	<meta name="description" content={i18n.t('securityTrust.subtitle')} />
	<meta property="og:title" content={i18n.t('securityTrust.title')} />
	<meta property="og:description" content={i18n.t('securityTrust.subtitle')} />
</svelte:head>

<div class="mx-auto max-w-3xl space-y-8 px-4 py-8" data-testid="trust-page">
	<header class="space-y-2">
		<h1 class="flex items-center gap-2 text-2xl font-bold text-text">
			<ShieldCheck size={22} />
			{i18n.t('securityTrust.title')}
		</h1>
		<p class="text-sm text-text-muted">{i18n.t('securityTrust.subtitle')}</p>
	</header>

	{#if loading}
		<Skeleton class="h-96 w-full" rounded="xl" />
	{:else if loadError}
		<p class="rounded-lg border border-error/40 bg-error/5 px-4 py-3 text-sm text-error">
			{loadError}
		</p>
	{:else if summary}
		<section class="grid gap-3 sm:grid-cols-3" data-testid="trust-stats">
			{#each [{ n: summary.findings.confirmed, label: i18n.t('securityHallOfFame.statConfirmed') }, { n: summary.findings.fixed, label: i18n.t('securityHallOfFame.statFixed') }, { n: summary.findings.published, label: i18n.t('securityHallOfFame.statPublished') }] as stat (stat.label)}
				<div class="rounded-xl border border-border bg-surface-elevated p-4 text-center">
					<p class="text-2xl font-black text-text">{stat.n}</p>
					<p class="mt-1 text-xs text-text-muted">{stat.label}</p>
				</div>
			{/each}
		</section>
		<!-- Said out loud: the same rows as the hall of fame. Two pages quoting
		     different security numbers is the failure this page exists to avoid. -->
		<p class="text-xs text-text-muted" data-testid="trust-same-numbers">
			{i18n.t('securityTrust.sameNumbersNote')}
		</p>

		<section class="space-y-3" data-testid="trust-compliance">
			<div>
				<h2 class="text-sm font-bold uppercase tracking-wider text-text-muted">
					{i18n.t('securityTrust.complianceTitle')}
				</h2>
				<p class="mt-1 text-xs text-text-muted">{i18n.t('securityTrust.complianceHonesty')}</p>
			</div>
			<ul class="space-y-2">
				{#each summary.compliance as claim (claim.framework)}
					<li class="rounded-xl border border-border bg-surface-elevated p-4">
						<div class="flex flex-wrap items-center justify-between gap-2">
							<span class="text-sm font-bold text-text">{claim.framework}</span>
							<Badge variant={stateVariant(claim.state)} size="sm">
								{stateLabel(claim.state)}
							</Badge>
						</div>
						{#if claim.note}
							<p class="mt-1 text-sm text-text-muted">{claim.note}</p>
						{/if}
					</li>
				{/each}
			</ul>
		</section>

		<section class="rounded-xl border border-border bg-surface-elevated p-5 space-y-3">
			<h2 class="text-sm font-bold text-text">{i18n.t('securityTrust.programmeTitle')}</h2>
			<div class="flex flex-wrap items-center gap-2 text-sm">
				<Badge variant={summary.disclosure_programme.safe_harbour ? 'success' : 'default'}>
					{summary.disclosure_programme.safe_harbour
						? i18n.t('securityTrust.safeHarbour')
						: i18n.t('securityTrust.noSafeHarbour')}
				</Badge>
				<span class="text-text-muted">
					{i18n.t('securityScope.slaLabel', { n: summary.disclosure_programme.triage_sla_days })}
				</span>
				<span class="text-text-muted">
					{i18n.t('securityScope.embargoLabel', {
						n: summary.disclosure_programme.default_embargo_days
					})}
				</span>
			</div>
			<div class="flex flex-wrap gap-2">
				<Button href="/security" size="sm" variant="ghost">{i18n.t('securityScope.title')}</Button>
				<Button href="/security/hall-of-fame" size="sm" variant="ghost">
					{i18n.t('securityHallOfFame.title')}
				</Button>
			</div>
		</section>

		<div class="grid gap-6 sm:grid-cols-2">
			<section class="space-y-2">
				<h2 class="text-sm font-bold uppercase tracking-wider text-text-muted">
					{i18n.t('securityTrust.documentsTitle')}
				</h2>
				<ul class="space-y-1.5">
					{#each Object.entries(summary.documents) as [key, path] (key)}
						<li>
							<a
								href={path}
								target="_blank"
								rel="external noopener noreferrer"
								class="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
							>
								<ExternalLink size={13} />
								{documentLabel(key)}
							</a>
						</li>
					{/each}
				</ul>
			</section>

			<section class="space-y-2">
				<h2 class="text-sm font-bold uppercase tracking-wider text-text-muted">
					{i18n.t('securityTrust.scopeTitle')}
				</h2>
				<ul class="space-y-1.5">
					{#each summary.scope as host (host)}
						<li class="rounded-lg border border-border bg-surface px-3 py-1.5 font-mono text-xs text-text-muted">
							{host}
						</li>
					{/each}
				</ul>
			</section>
		</div>

		<section class="space-y-2">
			<h2 class="text-sm font-bold uppercase tracking-wider text-text-muted">
				{i18n.t('securityTrust.contactsTitle')}
			</h2>
			<ul class="flex flex-wrap gap-4 text-sm">
				{#each Object.entries(summary.contacts) as [role, address] (role)}
					<li class="text-text-muted">
						{documentLabel(role)} ·
						<a href="mailto:{address}" class="text-accent hover:underline">{address}</a>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</div>
