<script lang="ts">
	/**
	 * The reporter's own view of what they filed.
	 *
	 * Two things this page is built around.
	 *
	 * **An open round is the only thing that is actually waiting on somebody.**
	 * `open_round` is null on every report where nothing is expected of the
	 * reporter, so those rows are quiet and the ones that need an answer are
	 * loud. A page that shouted equally about all of them would be a page
	 * nobody reads twice.
	 *
	 * **`duplicate` and `not_applicable` are outcomes, not failures.** Somebody
	 * who found a real defect that had already been reported still did the
	 * work, and rendering their row in red teaches them not to bother next
	 * time. Both carry a line explaining what happened instead.
	 *
	 * The reporter's own severity is kept next to triage's, because the backend
	 * keeps both — `severity_reported_tier` alongside `severity_tier`. Showing
	 * only the second would quietly overwrite somebody's judgement with ours.
	 */
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { ExternalLink, MessageSquare, ShieldAlert } from '@lucide/svelte';
	import { securityApi } from '$api/security';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import type { MyFinding } from '$types';

	let reports = $state<MyFinding[]>([]);
	let loading = $state(true);
	let loadError = $state('');

	let answers = $state<Record<string, string>>({});
	let busy = $state<string | null>(null);

	/** Statuses from which a reporter may still take a report back. Anything
	 * further along has been acted on, and the server answers 409. */
	const WITHDRAWABLE = new Set(['submitted', 'triaged']);

	function label(group: string, value: string): string {
		const key = `securityMyReports.${group}.${value}`;
		const translated = i18n.t(key);
		return translated === key ? value : translated;
	}

	function statusVariant(status: string): 'success' | 'accent' | 'warning' | 'default' {
		if (status === 'published' || status === 'fixed') return 'success';
		if (status === 'confirmed') return 'accent';
		if (status === 'submitted' || status === 'triaged') return 'warning';
		// `duplicate`, `not_applicable` and `withdrawn` are neutral on purpose:
		// none of them is an error, and none should render as one.
		return 'default';
	}

	function statusHint(status: string): string | null {
		const key = `securityMyReports.statusHints.${status}`;
		const translated = i18n.t(key);
		return translated === key ? null : translated;
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
			const res = await securityApi.myReports();
			reports = res.data?.reports ?? [];
		} catch (err) {
			reports = [];
			loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	async function answer(id: string) {
		const text = (answers[id] ?? '').trim();
		if (!text) return;
		busy = id;
		try {
			await securityApi.answerRound(id, text);
			toast.success(i18n.t('securityMyReports.answeredToast'));
			answers = { ...answers, [id]: '' };
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			busy = null;
		}
	}

	async function withdraw(id: string) {
		busy = id;
		try {
			await securityApi.withdrawReport(id);
			toast.success(i18n.t('securityMyReports.withdrawnToast'));
			await load();
		} catch (err) {
			toast.error(
				err instanceof SkilluError && err.status === 409
					? i18n.t('securityMyReports.tooLateToWithdraw')
					: err instanceof SkilluError
						? err.message
						: i18n.t('errors.generic')
			);
		} finally {
			busy = null;
		}
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('securityMyReports.title')} · Skilluv</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-3xl space-y-6 px-4 py-8" data-testid="security-my-reports-page">
	<header class="flex flex-wrap items-start justify-between gap-3">
		<div class="space-y-1">
			<h1 class="flex items-center gap-2 text-2xl font-bold text-text">
				<ShieldAlert size={22} />
				{i18n.t('securityMyReports.title')}
			</h1>
			<p class="text-sm text-text-muted">{i18n.t('securityMyReports.subtitle')}</p>
		</div>
		<Button href="/security/report" size="sm">{i18n.t('securityScope.reportCta')}</Button>
	</header>

	{#if loading}
		<Skeleton class="h-64 w-full" rounded="xl" />
	{:else if loadError}
		<p class="rounded-lg border border-error/40 bg-error/5 px-4 py-3 text-sm text-error">
			{loadError}
		</p>
	{:else if reports.length === 0}
		<EmptyState
			title={i18n.t('securityMyReports.empty')}
			body={i18n.t('securityMyReports.emptyHint')}
			size="sm"
		/>
	{:else}
		<ul class="space-y-3">
			{#each reports as report (report.id)}
				{@const hint = statusHint(report.status)}
				<li class="rounded-xl border border-border bg-surface-elevated p-4" data-testid="security-report-row">
					<div class="flex flex-wrap items-start justify-between gap-2">
						<a href={resolve(`/security/findings/${report.id}`)} class="text-sm font-bold text-text hover:underline">
							{report.title}
						</a>
						<div class="flex flex-wrap items-center gap-2">
							<Badge size="sm">{label('severities', report.severity_tier)}</Badge>
							<Badge variant={statusVariant(report.status)} size="sm">
								{label('statuses', report.status)}
							</Badge>
						</div>
					</div>

					<div class="mt-1 flex flex-wrap items-center gap-3 text-xs text-text-muted">
						<span>{fmtDate(report.created_at)}</span>
						{#if report.target_host}<span class="font-mono">{report.target_host}</span>{/if}
						{#if report.cwe_id}<span>{report.cwe_id}</span>{/if}
						{#if report.severity_reported_tier && report.severity_reported_tier !== report.severity_tier}
							<!-- Both are kept server-side; showing only triage's would
							     quietly overwrite the reporter's judgement. -->
							<span>
								{i18n.t('securityMyReports.reportedAs', {
									tier: label('severities', report.severity_reported_tier)
								})}
							</span>
						{/if}
						{#if report.disclosure_stage}
							<span>{label('stages', report.disclosure_stage)}</span>
						{/if}
						{#if report.embargo_ends_at}
							<span>
								{i18n.t('securityMyReports.embargoUntil', {
									date: fmtDate(report.embargo_ends_at)
								})}
							</span>
						{/if}
					</div>

					{#if hint}
						<p class="mt-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-muted">
							{hint}
						</p>
					{/if}

					{#if report.open_round}
						<div
							class="mt-3 rounded-lg border border-warning/40 bg-warning/5 p-3 space-y-2"
							data-testid="security-open-round"
						>
							<p class="flex items-center gap-1.5 text-sm font-medium text-warning">
								<MessageSquare size={14} />
								{i18n.t('securityMyReports.openRoundTitle')}
							</p>
							<p class="whitespace-pre-line text-sm text-text">{report.open_round.notes_md}</p>
							<textarea
								bind:value={answers[report.id]}
								rows="3"
								placeholder={i18n.t('securityMyReports.answerPlaceholder')}
								class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
							></textarea>
							<Button
								size="sm"
								loading={busy === report.id}
								disabled={!(answers[report.id] ?? '').trim()}
								onclick={() => answer(report.id)}
							>
								{i18n.t('securityMyReports.answerCta')}
							</Button>
						</div>
					{/if}

					<div class="mt-3 flex flex-wrap items-center gap-3">
						{#if report.writeup_url}
							<a
								href={report.writeup_url}
								target="_blank"
								rel="external noopener noreferrer"
								class="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
							>
								<ExternalLink size={14} />
								{i18n.t('securityMyReports.writeupCta')}
							</a>
						{/if}
						{#if WITHDRAWABLE.has(report.status)}
							<Button
								variant="ghost"
								size="sm"
								loading={busy === report.id}
								onclick={() => withdraw(report.id)}
							>
								{i18n.t('securityMyReports.withdrawCta')}
							</Button>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>
