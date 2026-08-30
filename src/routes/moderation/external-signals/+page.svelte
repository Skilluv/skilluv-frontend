<script lang="ts">
	/**
	 * The review queue for declared external accounts.
	 *
	 * `GET /moderation/external-signals`, `/verify` and the delete have been
	 * served for a while and no page called them, so a declared signal sat
	 * unverified forever. The two gestures are deliberately asymmetric:
	 * confirming says only "this person owns that account", while removing
	 * destroys a user declaration for good — hence the mandatory motive,
	 * which the backend refuses below eight characters and writes to the
	 * append-only journal (SKI-299).
	 */
	import { ExternalLink } from '@lucide/svelte';
	import { externalSignalsApi } from '$lib/api/external_signals';
	import { SkilluError } from '$lib/api/client';
	import { i18n } from '$lib/i18n';
	import { auth } from '$lib/stores/auth.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import { ConfirmDangerousDialog } from '$lib/components/moderation';
	import type { ExternalSignal } from '$types';

	let rows = $state<ExternalSignal[]>([]);
	let loading = $state(true);
	let loadError = $state('');
	let verifying = $state<string | null>(null);

	let dialogOpen = $state(false);
	let dialogRow = $state<ExternalSignal | null>(null);
	let dialogSubmitting = $state(false);

	/** The pair the backend gates the queue on, plus admin. */
	let allowed = $derived(
		auth.can('community_moderator') || auth.can('community_curator') || auth.can('admin')
	);

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

	async function load() {
		loading = true;
		loadError = '';
		try {
			const res = await externalSignalsApi.listPending(50);
			rows = res.data.pending;
		} catch (err) {
			loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	async function verify(row: ExternalSignal) {
		verifying = row.id;
		try {
			await externalSignalsApi.verify(row.id);
			rows = rows.filter((r) => r.id !== row.id);
			toast.success(i18n.t('moderation.externalSignals.verifiedToast'));
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('moderation.toast.failed'));
		} finally {
			verifying = null;
		}
	}

	function openReject(row: ExternalSignal) {
		dialogRow = row;
		dialogOpen = true;
	}

	function closeDialog() {
		if (dialogSubmitting) return;
		dialogOpen = false;
		dialogRow = null;
	}

	async function confirmReject(reason: string) {
		if (!dialogRow) return;
		const row = dialogRow;
		dialogSubmitting = true;
		try {
			await externalSignalsApi.reject(row.id, reason);
			rows = rows.filter((r) => r.id !== row.id);
			toast.success(i18n.t('moderation.externalSignals.rejectedToast'));
			dialogOpen = false;
			dialogRow = null;
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('moderation.toast.failed'));
		} finally {
			dialogSubmitting = false;
		}
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
	<title>{i18n.t('moderation.externalSignals.title')} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-8">
	<header class="mb-6">
		<h1 class="text-3xl font-bold text-text-primary">
			{i18n.t('moderation.externalSignals.title')}
		</h1>
		<p class="mt-2 text-text-muted">{i18n.t('moderation.externalSignals.subtitle')}</p>
	</header>

	{#if !auth.capabilitiesLoaded}
		<div class="space-y-3">
			{#each Array(3) as _, i (i)}
				<Skeleton class="h-28 w-full" rounded="xl" />
			{/each}
		</div>
	{:else if !allowed}
		<div class="rounded-2xl border border-warning/40 bg-warning/5 p-6 text-center" role="alert">
			<p class="text-sm text-text-primary">{i18n.t('moderation.externalSignals.noAccess')}</p>
		</div>
	{:else if loading}
		<div class="space-y-3">
			{#each Array(3) as _, i (i)}
				<Skeleton class="h-28 w-full" rounded="xl" />
			{/each}
		</div>
	{:else if loadError}
		<div class="rounded-2xl border border-error/40 bg-error/5 p-6 text-center" role="alert">
			<p class="text-sm text-error">{loadError}</p>
		</div>
	{:else if rows.length === 0}
		<EmptyState variant="seal-intact" title={i18n.t('moderation.externalSignals.queueEmpty')} />
	{:else}
		<ul class="space-y-3" role="list" data-testid="external-signal-queue">
			{#each rows as row (row.id)}
				<li class="rounded-2xl border border-border bg-surface-elevated p-5">
					<div class="mb-2 flex flex-wrap items-center gap-2">
						<Badge variant="default" size="sm">{row.provider}</Badge>
						<span class="text-xs text-text-muted">
							{i18n.t('moderation.externalSignals.declaredOn', { date: fmtDate(row.created_at) })}
						</span>
						<!-- The listing carries the owner's uuid and nothing else, and
						     profiles are addressed by username, so this stays text
						     rather than a link that would 404. -->
						<span class="font-mono text-xs text-text-muted">{row.user_id.slice(0, 8)}…</span>
					</div>

					<p class="text-sm font-semibold text-text-primary">{row.title}</p>

					<a
						href={row.url}
						target="_blank"
						rel="noopener noreferrer nofollow"
						class="mt-1 inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
					>
						<ExternalLink size={13} strokeWidth={2} />
						{i18n.t('moderation.externalSignals.openLink')}
					</a>

					<div class="mt-3 flex flex-wrap items-center justify-end gap-2">
						<Button
							variant="secondary"
							size="sm"
							loading={verifying === row.id}
							onclick={() => verify(row)}
						>
							{i18n.t('moderation.externalSignals.verifyCta')}
						</Button>
						<Button variant="danger" size="sm" onclick={() => openReject(row)}>
							{i18n.t('moderation.externalSignals.rejectCta')}
						</Button>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<ConfirmDangerousDialog
	open={dialogOpen}
	title={i18n.t('moderation.externalSignals.confirmRejectTitle')}
	body={i18n.t('moderation.externalSignals.confirmRejectBody')}
	requireReason={true}
	submitting={dialogSubmitting}
	onConfirm={confirmReject}
	onClose={closeDialog}
/>
