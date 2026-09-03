<script lang="ts">
	import { onMount } from 'svelte';
	import { i18n } from '$lib/i18n';
	import { SkilluError } from '$api/client';
	import { toast } from '$stores/toast.svelte';
	import { disputesApi, type Dispute } from '$api/disputes';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Modal from '$components/ui/Modal.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import { Scale, ArrowLeft } from '@lucide/svelte';

	let items = $state<Dispute[]>([]);
	let loading = $state(true);
	let busy = $state<string | null>(null);

	let contesting = $state<Dispute | null>(null);
	let response = $state('');

	const STATUS_VARIANT: Record<Dispute['status'], 'warning' | 'accent' | 'success' | 'default'> = {
		open: 'warning',
		contested: 'accent',
		refunded: 'success',
		released: 'default',
		withdrawn: 'default'
	};

	function statusLabel(status: Dispute['status']): string {
		return i18n.t(`disputes.status.${status}`);
	}

	function money(d: Dispute): string {
		// The backend sends a decimal string on purpose. Formatting it as a
		// number here is the one place a rounding error would be invisible,
		// so the string is shown as it arrived.
		return `${d.amount} ${d.currency}`;
	}

	onMount(load);

	async function load() {
		loading = true;
		try {
			const res = await disputesApi.list();
			items = res.data;
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			loading = false;
		}
	}

	async function act(d: Dispute, action: 'concede' | 'withdraw') {
		busy = d.id;
		try {
			if (action === 'concede') await disputesApi.concede(d.id);
			else await disputesApi.withdraw(d.id);
			toast.success(i18n.t(`disputes.done.${action}`));
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			busy = null;
		}
	}

	async function submitContest() {
		if (!contesting || !response.trim()) return;
		busy = contesting.id;
		try {
			await disputesApi.contest(contesting.id, response.trim());
			toast.success(i18n.t('disputes.done.contest'));
			contesting = null;
			response = '';
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			busy = null;
		}
	}
</script>

<svelte:head>
	<title>{i18n.t('disputes.title')} | Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-8" data-testid="disputes-page">
	<a
		href="/wallet"
		class="mb-6 inline-flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-text-primary"
	>
		<ArrowLeft size={14} strokeWidth={2} />
		{i18n.t('wallet.title')}
	</a>

	<h1 class="mb-2 text-2xl font-bold">{i18n.t('disputes.title')}</h1>
	<p class="mb-6 text-text-muted">{i18n.t('disputes.subtitle')}</p>

	{#if loading}
		<div class="flex flex-col gap-3">
			<Skeleton class="h-28 w-full" />
			<Skeleton class="h-28 w-full" />
		</div>
	{:else if items.length === 0}
		<EmptyState
			variant="seal-intact"
			title={i18n.t('disputes.empty')}
			body={i18n.t('disputes.emptyBody')}
		/>
	{:else}
		<div class="flex flex-col gap-3">
			{#each items as d (d.id)}
				<article
					class="rounded-2xl border border-border bg-surface-elevated p-5"
					data-testid="dispute-{d.id}"
				>
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div class="flex items-start gap-3">
							<Scale size={18} strokeWidth={2} class="mt-0.5 shrink-0 text-text-muted" />
							<div>
								<p class="text-sm font-semibold">{money(d)}</p>
								<p class="text-xs text-text-muted">
									{i18n.t(`disputes.subjects.${d.subject_type}`)}
								</p>
							</div>
						</div>
						<Badge variant={STATUS_VARIANT[d.status]} size="sm">{statusLabel(d.status)}</Badge>
					</div>

					<p class="mt-3 text-sm">{d.reason}</p>

					{#if d.recipient_response}
						<p class="mt-2 border-l-2 border-border pl-3 text-sm text-text-muted">
							{d.recipient_response}
						</p>
					{/if}

					{#if d.resolution_note}
						<p class="mt-2 text-sm">
							<span class="text-text-muted">{i18n.t('disputes.decision')} :</span>
							{d.resolution_note}
						</p>
					{/if}

					<!-- Only the moves the caller can actually make. Showing the
					     other side's buttons would offer an action the server
					     refuses. -->
					{#if d.status === 'open' && d.viewer_role === 'recipient'}
						<div class="mt-4 flex flex-wrap gap-2">
							<Button
								variant="primary"
								size="sm"
								loading={busy === d.id}
								onclick={() => {
									contesting = d;
									response = '';
								}}
							>
								{i18n.t('disputes.actions.contest')}
							</Button>
							<Button
								variant="ghost"
								size="sm"
								loading={busy === d.id}
								onclick={() => act(d, 'concede')}
							>
								{i18n.t('disputes.actions.concede')}
							</Button>
						</div>
						<p class="mt-2 text-xs text-text-muted">{i18n.t('disputes.recipientHint')}</p>
					{:else if d.status === 'open' && d.viewer_role === 'payer'}
						<div class="mt-4">
							<Button
								variant="ghost"
								size="sm"
								loading={busy === d.id}
								onclick={() => act(d, 'withdraw')}
							>
								{i18n.t('disputes.actions.withdraw')}
							</Button>
						</div>
						<p class="mt-2 text-xs text-text-muted">{i18n.t('disputes.payerHint')}</p>
					{:else if d.status === 'contested'}
						<p class="mt-4 text-xs text-text-muted">{i18n.t('disputes.contestedHint')}</p>
					{/if}
				</article>
			{/each}
		</div>
	{/if}
</div>

<Modal
	open={contesting !== null}
	title={i18n.t('disputes.contestTitle')}
	onclose={() => (contesting = null)}
	size="md"
>
	<p class="mb-3 text-sm text-text-muted">{i18n.t('disputes.contestHint')}</p>
	<textarea
		bind:value={response}
		rows="5"
		data-testid="dispute-response"
		class="w-full rounded-xl border border-border bg-surface p-3 text-sm"
		placeholder={i18n.t('disputes.contestPlaceholder')}
	></textarea>

	{#snippet actions()}
		<Button variant="ghost" size="sm" onclick={() => (contesting = null)}>
			{i18n.t('common.actions.cancel')}
		</Button>
		<Button
			variant="primary"
			size="sm"
			disabled={!response.trim()}
			loading={busy !== null}
			onclick={submitContest}
		>
			{i18n.t('disputes.actions.contest')}
		</Button>
	{/snippet}
</Modal>
