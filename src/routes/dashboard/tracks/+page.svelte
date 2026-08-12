<script lang="ts">
	import { onMount } from 'svelte';
	import { tracksApi, type UserTrack } from '$api/tracks';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';

	let rows = $state<UserTrack[]>([]);
	let loading = $state(true);
	let loadError = $state('');

	onMount(async () => {
		try {
			const res = await tracksApi.mine();
			rows = Array.isArray(res.data?.user_tracks) ? res.data.user_tracks : [];
		} catch (err) {
			loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	});

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>{i18n.t('tracks.dashboardTitle')} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-8" data-testid="dashboard-tracks-page">
	<header class="mb-8 flex flex-wrap items-end justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold text-text-primary">{i18n.t('tracks.dashboardTitle')}</h1>
			<p class="mt-2 text-text-muted">{i18n.t('tracks.dashboardSubtitle')}</p>
		</div>
		<Button variant="accent" href="/tracks">{i18n.t('tracks.browseCta')}</Button>
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
	{:else if rows.length === 0}
		<EmptyState
			variant="scroll"
			title={i18n.t('tracks.dashboardEmptyTitle')}
			body={i18n.t('tracks.dashboardEmptyBody')}
		>
			{#snippet action()}
				<Button variant="accent" href="/tracks">{i18n.t('tracks.browseCta')}</Button>
			{/snippet}
		</EmptyState>
	{:else}
		<ul class="space-y-3" role="list">
			{#each rows as row (row.track_id)}
				<li class="rounded-2xl border border-border bg-surface-elevated p-5">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div class="min-w-0 flex-1">
							<h2 class="text-lg font-bold text-text-primary">{row.title}</h2>
							<p class="mt-1 text-sm text-text-muted">
								{i18n.t('tracks.startedOn', { date: fmtDate(row.started_at) })}
							</p>
						</div>
						<div class="flex items-center gap-2">
							<Badge variant={row.completed_at ? 'success' : 'accent'} size="sm">
								{row.completed_at ? i18n.t('tracks.completedBadge') : i18n.t('tracks.inProgressBadge')}
							</Badge>
							<Button variant="ghost" size="sm" href={`/tracks/${row.slug}`}>
								{i18n.t('tracks.viewCta')}
							</Button>
						</div>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>
