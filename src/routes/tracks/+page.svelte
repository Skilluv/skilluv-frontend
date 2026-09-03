<script lang="ts">
	import { onMount } from 'svelte';
	import { tracksApi, type Track } from '$api/tracks';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import Badge from '$components/ui/Badge.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';

	let tracks = $state<Track[]>([]);
	let loading = $state(true);
	let loadError = $state('');

	onMount(async () => {
		try {
			const res = await tracksApi.list();
			tracks = Array.isArray(res.data?.tracks) ? res.data.tracks : [];
		} catch (err) {
			loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>{i18n.t('tracks.title')} | Skilluv</title>
	<meta name="description" content={i18n.t('tracks.subtitle')} />
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-8" data-testid="tracks-page">
	<header class="mb-8">
		<h1 class="text-3xl font-bold text-text-primary sm:text-4xl">{i18n.t('tracks.title')}</h1>
		<p class="mt-2 max-w-3xl text-text-muted">{i18n.t('tracks.subtitle')}</p>
	</header>

	{#if loading}
		<div class="grid gap-4 sm:grid-cols-2">
			{#each Array(4) as _, i (i)}
				<Skeleton class="h-40 w-full" rounded="xl" />
			{/each}
		</div>
	{:else if loadError}
		<div class="rounded-2xl border border-error/40 bg-error/5 p-6 text-center" role="alert">
			<p class="text-sm text-error">{loadError}</p>
		</div>
	{:else if tracks.length === 0}
		<EmptyState variant="scroll" title={i18n.t('tracks.emptyTitle')} body={i18n.t('tracks.emptyBody')} />
	{:else}
		<div class="grid gap-4 sm:grid-cols-2">
			{#each tracks as track (track.id)}
				<a
					href={`/tracks/${track.slug}`}
					data-testid="track-card"
					class="flex flex-col rounded-2xl border border-border bg-surface-elevated p-5 transition-colors hover:border-accent"
				>
					<div class="mb-3 flex flex-wrap items-center gap-2">
						<Badge variant={track.target_domain as 'code'}>
							{i18n.t(`common.domains.${track.target_domain}`)}
						</Badge>
						{#if track.estimated_hours}
							<Badge variant="default" size="sm">
								{i18n.t('tracks.estimatedHours', { n: track.estimated_hours })}
							</Badge>
						{/if}
					</div>
					<h2 class="mb-2 text-lg font-bold text-text-primary">{track.name}</h2>
					{#if track.description}
						<p class="line-clamp-3 text-sm text-text-muted">{track.description}</p>
					{/if}
				</a>
			{/each}
		</div>
	{/if}
</div>
