<script lang="ts">
	/**
	 * SKI-42 — declare and manage external context.
	 *
	 * A GitHub signal confirms itself through the OAuth link the account
	 * already has; everything else goes to human review. The two outcomes get
	 * different copy, because "declared" and "confirmed" are the distinction
	 * the whole feature exists to keep visible.
	 */
	import { onMount } from 'svelte';
	import { BadgeCheck, ExternalLink, Info, Trash2 } from '@lucide/svelte';
	import { externalSignalsApi } from '$lib/api/external_signals';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Input from '$components/ui/Input.svelte';
	import Modal from '$components/ui/Modal.svelte';
	import Select from '$components/ui/Select.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import {
		EXTERNAL_SIGNAL_PROVIDERS,
		type ExternalSignal,
		type ExternalSignalProvider
	} from '$types';

	/** Server cap: external context is a sidebar, not a second portfolio. */
	const MAX_SIGNALS = 20;

	let verified = $state<ExternalSignal[]>([]);
	let declared = $state<ExternalSignal[]>([]);
	let loading = $state(true);
	let loadError = $state('');

	let formOpen = $state(false);
	let provider = $state<ExternalSignalProvider>('github');
	let url = $state('');
	let title = $state('');
	let submitting = $state(false);

	let total = $derived(verified.length + declared.length);
	let atCap = $derived(total >= MAX_SIGNALS);

	let providerItems = $derived(
		EXTERNAL_SIGNAL_PROVIDERS.map((p) => ({
			value: p,
			label: i18n.t(`externalSignals.providers.${p}`)
		}))
	);

	let canSubmit = $derived(
		title.trim().length > 0 && /^https?:\/\/.+/i.test(url.trim()) && !atCap
	);

	async function load() {
		loading = true;
		loadError = '';
		try {
			const res = await externalSignalsApi.listMine();
			verified = res.data?.verified ?? [];
			declared = res.data?.declared ?? [];
		} catch (err) {
			loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	async function submit() {
		submitting = true;
		try {
			const res = await externalSignalsApi.create({
				provider,
				url: url.trim(),
				title: title.trim()
			});
			if (res.data.auto_verified) {
				verified = [res.data.signal, ...verified];
				toast.success(i18n.t('externalSignals.autoVerifiedToast'));
			} else {
				declared = [res.data.signal, ...declared];
				toast.success(i18n.t('externalSignals.addedToast'));
			}
			formOpen = false;
			url = '';
			title = '';
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			submitting = false;
		}
	}

	async function remove(signal: ExternalSignal) {
		if (!confirm(i18n.t('externalSignals.removeConfirm'))) return;
		try {
			await externalSignalsApi.remove(signal.id);
			verified = verified.filter((s) => s.id !== signal.id);
			declared = declared.filter((s) => s.id !== signal.id);
			toast.success(i18n.t('externalSignals.removedToast'));
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		}
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('externalSignals.title')} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-8" data-testid="external-signals-page">
	<header class="mb-6 flex flex-wrap items-end justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold text-text-primary">{i18n.t('externalSignals.title')}</h1>
			<p class="mt-2 text-text-muted">{i18n.t('externalSignals.subtitle')}</p>
		</div>
		<Button variant="accent" disabled={atCap} onclick={() => (formOpen = true)}>
			{i18n.t('externalSignals.addCta')}
		</Button>
	</header>

	<p
		class="mb-6 flex items-start gap-2 rounded-xl border border-border bg-surface-overlay p-4 text-sm text-text-muted"
	>
		<Info size={15} strokeWidth={2} class="mt-0.5 shrink-0" />
		<span>{i18n.t('externalSignals.disclaimer')}</span>
	</p>

	{#if atCap}
		<p class="mb-4 text-sm text-warning" role="status">{i18n.t('externalSignals.maxReached')}</p>
	{/if}

	{#if loading}
		<div class="space-y-3">
			{#each Array(3) as _, i (i)}
				<Skeleton class="h-16 w-full" rounded="xl" />
			{/each}
		</div>
	{:else if loadError}
		<div class="rounded-2xl border border-error/40 bg-error/5 p-6 text-center" role="alert">
			<p class="text-sm text-error">{loadError}</p>
			<Button variant="ghost" size="sm" class="mt-3" onclick={load}>
				{i18n.t('common.actions.retry')}
			</Button>
		</div>
	{:else if total === 0}
		<EmptyState
			variant="scroll"
			title={i18n.t('externalSignals.emptyTitle')}
			body={i18n.t('externalSignals.emptyBody')}
		>
			{#snippet action()}
				<Button variant="accent" onclick={() => (formOpen = true)}>
					{i18n.t('externalSignals.addCta')}
				</Button>
			{/snippet}
		</EmptyState>
	{:else}
		{#each [{ rows: verified, isVerified: true }, { rows: declared, isVerified: false }] as bucket (bucket.isVerified)}
			{#if bucket.rows.length > 0}
				<section class="mb-6">
					<h2 class="text-xs font-bold uppercase tracking-wider text-text-muted">
						{bucket.isVerified
							? i18n.t('externalSignals.verifiedTitle')
							: i18n.t('externalSignals.declaredTitle')}
					</h2>
					<p class="mt-1 text-xs text-text-muted">
						{bucket.isVerified
							? i18n.t('externalSignals.verifiedHint')
							: i18n.t('externalSignals.declaredHint')}
					</p>
					<ul class="mt-3 space-y-2" role="list">
						{#each bucket.rows as signal (signal.id)}
							<li
								class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-elevated px-4 py-3"
							>
								<div class="flex min-w-0 items-center gap-2">
									{#if bucket.isVerified}
										<BadgeCheck size={15} strokeWidth={2} class="shrink-0 text-success" />
									{/if}
									<div class="min-w-0">
										<a
											href={signal.url}
											target="_blank"
											rel="noopener noreferrer nofollow ugc"
											class="inline-flex items-center gap-1 text-sm font-semibold text-text-primary underline-offset-4 hover:underline"
										>
											{signal.title}
											<ExternalLink size={11} strokeWidth={2} class="shrink-0 text-text-muted" />
										</a>
										<p class="mt-0.5 flex items-center gap-2 text-xs text-text-muted">
											<Badge size="sm">
												{i18n.t(`externalSignals.providers.${signal.provider}`)}
											</Badge>
											{#if !bucket.isVerified}
												<span>{i18n.t('externalSignals.pendingReview')}</span>
											{/if}
										</p>
									</div>
								</div>
								<button
									type="button"
									onclick={() => remove(signal)}
									aria-label={i18n.t('externalSignals.remove')}
									title={i18n.t('externalSignals.remove')}
									class="rounded-full border border-border p-2 text-text-muted transition-colors duration-200 hover:border-error hover:text-error"
								>
									<Trash2 size={14} strokeWidth={2} />
								</button>
							</li>
						{/each}
					</ul>
				</section>
			{/if}
		{/each}
	{/if}
</div>

<Modal
	open={formOpen}
	title={i18n.t('externalSignals.addCta')}
	onclose={() => (formOpen = false)}
	size="sm"
>
	<div class="space-y-4">
		<div>
			<span class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
				{i18n.t('externalSignals.formProvider')}
			</span>
			<Select
				items={providerItems}
				value={provider}
				onchange={(v) => (provider = v)}
				shape="rounded"
			/>
		</div>
		<Input
			label={i18n.t('externalSignals.formTitle')}
			bind:value={title}
			maxlength={200}
			required
		/>
		<Input
			label={i18n.t('externalSignals.formUrl')}
			type="url"
			bind:value={url}
			placeholder="https://"
			required
		/>
	</div>

	{#snippet actions()}
		<Button variant="ghost" onclick={() => (formOpen = false)}>
			{i18n.t('common.actions.cancel')}
		</Button>
		<Button variant="accent" loading={submitting} disabled={!canSubmit} onclick={submit}>
			{i18n.t('externalSignals.formSubmit')}
		</Button>
	{/snippet}
</Modal>
