<script lang="ts">
	/**
	 * One trial period: the days claimed on it, and claiming another.
	 *
	 * The two totals stay apart everywhere on this page. Approved hours are
	 * money owed; pending hours are a claim the client has not looked at. One
	 * figure would be a number nobody agreed to, and the person it would
	 * mislead is the one counting on being paid.
	 *
	 * The summary is not a nicety: it is what the client approves against, so
	 * a rejected day carries its reason back and the page shows it.
	 *
	 * Approving is the company's gesture and lives in their workspace —
	 * `/trials/hours/{id}/decision` requires an enterprise session.
	 */
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { ArrowLeft, Check, Clock, X } from '@lucide/svelte';
	import { opportunitiesApi } from '$lib/api/opportunities';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import Modal from '$components/ui/Modal.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import { TRIAL_SUMMARY_MAX, type TrialHours } from '$types';

	let trialId = $derived($page.params.id ?? '');

	let hours = $state<TrialHours | null>(null);
	let loading = $state(true);
	let loadError = $state('');

	let formOpen = $state(false);
	let workedOn = $state('');
	/**
	 * Kept a string all the way through.
	 *
	 * `bind:value` on `<input type="number">` hands back a **number**, which
	 * threw on `.trim()` and left the submit button permanently dead. The
	 * wire wants NUMERIC as a decimal string anyway, so a text input with a
	 * decimal keypad is both the honest type and the right keyboard.
	 */
	let claimed = $state('');
	let summary = $state('');
	let submitting = $state(false);

	$effect(() => {
		if (trialId) void load(trialId);
	});

	async function load(id: string) {
		loading = true;
		loadError = '';
		try {
			hours = (await opportunitiesApi.trialHours(id)).data;
		} catch (err) {
			loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	async function submit() {
		submitting = true;
		try {
			await opportunitiesApi.logHours(trialId, {
				worked_on: workedOn,
				hours: claimed.trim(),
				summary: summary.trim()
			});
			toast.success(i18n.t('trialHours.claimedToast'));
			formOpen = false;
			workedOn = '';
			claimed = '';
			summary = '';
			await load(trialId);
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			submitting = false;
		}
	}

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	/** Three states and no fourth: waiting, approved, refused. */
	function entryState(entry: TrialHours['hours'][number]): 'approved' | 'rejected' | 'pending' {
		if (entry.approved_at) return 'approved';
		if (entry.rejected_at) return 'rejected';
		return 'pending';
	}
</script>

<svelte:head>
	<title>{i18n.t('trialHours.title')} | Skilluv</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-8" data-testid="trial-hours-page">
	<a
		href="/dashboard/opportunities"
		class="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"
	>
		<ArrowLeft size={14} strokeWidth={2} />
		{i18n.t('trialHours.back')}
	</a>

	{#if loading}
		<div class="mt-6 space-y-3">
			<Skeleton class="h-20 w-full" rounded="xl" />
			<Skeleton class="h-48 w-full" rounded="xl" />
		</div>
	{:else if loadError}
		<div class="mt-6 rounded-2xl border border-error/40 bg-error/5 p-6 text-center" role="alert">
			<p class="text-sm text-error">{loadError}</p>
		</div>
	{:else if hours}
		<header class="mt-6 mb-6 flex flex-wrap items-end justify-between gap-4">
			<div>
				<h1 class="text-3xl font-bold text-text-primary">{i18n.t('trialHours.title')}</h1>
				<!-- Apart, always. Approved is owed; pending is a claim nobody has
				     looked at yet. -->
				<p class="mt-2 font-mono text-sm text-text-muted">
					<span class="text-text-primary">
						{i18n.t('trialHours.approvedTotal', { n: hours.approved_total })}
					</span>
					<span class="mx-2">·</span>
					{i18n.t('trialHours.pendingTotal', { n: hours.pending_total })}
				</p>
			</div>
			<Button variant="accent" onclick={() => (formOpen = true)}>
				{i18n.t('trialHours.claimCta')}
			</Button>
		</header>

		{#if hours.hours.length === 0}
			<p class="text-sm text-text-muted">{i18n.t('trialHours.empty')}</p>
		{:else}
			<ul class="space-y-2" role="list" data-testid="trial-hours-entries">
				{#each hours.hours as entry (entry.id)}
					{@const kind = entryState(entry)}
					<li class="rounded-xl border border-border bg-surface-elevated p-4">
						<div class="flex flex-wrap items-center gap-2">
							<span class="text-sm font-medium text-text-primary">
								{fmtDate(entry.worked_on)}
							</span>
							<span class="inline-flex items-center gap-1 font-mono text-xs text-text-muted">
								<Clock size={11} strokeWidth={2} />
								{entry.hours} h
							</span>
							<span class="ml-auto">
								{#if kind === 'approved'}
									<Badge variant="success" size="sm">
										<span class="inline-flex items-center gap-1">
											<Check size={11} strokeWidth={2} />
											{i18n.t('trialHours.approved')}
										</span>
									</Badge>
								{:else if kind === 'rejected'}
									<Badge variant="error" size="sm">
										<span class="inline-flex items-center gap-1">
											<X size={11} strokeWidth={2} />
											{i18n.t('trialHours.rejected')}
										</span>
									</Badge>
								{:else}
									<Badge variant="default" size="sm">{i18n.t('trialHours.pending')}</Badge>
								{/if}
							</span>
						</div>

						<!-- What the client approves against. -->
						<p class="mt-2 text-sm text-text-muted">{entry.summary}</p>

						{#if kind === 'rejected' && entry.rejection_reason}
							<p class="mt-1 text-xs text-error">
								{i18n.t('trialHours.rejectionReason', { reason: entry.rejection_reason })}
							</p>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</div>

<Modal
	open={formOpen}
	title={i18n.t('trialHours.claimTitle')}
	onclose={() => (formOpen = false)}
	size="sm"
>
	<div class="space-y-4">
		<Input
			name="worked_on"
			type="date"
			label={i18n.t('trialHours.formDate')}
			bind:value={workedOn}
			required
		/>

		<Input
			name="hours"
			type="text"
			inputmode="decimal"
			label={i18n.t('trialHours.formHours')}
			bind:value={claimed}
			required
		/>

		<div>
			<label
				for="trial-summary"
				class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted"
			>
				{i18n.t('trialHours.formSummary')}
			</label>
			<textarea
				id="trial-summary"
				bind:value={summary}
				rows="4"
				maxlength={TRIAL_SUMMARY_MAX}
				placeholder={i18n.t('trialHours.formSummaryPlaceholder')}
				class="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
			></textarea>
			<p class="mt-1.5 text-xs text-text-muted">{i18n.t('trialHours.formSummaryHint')}</p>
		</div>
	</div>

	{#snippet actions()}
		<Button variant="ghost" onclick={() => (formOpen = false)}>
			{i18n.t('common.actions.cancel')}
		</Button>
		<Button
			variant="accent"
			loading={submitting}
			disabled={!workedOn || !claimed.trim() || !summary.trim()}
			onclick={submit}
		>
			{i18n.t('trialHours.claimSubmit')}
		</Button>
	{/snippet}
</Modal>
