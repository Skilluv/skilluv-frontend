<script lang="ts">
	/**
	 * L-02 — one plagiarism case, from the accused's side.
	 *
	 * Readable by the accused and the reviewers, nobody else. A 403 here is the
	 * system working, and the page says so rather than showing a generic
	 * failure: an open accusation is an allegation, and publishing allegations
	 * before they are decided is how a dismissed case still ruins somebody.
	 *
	 * The answer box is the whole point of the flow. It is shown while the
	 * deadline stands and replaced by a plain statement once it has passed —
	 * never by a form that will be refused, which would waste somebody's
	 * defence on a request that cannot land.
	 */
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { ShieldAlert } from '@lucide/svelte';
	import { contestPlagiarismApi, respondWindowClosed } from '$api/contest_plagiarism';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import type { PlagiarismCase } from '$types';

	let caseId = $derived(page.params.id ?? '');

	let entry = $state<PlagiarismCase | null>(null);
	let loading = $state(true);
	let forbidden = $state(false);
	let loadError = $state('');

	let response = $state('');
	let sending = $state(false);

	let closed = $derived(!!entry && respondWindowClosed(entry));
	let canRespond = $derived(!!entry && !closed && !entry.responded_at);

	function statusLabel(status: string): string {
		const key = `designPlagiarism.statuses.${status}`;
		const translated = i18n.t(key);
		return translated === key ? status : translated;
	}

	function statusVariant(status: string): 'warning' | 'error' | 'success' | 'default' {
		if (status === 'open') return 'warning';
		if (status === 'upheld') return 'error';
		if (status === 'dismissed') return 'success';
		return 'default';
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
		forbidden = false;
		loadError = '';
		try {
			const res = await contestPlagiarismApi.read(caseId);
			entry = res.data ?? null;
		} catch (err) {
			entry = null;
			if (err instanceof SkilluError && err.status === 403) forbidden = true;
			else loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	async function respond() {
		if (!response.trim()) return;
		sending = true;
		try {
			await contestPlagiarismApi.respond(caseId, { response_md: response.trim() });
			toast.success(i18n.t('designPlagiarism.respondedToast'));
			response = '';
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			sending = false;
		}
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('designPlagiarism.caseTitle')} · Skilluv</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-2xl space-y-6 px-4 py-8">
	<h1 class="flex items-center gap-2 text-2xl font-bold text-text">
		<ShieldAlert size={22} />
		{i18n.t('designPlagiarism.caseTitle')}
	</h1>

	{#if loading}
		<Skeleton class="h-64 w-full" rounded="xl" />
	{:else if forbidden}
		<p
			class="rounded-lg border border-border bg-surface-elevated px-4 py-6 text-sm text-text-muted"
			data-testid="design-case-forbidden"
		>
			{i18n.t('designPlagiarism.caseNotYours')}
		</p>
	{:else if loadError}
		<p class="rounded-lg border border-error/40 bg-error/5 px-4 py-3 text-sm text-error">
			{loadError}
		</p>
	{:else if entry}
		<section
			class="rounded-xl border border-border bg-surface-elevated p-5 space-y-4"
			data-testid="design-plagiarism-case"
		>
			<div class="flex flex-wrap items-center justify-between gap-2">
				<Badge variant={statusVariant(entry.status)}>{statusLabel(entry.status)}</Badge>
				<span class="text-xs text-text-muted">
					{i18n.t('designPlagiarism.raisedAt', { date: fmtDate(entry.raised_at) })}
				</span>
			</div>

			<dl class="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
				{#if entry.accused_username}
					<div class="flex gap-2">
						<dt class="text-text-muted">{i18n.t('designPlagiarism.accusedLabel')}</dt>
						<dd class="text-text">{entry.accused_username}</dd>
					</div>
				{/if}
				{#if entry.raised_by_username}
					<div class="flex gap-2">
						<dt class="text-text-muted">{i18n.t('designPlagiarism.raisedByLabel')}</dt>
						<dd class="text-text">{entry.raised_by_username}</dd>
					</div>
				{/if}
			</dl>

			<div>
				<span class="text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.t('designPlagiarism.flagReason')}
				</span>
				<p class="mt-1 whitespace-pre-line text-sm text-text">{entry.reason_md}</p>
			</div>

			<div>
				<span class="text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.t('designPlagiarism.flagEvidence')}
				</span>
				<a
					href={entry.evidence_url}
					target="_blank"
					rel="external noopener noreferrer"
					class="mt-1 block break-all text-sm text-accent hover:underline"
				>
					{entry.evidence_url}
				</a>
			</div>

			{#if entry.upheld_against_accused > 0}
				<p class="text-xs text-text-muted">
					{i18n.t('designPlagiarism.priorCases', { n: entry.upheld_against_accused })}
				</p>
			{/if}

			{#if entry.response_md}
				<div class="rounded-lg border border-border bg-surface px-3 py-2">
					<span class="text-xs font-bold uppercase tracking-wider text-text-muted">
						{i18n.t('designPlagiarism.respondTitle')}
					</span>
					<p class="mt-1 whitespace-pre-line text-sm text-text">{entry.response_md}</p>
				</div>
			{/if}

			{#if entry.decision_md}
				<div class="rounded-lg border border-border bg-surface px-3 py-2">
					<span class="text-xs font-bold uppercase tracking-wider text-text-muted">
						{i18n.t('designPlagiarism.decisionTitle')}
					</span>
					<p class="mt-1 whitespace-pre-line text-sm text-text">{entry.decision_md}</p>
				</div>
			{/if}
		</section>

		{#if canRespond}
			<section
				class="rounded-xl border border-border bg-surface-elevated p-5 space-y-3"
				data-testid="design-plagiarism-respond"
			>
				<div>
					<h2 class="text-sm font-bold text-text">{i18n.t('designPlagiarism.respondTitle')}</h2>
					<p class="mt-1 text-xs text-text-muted">
						{i18n.t('designPlagiarism.respondBy', { date: fmtDate(entry.respond_by) })}
						· {i18n.t('designPlagiarism.respondHint')}
					</p>
				</div>
				<textarea
					bind:value={response}
					rows="6"
					class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
					data-testid="design-plagiarism-response"
				></textarea>
				<Button size="sm" loading={sending} disabled={!response.trim()} onclick={respond}>
					{i18n.t('designPlagiarism.respondCta')}
				</Button>
			</section>
		{:else if closed && !entry.responded_at}
			<p class="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-muted">
				{i18n.t('designPlagiarism.windowClosed')}
			</p>
		{/if}
	{/if}
</div>
