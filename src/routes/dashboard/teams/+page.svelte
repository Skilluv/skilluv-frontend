<script lang="ts">
	import { onMount } from 'svelte';
	import { teamMarketplaceApi } from '$api/team_marketplace';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import type { Team } from '$types';
	import { Users } from '@lucide/svelte';

	let teams = $state<Team[]>([]);
	let loading = $state(true);
	let loadError = $state('');

	onMount(async () => {
		try {
			const res = await teamMarketplaceApi.myTeams();
			teams = Array.isArray(res.data?.teams) ? res.data.teams : [];
		} catch (err) {
			loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>{i18n.t('teams.dashboard.title')} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-8" data-testid="dashboard-teams-page">
	<header class="mb-8 flex flex-wrap items-end justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold text-text-primary">{i18n.t('teams.dashboard.title')}</h1>
			<p class="mt-2 text-text-muted">{i18n.t('teams.dashboard.subtitle')}</p>
		</div>
		<Button variant="accent" href="/teams/marketplace">
			<Users size={14} strokeWidth={2} />
			{i18n.t('teams.dashboard.findSlotCta')}
		</Button>
	</header>

	{#if loading}
		<div class="space-y-3">
			{#each Array(3) as _, i (i)}
				<Skeleton class="h-24 w-full" rounded="xl" />
			{/each}
		</div>
	{:else if loadError}
		<div class="rounded-2xl border border-error/40 bg-error/5 p-6 text-center" role="alert">
			<p class="text-sm text-error">{loadError}</p>
		</div>
	{:else if teams.length === 0}
		<EmptyState
			variant="bookmark"
			title={i18n.t('teams.dashboard.emptyTitle')}
			body={i18n.t('teams.dashboard.emptyBody')}
		>
			{#snippet action()}
				<Button variant="accent" href="/teams/marketplace">
					{i18n.t('teams.dashboard.findSlotCta')}
				</Button>
			{/snippet}
		</EmptyState>
	{:else}
		<ul class="space-y-3" data-testid="my-teams-list" role="list">
			{#each teams as team (team.id)}
				<li class="rounded-2xl border border-border bg-surface-elevated p-5">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div class="min-w-0 flex-1">
							<h2 class="text-lg font-bold text-text-primary">{team.name}</h2>
							<p class="mt-1 text-sm text-text-muted">
								{i18n.t('teams.dashboard.memberCount', {
									n: team.member_count ?? team.members?.length ?? 0
								})}
							</p>
						</div>
						<div class="flex items-center gap-2">
							{#if team.max_members}
								<Badge variant="default" size="sm">
									{i18n.t('teams.dashboard.capacity', { max: team.max_members })}
								</Badge>
							{/if}
							<Button variant="ghost" size="sm" href={`/teams/${team.id}`}>
								{i18n.t('teams.dashboard.viewCta')}
							</Button>
						</div>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>
