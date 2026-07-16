<script lang="ts">
	import { onMount } from 'svelte';
	import { communityApi } from '$lib/api/community';
	import { moderationApi } from '$lib/api/moderation';
	import { SkilluError } from '$lib/api/client';
	import { i18n } from '$lib/i18n';
	import { auth } from '$lib/stores/auth.svelte';
	import type { Challenge } from '$lib/types';
	import Button from '$lib/components/ui/Button.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { ConfirmDangerousDialog } from '$lib/components/moderation';
	import { toast } from '$lib/stores/toast.svelte';

	let challenges = $state<Challenge[]>([]);
	let loading = $state(true);
	let loadError = $state('');

	let dialogOpen = $state(false);
	let dialogAction = $state<'approve' | 'reject' | null>(null);
	let dialogChallenge = $state<Challenge | null>(null);
	let dialogSubmitting = $state(false);

	let allowed = $derived(auth.can('community_curator') || auth.can('admin'));

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
			const res = await communityApi.pendingReview(1, 50);
			challenges = res.data;
		} catch (err) {
			loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	function openAction(action: 'approve' | 'reject', challenge: Challenge) {
		dialogAction = action;
		dialogChallenge = challenge;
		dialogOpen = true;
	}

	function closeDialog() {
		if (dialogSubmitting) return;
		dialogOpen = false;
		dialogAction = null;
		dialogChallenge = null;
	}

	async function submitAction(reason: string) {
		if (!dialogChallenge || !dialogAction) return;
		dialogSubmitting = true;
		try {
			if (dialogAction === 'approve') {
				await moderationApi.community.approveChallenge(dialogChallenge.id, { reason });
			} else {
				await moderationApi.community.rejectChallenge(dialogChallenge.id, { reason });
			}
			challenges = challenges.filter((c) => c.id !== dialogChallenge?.id);
			toast.success(i18n.t('moderation.toast.done'));
			dialogOpen = false;
			dialogAction = null;
			dialogChallenge = null;
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('moderation.toast.failed'));
		} finally {
			dialogSubmitting = false;
		}
	}

	let dialogTitle = $derived(
		dialogAction === 'approve'
			? i18n.t('moderation.community.confirmApproveTitle')
			: i18n.t('moderation.community.confirmRejectTitle')
	);

	let dialogBody = $derived(
		dialogAction === 'approve'
			? i18n.t('moderation.community.confirmApproveBody')
			: i18n.t('moderation.community.confirmRejectBody')
	);
</script>

<svelte:head>
	<title>{i18n.t('capabilities.nav.pendingCurator')} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-8">
	<header class="mb-8">
		<h1 class="text-3xl font-bold text-text-primary">
			{i18n.t('capabilities.nav.pendingCurator')}
		</h1>
		<p class="mt-2 text-text-muted">
			{i18n.t('capabilities.items.community_curator.description')}
		</p>
	</header>

	{#if !allowed}
		<div class="rounded-2xl border border-warning/40 bg-warning/5 p-6 text-center" role="alert">
			<p class="text-sm text-text-primary">{i18n.t('errors.forbiddenMessage')}</p>
		</div>
	{:else if loading}
		<div class="space-y-3">
			{#each Array(3) as _}
				<Skeleton class="h-32 w-full" rounded="xl" />
			{/each}
		</div>
	{:else if loadError}
		<div class="rounded-2xl border border-error/40 bg-error/5 p-6 text-center" role="alert">
			<p class="text-sm text-error">{loadError}</p>
		</div>
	{:else if challenges.length === 0}
		<EmptyState variant="scroll" title={i18n.t('community.empty')} />
	{:else}
		<ul class="space-y-3" role="list">
			{#each challenges as ch (ch.id)}
				<li class="rounded-2xl border border-border bg-surface-elevated p-5">
					<div class="mb-3 flex items-start justify-between gap-3">
						<div class="min-w-0 flex-1">
							<div class="mb-2 flex items-center gap-2 flex-wrap">
								<Badge variant="primary" size="sm">{i18n.t(`common.domains.${ch.skill_domain}`)}</Badge>
								<Badge variant="default" size="sm">
									{i18n.t(`common.difficulty.${ch.difficulty}`)}
								</Badge>
								{#if ch.created_by}
									<span class="text-xs text-text-muted">@{ch.created_by}</span>
								{/if}
							</div>
							<h3 class="text-lg font-bold text-text-primary">{ch.title}</h3>
							<p class="mt-1 text-sm text-text-muted line-clamp-3">{ch.description}</p>
						</div>
					</div>
					<div class="flex items-center justify-end gap-2">
						<Button variant="danger" size="sm" onclick={() => openAction('reject', ch)}>
							{i18n.t('moderation.community.rejectCta')}
						</Button>
						<Button variant="primary" size="sm" onclick={() => openAction('approve', ch)}>
							{i18n.t('moderation.community.approveCta')}
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
	requireReason={dialogAction === 'reject'}
	submitting={dialogSubmitting}
	onConfirm={submitAction}
	onClose={closeDialog}
/>
