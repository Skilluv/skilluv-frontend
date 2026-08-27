<script lang="ts">
	/**
	 * One finding, as a stranger may read it.
	 *
	 * Public and unauthenticated, and everything identifying the defect is
	 * withheld until publication: no reproduction, no endpoint, no proof. What
	 * is shown before then is what a coordinated disclosure shows from outside
	 * — that somebody found something of this severity, in this weakness class,
	 * on this date. That is exactly the claim an attestation on this finding
	 * makes, which is why it has to be readable at all.
	 *
	 * So a null `title` is **not** missing data. It is the embargo working, and
	 * the page says so in as many words rather than rendering a blank heading
	 * that reads like a bug.
	 */
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { ExternalLink, Lock, ShieldCheck } from '@lucide/svelte';
	import { securityApi, isPublished } from '$api/security';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import type { FindingCard } from '$types';

	let id = $derived(page.params.id ?? '');

	let finding = $state<FindingCard | null>(null);
	let loading = $state(true);
	let missing = $state(false);

	let published = $derived(!!finding && isPublished(finding));

	function label(group: string, value: string): string {
		const key = `securityMyReports.${group}.${value}`;
		const translated = i18n.t(key);
		return translated === key ? value : translated;
	}

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}

	async function load() {
		loading = true;
		missing = false;
		try {
			const res = await securityApi.findingCard(id);
			finding = res.data?.finding ?? null;
			if (!finding) missing = true;
		} catch (err) {
			finding = null;
			missing = err instanceof SkilluError && err.status === 404;
		} finally {
			loading = false;
		}
	}

	onMount(load);
</script>

<svelte:head>
	<title>
		{finding?.title ?? i18n.t('securityFinding.title')} · Skilluv
	</title>
	{#if published && finding?.title}
		<meta property="og:title" content={finding.title} />
	{/if}
</svelte:head>

<div class="mx-auto max-w-2xl space-y-6 px-4 py-8" data-testid="security-finding-page">
	{#if loading}
		<Skeleton class="h-64 w-full" rounded="xl" />
	{:else if missing || !finding}
		<p class="rounded-xl border border-border bg-surface-elevated px-4 py-6 text-sm text-text-muted">
			{i18n.t('securityFinding.notFound')}
		</p>
	{:else}
		<header class="space-y-3">
			<div class="flex flex-wrap items-center gap-2">
				<Badge size="sm">{label('severities', finding.severity_tier)}</Badge>
				<Badge variant={published ? 'success' : 'default'} size="sm">
					{label('statuses', finding.status)}
				</Badge>
				{#if finding.disclosure_stage}
					<Badge size="sm" variant="default">{label('stages', finding.disclosure_stage)}</Badge>
				{/if}
			</div>

			<h1 class="flex items-start gap-2 text-2xl font-bold text-text">
				{#if published}
					<ShieldCheck size={22} class="mt-1 shrink-0" />
					{finding.title}
				{:else}
					<Lock size={22} class="mt-1 shrink-0" />
					{i18n.t('securityFinding.embargoedTitle')}
				{/if}
			</h1>
		</header>

		{#if !published}
			<!-- Not missing data: the embargo working. Said plainly, because a
			     blank heading reads like a bug and invites somebody to go
			     looking for the details elsewhere. -->
			<p
				class="rounded-xl border border-border bg-surface-elevated px-4 py-3 text-sm text-text-muted"
				data-testid="security-finding-embargoed"
			>
				{i18n.t('securityFinding.embargoedBody')}
			</p>
		{:else if finding.description_md}
			<p class="whitespace-pre-line text-sm text-text">{finding.description_md}</p>
		{/if}

		<dl class="grid gap-x-6 gap-y-2 rounded-xl border border-border bg-surface-elevated p-5 text-sm sm:grid-cols-2">
			<div class="flex flex-wrap justify-between gap-2">
				<dt class="text-text-muted">{i18n.t('securityFinding.reportedBy')}</dt>
				<dd class="text-text">
					{#if finding.reporter.username}
						<a href="/profile/{finding.reporter.username}" class="text-accent hover:underline">
							{finding.reporter.display_name ?? finding.reporter.username}
						</a>
					{:else}
						<span class="font-mono text-text-muted">{finding.reporter.alias}</span>
					{/if}
				</dd>
			</div>

			{#if finding.cvss_score !== null}
				<div class="flex flex-wrap justify-between gap-2">
					<dt class="text-text-muted">{i18n.t('securityFinding.cvssLabel')}</dt>
					<dd class="text-text">{finding.cvss_score}</dd>
				</div>
			{/if}

			{#if finding.cwe_id}
				<div class="flex flex-wrap justify-between gap-2">
					<dt class="text-text-muted">{i18n.t('securityFinding.cweLabel')}</dt>
					<dd class="font-mono text-text">{finding.cwe_id}</dd>
				</div>
			{/if}

			{#if finding.confirmed_at}
				<div class="flex flex-wrap justify-between gap-2">
					<dt class="text-text-muted">
						{i18n.t('securityFinding.confirmedOn', { date: fmtDate(finding.confirmed_at) })}
					</dt>
					<dd></dd>
				</div>
			{/if}

			{#if finding.published_at}
				<div class="flex flex-wrap justify-between gap-2">
					<dt class="text-text-muted">
						{i18n.t('securityFinding.publishedOn', { date: fmtDate(finding.published_at) })}
					</dt>
					<dd></dd>
				</div>
			{/if}
		</dl>

		{#if finding.writeup_url}
			<Button href={finding.writeup_url} size="sm" variant="ghost" target="_blank" rel="noopener noreferrer">
				<ExternalLink size={14} />
				{i18n.t('securityFinding.writeupCta')}
			</Button>
		{/if}
	{/if}
</div>
