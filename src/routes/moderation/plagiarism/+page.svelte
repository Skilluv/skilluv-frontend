<script lang="ts">
	import { onMount } from 'svelte';
	import { moderationApi, type PlagiarismFlaggedDeliverable } from '$lib/api/moderation';
	import { SkilluError } from '$lib/api/client';
	import { i18n } from '$lib/i18n';
	import { auth } from '$lib/stores/auth.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { ConfirmDangerousDialog } from '$lib/components/moderation';
	import { toast } from '$lib/stores/toast.svelte';

	let queue = $state<PlagiarismFlaggedDeliverable[]>([]);
	let loading = $state(true);
	let loadError = $state('');

	let dialogOpen = $state(false);
	let dialogAction = $state<'valid' | 'revoke' | null>(null);
	let dialogItem = $state<PlagiarismFlaggedDeliverable | null>(null);
	let dialogSubmitting = $state(false);

	let allowed = $derived(auth.can('plagiarism_reviewer') || auth.can('admin'));

	onMount(async () => {
		if (!allowed) {
			loading = false;
			return;
		}
		await load();
	});

	async function load() {
		loading = true;
		loadError = '';
		try {
			const res = await moderationApi.plagiarism.queue({ page: 1, per_page: 50 });
			queue = res.data;
		} catch (err) {
			loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	function openAction(action: 'valid' | 'revoke', item: PlagiarismFlaggedDeliverable) {
		dialogAction = action;
		dialogItem = item;
		dialogOpen = true;
	}

	function closeDialog() {
		if (dialogSubmitting) return;
		dialogOpen = false;
		dialogAction = null;
		dialogItem = null;
	}

	async function submit(reason: string) {
		if (!dialogItem || !dialogAction) return;
		dialogSubmitting = true;
		try {
			if (dialogAction === 'valid') {
				await moderationApi.plagiarism.markValid(dialogItem.deliverable_id, { reason });
			} else {
				await moderationApi.plagiarism.revoke(dialogItem.deliverable_id, { reason });
			}
			queue = queue.filter((q) => q.deliverable_id !== dialogItem?.deliverable_id);
			toast.success(i18n.t('moderation.toast.done'));
			dialogOpen = false;
			dialogAction = null;
			dialogItem = null;
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

	let dialogTitle = $derived(
		dialogAction === 'valid'
			? i18n.t('moderation.plagiarism.confirmValidTitle')
			: i18n.t('moderation.plagiarism.confirmRevokeTitle')
	);

	let dialogBody = $derived(
		dialogAction === 'valid'
			? i18n.t('moderation.plagiarism.confirmValidBody')
			: i18n.t('moderation.plagiarism.confirmRevokeBody')
	);
</script>

<svelte:head>
	<title>{i18n.t('moderation.plagiarism.title')} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-8">
	<header class="mb-8">
		<h1 class="text-3xl font-bold text-text-primary">
			{i18n.t('moderation.plagiarism.title')}
		</h1>
		<p class="mt-2 text-text-muted">{i18n.t('moderation.plagiarism.subtitle')}</p>
	</header>

	{#if !allowed}
		<div class="rounded-2xl border border-warning/40 bg-warning/5 p-6 text-center" role="alert">
			<p class="text-sm text-text-primary">{i18n.t('moderation.plagiarism.noAccess')}</p>
		</div>
	{:else if loading}
		<div class="space-y-3">
			{#each Array(3) as _}
				<Skeleton class="h-28 w-full" rounded="xl" />
			{/each}
		</div>
	{:else if loadError}
		<div class="rounded-2xl border border-error/40 bg-error/5 p-6 text-center" role="alert">
			<p class="text-sm text-error">{loadError}</p>
		</div>
	{:else if queue.length === 0}
		<EmptyState variant="seal-intact" title={i18n.t('moderation.plagiarism.queueEmpty')} />
	{:else}
		<ul class="space-y-3" role="list">
			{#each queue as item (item.deliverable_id)}
				<li class="rounded-2xl border border-border bg-surface-elevated p-5">
					<div class="mb-3 flex items-start justify-between gap-3 flex-wrap">
						<div class="min-w-0 flex-1">
							<div class="mb-2 flex items-center gap-2 flex-wrap">
								<Badge variant="warning" size="sm">
									{i18n.t('moderation.plagiarism.scoreLabel')}: {(item.plagiarism_score * 100).toFixed(0)}%
								</Badge>
								<span class="text-xs text-text-muted">
									{i18n.t('moderation.plagiarism.flaggedOn', { date: fmtDate(item.flagged_at) })}
								</span>
							</div>
							<p class="text-sm">
								<a href="/profile/{item.username}" class="font-medium text-text-primary hover:text-accent">
									@{item.username}
								</a>
							</p>
							{#if item.similar_to_deliverable_id}
								<p class="mt-1 text-xs text-text-muted">
									{item.similar_to_deliverable_id}
								</p>
							{/if}
						</div>
					</div>
					<div class="flex items-center justify-end gap-2">
						<Button variant="ghost" size="sm" href="/deliverables/{item.deliverable_id}">
							{i18n.t('moderation.plagiarism.viewDeliverable')}
						</Button>
						<Button variant="secondary" size="sm" onclick={() => openAction('valid', item)}>
							{i18n.t('moderation.plagiarism.markValidCta')}
						</Button>
						<Button variant="danger" size="sm" onclick={() => openAction('revoke', item)}>
							{i18n.t('moderation.plagiarism.revokeCta')}
						</Button>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<ConfirmDangerousDialog
	open={dialogOpen}
	title={dialogTitle}
	body={dialogBody}
	requireReason={true}
	submitting={dialogSubmitting}
	onConfirm={submit}
	onClose={closeDialog}
/>
