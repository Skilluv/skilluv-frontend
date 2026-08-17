<script lang="ts">
	/** SKI-38 — the goals a user set, with live progress against each one. */
	import { onMount } from 'svelte';
	import { goalsApi } from '$lib/api/goals';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import { GoalCard, GoalForm } from '$components/goals';
	import type { GoalProgress } from '$types';

	let goals = $state<GoalProgress[]>([]);
	let includeArchived = $state(false);
	let loading = $state(true);
	let loadError = $state('');
	let formOpen = $state(false);

	async function load() {
		loading = true;
		loadError = '';
		try {
			const res = await goalsApi.listMine(includeArchived);
			goals = res.data?.goals ?? [];
		} catch (err) {
			loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	function toggleArchived() {
		includeArchived = !includeArchived;
		void load();
	}

	function oncreated(goal: GoalProgress) {
		goals = [goal, ...goals];
	}

	async function remove(id: string) {
		if (!confirm(i18n.t('goals.deleteConfirm'))) return;
		try {
			await goalsApi.remove(id);
			goals = goals.filter((g) => g.goal.id !== id);
			toast.success(i18n.t('goals.deletedToast'));
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		}
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('goals.title')} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-8" data-testid="dashboard-goals-page">
	<header class="mb-8 flex flex-wrap items-end justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold text-text-primary">{i18n.t('goals.title')}</h1>
			<p class="mt-2 text-text-muted">{i18n.t('goals.subtitle')}</p>
		</div>
		<Button variant="accent" onclick={() => (formOpen = true)}>{i18n.t('goals.newCta')}</Button>
	</header>

	{#if loading}
		<div class="space-y-3">
			{#each Array(2) as _, i (i)}
				<Skeleton class="h-44 w-full" rounded="xl" />
			{/each}
		</div>
	{:else if loadError}
		<div class="rounded-2xl border border-error/40 bg-error/5 p-6 text-center" role="alert">
			<p class="text-sm text-error">{loadError}</p>
			<Button variant="ghost" size="sm" class="mt-3" onclick={load}>
				{i18n.t('common.actions.retry')}
			</Button>
		</div>
	{:else if goals.length === 0}
		<EmptyState variant="scroll" title={i18n.t('goals.emptyTitle')} body={i18n.t('goals.emptyBody')}>
			{#snippet action()}
				<Button variant="accent" onclick={() => (formOpen = true)}>{i18n.t('goals.newCta')}</Button>
			{/snippet}
		</EmptyState>
	{:else}
		<div class="space-y-4">
			{#each goals as progress (progress.goal.id)}
				<GoalCard {progress} ondelete={remove} />
			{/each}
		</div>
	{/if}

	<div class="mt-8 text-center">
		<Button variant="ghost" size="sm" onclick={toggleArchived}>
			{includeArchived ? i18n.t('goals.hideArchived') : i18n.t('goals.showArchived')}
		</Button>
	</div>
</div>

<GoalForm open={formOpen} onclose={() => (formOpen = false)} {oncreated} />
