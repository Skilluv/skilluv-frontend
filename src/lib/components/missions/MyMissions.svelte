<script lang="ts">
	/**
	 * The applications you sent, for one domain's board.
	 */
	import { onMount } from 'svelte';
	import { missionsApi } from '$lib/api/missions';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import SegmentedControl from '$components/ui/SegmentedControl.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import type { MyMissionApplication } from '$types';

	interface Props {
		/** Where this domain's board lives, e.g. `/ai/missions`. */
		basePath: string;
		/** The board's name, for the back-links. */
		boardTitle: string;
	}

	let { basePath, boardTitle }: Props = $props();

	type Tab = 'all' | 'applied' | 'shortlisted' | 'selected' | 'rejected';

	let rows = $state<MyMissionApplication[]>([]);
	let tab = $state<Tab>('all');
	let loading = $state(true);
	let loadError = $state('');

	let tabItems = $derived([
		{ value: 'all' as const, label: i18n.t('missions.filterAll') },
		{ value: 'applied' as const, label: i18n.t('missions.applicationStatuses.applied') },
		{
			value: 'shortlisted' as const,
			label: i18n.t('missions.applicationStatuses.shortlisted')
		},
		{ value: 'selected' as const, label: i18n.t('missions.applicationStatuses.selected') },
		{ value: 'rejected' as const, label: i18n.t('missions.applicationStatuses.rejected') }
	]);

	let visible = $derived(
		tab === 'all' ? rows : rows.filter((r) => r.application_status === tab)
	);

	function label(group: string, value: string): string {
		const key = `missions.${group}.${value}`;
		const translated = i18n.t(key);
		return translated === key ? value : translated;
	}

	function statusVariant(status: string): 'success' | 'accent' | 'error' | 'default' {
		if (status === 'selected') return 'success';
		if (status === 'shortlisted') return 'accent';
		if (status === 'rejected') return 'error';
		return 'default';
	}

	async function load() {
		loading = true;
		loadError = '';
		try {
			const res = await missionsApi.mine();
			rows = res.data?.applications ?? [];
		} catch (err) {
			loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('missions.mineTitle')} — Skilluv</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-8" data-testid="design-my-missions">
	<header class="mb-6 flex flex-wrap items-end justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold text-text-primary">{i18n.t('missions.mineTitle')}</h1>
			<p class="mt-2 text-text-muted">{i18n.t('missions.mineSubtitle')}</p>
		</div>
		<Button variant="ghost" href={basePath}>{i18n.t('missions.backToList')}</Button>
	</header>

	<div class="mb-6">
		<SegmentedControl items={tabItems} value={tab} onchange={(v) => (tab = v)} size="sm" />
	</div>

	{#if loading}
		<div class="space-y-3">
			{#each Array(3) as _, i (i)}
				<Skeleton class="h-20 w-full" rounded="xl" />
			{/each}
		</div>
	{:else if loadError}
		<div class="rounded-2xl border border-error/40 bg-error/5 p-6 text-center" role="alert">
			<p class="text-sm text-error">{loadError}</p>
			<Button variant="ghost" size="sm" class="mt-3" onclick={load}>
				{i18n.t('common.actions.retry')}
			</Button>
		</div>
	{:else if visible.length === 0}
		<EmptyState variant="scroll" title={i18n.t('missions.mineEmpty')}>
			{#snippet action()}
				<Button variant="accent" href={basePath}>{boardTitle}</Button>
			{/snippet}
		</EmptyState>
	{:else}
		<ul class="space-y-3" role="list">
			{#each visible as row (row.mission_slug)}
				<li class="rounded-2xl border border-border bg-surface-elevated p-5">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div class="min-w-0 flex-1">
							<a
								href="{basePath}/{row.mission_slug}"
								class="text-base font-bold text-text-primary underline-offset-4 hover:underline"
							>
								{row.mission_title}
							</a>
							<p class="mt-1 text-xs text-text-muted">
								{label('statuses', row.mission_status)}
							</p>
							{#if row.decision_reason}
								<p class="mt-2 text-sm text-text-muted">
									{i18n.t('missions.decisionReason', { reason: row.decision_reason })}
								</p>
							{/if}
						</div>
						<Badge variant={statusVariant(row.application_status)} size="sm">
							{label('applicationStatuses', row.application_status)}
						</Badge>
					</div>

					{#if row.application_status === 'selected'}
						<!-- The one row that has somewhere else to be. Until this
						     link existed the workspace was reachable only by typing
						     its URL, so whoever won a mission had the NDA, the
						     delivery rounds and the invoices sitting behind a page
						     nothing pointed at. -->
						<div class="mt-3">
							<Button
								size="sm"
								href="{basePath}/{row.mission_slug}/workspace"
								data-testid="my-mission-workspace"
							>
								{i18n.t('missions.openWorkspace')}
							</Button>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>
