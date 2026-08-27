<script lang="ts">
	/**
	 * SKI-297 — the listing the break endpoint always needed.
	 *
	 * `POST /moderation/vouchings/{id}/break` shipped without any way to find
	 * a vouching: the only reads were "backing user X" and "mine", so a
	 * moderator had to already know which mentee to look at. That is
	 * backwards — the trigger is a fraud finding, and the question it raises
	 * is "who put their rank behind this person". Broken vouchings were
	 * readable nowhere at all, so no past decision could be reviewed.
	 *
	 * Both halves live on one page for the same reason the backend put them
	 * behind one capability: a gesture whose target cannot be found is
	 * useless, and a listing without the gesture is a spectator sport.
	 */
	import { AlertTriangle } from '@lucide/svelte';
	import { vouchingsApi, type VouchingQueueParams } from '$lib/api/vouchings';
	import { SkilluError } from '$lib/api/client';
	import { i18n } from '$lib/i18n';
	import { auth } from '$lib/stores/auth.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import { ConfirmDangerousDialog } from '$lib/components/moderation';
	import {
		VOUCHING_QUEUE_STATUSES,
		type VouchingQueueRow,
		type VouchingQueueStatus
	} from '$types';

	const PER_PAGE = 50;

	let status = $state<VouchingQueueStatus>('live');
	let rows = $state<VouchingQueueRow[]>([]);
	let total = $state(0);
	let loading = $state(true);
	let loadingMore = $state(false);
	let loadError = $state('');

	let dialogOpen = $state(false);
	let dialogRow = $state<VouchingQueueRow | null>(null);
	let dialogSubmitting = $state(false);

	/**
	 * The same pair the backend gates the queue on. A plagiarism reviewer
	 * reaches vouchings because a revoked deliverable is exactly what makes
	 * the backing worth re-reading.
	 */
	let allowed = $derived(
		auth.can('community_moderator') || auth.can('plagiarism_reviewer') || auth.can('admin')
	);

	// Capabilities land after mount, so a one-shot check on mount would deny
	// a legitimate moderator. Same guard as /moderation/plagiarism.
	let requested = false;
	$effect(() => {
		if (!auth.capabilitiesLoaded) return;
		if (allowed) {
			if (!requested) {
				requested = true;
				void load();
			}
		} else {
			loading = false;
		}
	});

	async function fetchPage(offset: number) {
		const params: VouchingQueueParams = { status, limit: PER_PAGE, offset };
		const res = await vouchingsApi.moderationQueue(params);
		return res.data;
	}

	async function load() {
		loading = true;
		loadError = '';
		try {
			const data = await fetchPage(0);
			rows = data.vouchings;
			total = data.total;
		} catch (err) {
			loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	async function loadMore() {
		loadingMore = true;
		try {
			const data = await fetchPage(rows.length);
			rows = [...rows, ...data.vouchings];
			total = data.total;
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			loadingMore = false;
		}
	}

	function selectStatus(next: VouchingQueueStatus) {
		if (next === status) return;
		status = next;
		rows = [];
		total = 0;
		void load();
	}

	function openBreak(row: VouchingQueueRow) {
		dialogRow = row;
		dialogOpen = true;
	}

	function closeDialog() {
		if (dialogSubmitting) return;
		dialogOpen = false;
		dialogRow = null;
	}

	async function confirmBreak(reason: string) {
		if (!dialogRow) return;
		const row = dialogRow;
		dialogSubmitting = true;
		try {
			const res = await vouchingsApi.breakVouching(row.id, reason);
			const report = res.data;
			// The report says what the break actually cost. A vouching staked
			// on reputation only changes no rank, and saying otherwise would
			// teach moderators the gesture is heavier than it is.
			if (report.penalty_applied && report.penalty_until) {
				toast.success(
					i18n.t('moderation.vouchings.brokeWithPenalty', {
						name: partyName(row.voucher_display_name, row.voucher_username),
						rank: report.voucher_rank_effective,
						date: fmtDate(report.penalty_until)
					})
				);
			} else {
				toast.success(i18n.t('moderation.vouchings.brokeWithoutPenalty'));
			}
			rows = rows.filter((r) => r.id !== row.id);
			total = Math.max(0, total - 1);
			dialogOpen = false;
			dialogRow = null;
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('moderation.toast.failed'));
		} finally {
			dialogSubmitting = false;
		}
	}

	/** A LEFT JOIN resolves both parties, so either side can be missing. */
	function partyName(display: string | null, username: string | null): string {
		return display ?? username ?? i18n.t('vouchings.unknownVoucher');
	}

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>{i18n.t('moderation.vouchings.title')} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-8">
	<header class="mb-6">
		<h1 class="text-3xl font-bold text-text-primary">{i18n.t('moderation.vouchings.title')}</h1>
		<p class="mt-2 text-text-muted">{i18n.t('moderation.vouchings.subtitle')}</p>
	</header>

	{#if !auth.capabilitiesLoaded}
		<div class="space-y-3">
			{#each Array(3) as _}
				<Skeleton class="h-32 w-full" rounded="xl" />
			{/each}
		</div>
	{:else if !allowed}
		<div class="rounded-2xl border border-warning/40 bg-warning/5 p-6 text-center" role="alert">
			<p class="text-sm text-text-primary">{i18n.t('moderation.vouchings.noAccess')}</p>
		</div>
	{:else}
		<div
			class="mb-5 flex flex-wrap items-center gap-2"
			role="tablist"
			data-testid="vouching-queue-tabs"
		>
			{#each VOUCHING_QUEUE_STATUSES as candidate}
				<button
					type="button"
					role="tab"
					aria-selected={candidate === status}
					onclick={() => selectStatus(candidate)}
					class="rounded-full border px-4 py-1.5 text-sm font-medium transition-colors {candidate ===
					status
						? 'border-accent bg-accent/10 text-accent'
						: 'border-border text-text-muted hover:text-text-primary'}"
				>
					{i18n.t(`moderation.vouchings.statuses.${candidate}`)}
				</button>
			{/each}
			{#if !loading && total > 0}
				<span class="ml-auto text-xs text-text-muted">
					{i18n.t('moderation.vouchings.total', { n: String(total) })}
				</span>
			{/if}
		</div>

		{#if loading}
			<div class="space-y-3">
				{#each Array(3) as _}
					<Skeleton class="h-32 w-full" rounded="xl" />
				{/each}
			</div>
		{:else if loadError}
			<div class="rounded-2xl border border-error/40 bg-error/5 p-6 text-center" role="alert">
				<p class="text-sm text-error">{loadError}</p>
			</div>
		{:else if rows.length === 0}
			<EmptyState variant="seal-intact" title={i18n.t('moderation.vouchings.queueEmpty')} />
		{:else}
			<ul class="space-y-3" role="list" data-testid="vouching-queue">
				{#each rows as row (row.id)}
					<li
						class="rounded-2xl border bg-surface-elevated p-5 {row.vouched_user_flagged
							? 'border-warning/50'
							: 'border-border'}"
					>
						<div class="mb-3 flex flex-wrap items-center gap-2">
							{#if row.vouched_user_flagged}
								<Badge variant="warning" size="sm">
									<span class="inline-flex items-center gap-1">
										<AlertTriangle size={12} strokeWidth={2} />
										{i18n.t('moderation.vouchings.flagged')}
									</span>
								</Badge>
							{/if}
							<Badge
								variant={row.at_stake_kind === 'rank_temporary' ? 'accent' : 'default'}
								size="sm"
							>
								{i18n.t(`vouchings.stakes.${row.at_stake_kind}`)}
							</Badge>
							<span class="text-xs text-text-muted">
								{i18n.t('moderation.vouchings.openedOn', { date: fmtDate(row.created_at) })}
							</span>
						</div>

						<div class="grid gap-3 sm:grid-cols-2">
							<div>
								<span class="text-xs font-bold uppercase tracking-wider text-text-muted">
									{i18n.t('moderation.vouchings.voucherLabel')}
								</span>
								<p class="mt-0.5 text-sm">
									{#if row.voucher_username}
										<a
											href="/profile/{row.voucher_username}"
											class="font-semibold text-text-primary hover:text-accent"
										>
											{partyName(row.voucher_display_name, row.voucher_username)}
										</a>
									{:else}
										<span class="font-semibold text-text-primary">
											{partyName(row.voucher_display_name, row.voucher_username)}
										</span>
									{/if}
								</p>
								<p class="mt-0.5 text-xs text-text-muted">
									{i18n.t('moderation.vouchings.rankAtStake', { rank: row.voucher_rank })}
								</p>
							</div>
							<div>
								<span class="text-xs font-bold uppercase tracking-wider text-text-muted">
									{i18n.t('moderation.vouchings.vouchedLabel')}
								</span>
								<p class="mt-0.5 text-sm">
									{#if row.vouched_username}
										<a
											href="/profile/{row.vouched_username}"
											class="font-semibold text-text-primary hover:text-accent"
										>
											{partyName(row.vouched_display_name, row.vouched_username)}
										</a>
									{:else}
										<span class="font-semibold text-text-primary">
											{partyName(row.vouched_display_name, row.vouched_username)}
										</span>
									{/if}
								</p>
								{#if row.vouched_user_flagged}
									<p class="mt-0.5 text-xs text-warning">
										{i18n.t('moderation.vouchings.flaggedHint')}
									</p>
								{/if}
							</div>
						</div>

						<p class="mt-3 text-sm text-text-muted">
							{row.statement || i18n.t('vouchings.noStatement')}
						</p>

						{#if row.status === 'broken'}
							<p class="mt-2 text-xs text-text-muted">
								{i18n.t('moderation.vouchings.brokenOn', {
									date: fmtDate(row.broken_at ?? row.active_until)
								})}
							</p>
							{#if row.break_reason}
								<p class="mt-0.5 text-xs text-text-muted">
									{i18n.t('moderation.vouchings.breakReason', { reason: row.break_reason })}
								</p>
							{/if}
						{:else}
							<p class="mt-2 text-xs text-text-muted">
								{i18n.t('moderation.vouchings.untilLabel', { date: fmtDate(row.active_until) })}
							</p>
						{/if}

						{#if row.status === 'live'}
							<div class="mt-3 flex justify-end">
								<Button variant="danger" size="sm" onclick={() => openBreak(row)}>
									{i18n.t('moderation.vouchings.breakCta')}
								</Button>
							</div>
						{/if}
					</li>
				{/each}
			</ul>

			{#if rows.length < total}
				<div class="mt-5 flex justify-center">
					<Button variant="ghost" loading={loadingMore} onclick={loadMore}>
						{i18n.t('moderation.vouchings.loadMore')}
					</Button>
				</div>
			{/if}
		{/if}
	{/if}
</div>

<ConfirmDangerousDialog
	open={dialogOpen}
	title={i18n.t('moderation.vouchings.confirmBreakTitle')}
	body={i18n.t('moderation.vouchings.confirmBreakBody')}
	requireReason={true}
	submitting={dialogSubmitting}
	onConfirm={confirmBreak}
	onClose={closeDialog}
/>
