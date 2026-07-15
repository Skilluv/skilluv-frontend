<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { orientationsApi } from '$lib/api/orientations';
	import { SkilluError } from '$lib/api/client';
	import { i18n } from '$lib/i18n';
	import { domainStyle } from '$lib/utils/domains';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import type { Orientation, OrientationPlaylistItem } from '$lib/types';
	import { ChevronLeft } from '@lucide/svelte';

	let slug = $derived($page.params.slug ?? '');

	let orientation = $state<Orientation | null>(null);
	let playlist = $state<OrientationPlaylistItem[]>([]);
	let loading = $state(true);
	let error = $state('');

	$effect(() => {
		if (slug) loadDetail(slug);
	});

	async function loadDetail(s: string) {
		loading = true;
		error = '';
		try {
			const [detailRes, playlistRes] = await Promise.allSettled([
				orientationsApi.detail(s),
				orientationsApi.playlist(s)
			]);
			if (detailRes.status === 'fulfilled') orientation = detailRes.value.data;
			else if (detailRes.reason instanceof SkilluError && detailRes.reason.code === 'RESOURCE_NOT_FOUND') {
				error = i18n.t('errors.notFoundMessage');
			}
			if (playlistRes.status === 'fulfilled') playlist = playlistRes.value.data;
		} catch (err) {
			error = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	let style = $derived(orientation ? domainStyle(orientation.primary_domain) : null);
</script>

<svelte:head>
	<title>{orientation?.name ?? i18n.t('orientations.catalog.title')} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-10">
	<a
		href="/onboarding/orientations"
		class="mb-6 inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text-primary"
	>
		<ChevronLeft size={16} strokeWidth={2} />
		{i18n.t('orientations.detail.backToCatalog')}
	</a>

	{#if loading}
		<Skeleton class="mb-4 h-10 w-2/3" />
		<Skeleton class="mb-6 h-4 w-full" />
		<Skeleton class="h-64 w-full" rounded="xl" />
	{:else if error}
		<div class="rounded-2xl border border-error/40 bg-error/5 p-6 text-center" role="alert">
			<p class="text-sm text-error">{error}</p>
			<div class="mt-4">
				<Button variant="secondary" href="/onboarding/orientations">
					{i18n.t('orientations.detail.backToCatalog')}
				</Button>
			</div>
		</div>
	{:else if orientation && style}
		<article>
			<header class="mb-8">
				<div class="mb-3 flex items-center gap-2">
					<span class="h-2 w-2 rounded-full {style.dot}" aria-hidden="true"></span>
					<span class="text-[10px] font-bold uppercase tracking-wider text-text-muted">
						{i18n.t(`common.domains.${orientation.primary_domain}`)}
					</span>
				</div>
				<h1 class="text-4xl font-bold text-text-primary">{orientation.name}</h1>
				<p class="mt-3 max-w-3xl text-text-muted">{orientation.description}</p>
			</header>

			<section class="grid gap-6 sm:grid-cols-2">
				<div class="rounded-2xl border border-border bg-surface-elevated p-5">
					<h2 class="mb-3 text-sm font-bold uppercase tracking-wider text-text-muted">
						{i18n.t('orientations.detail.primaryDomain')}
					</h2>
					<p class="text-text-primary">{i18n.t(`common.domains.${orientation.primary_domain}`)}</p>
					{#if orientation.secondary_domains.length > 0}
						<h3 class="mt-4 mb-2 text-sm font-bold uppercase tracking-wider text-text-muted">
							{i18n.t('orientations.detail.secondaryDomains')}
						</h3>
						<ul class="flex flex-wrap gap-1.5" role="list">
							{#each orientation.secondary_domains as d}
								<li class="rounded bg-surface-overlay px-2 py-0.5 text-xs text-text-muted">
									{i18n.t(`common.domains.${d}`)}
								</li>
							{/each}
						</ul>
					{/if}
				</div>

				<div class="rounded-2xl border border-border bg-surface-elevated p-5">
					<h2 class="mb-3 text-sm font-bold uppercase tracking-wider text-text-muted">
						{i18n.t('orientations.detail.tags')}
					</h2>
					{#if orientation.tags.length === 0}
						<p class="text-sm text-text-muted">—</p>
					{:else}
						<ul class="flex flex-wrap gap-1.5" role="list">
							{#each orientation.tags as tag}
								<li class="rounded bg-surface-overlay px-2 py-0.5 text-xs text-text-muted">
									{tag}
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			</section>

			<section
				class="mt-8 rounded-2xl border border-border bg-surface-elevated p-6"
				aria-labelledby="playlist-preview-title"
			>
				<header class="mb-4">
					<h2 id="playlist-preview-title" class="text-lg font-bold text-text-primary">
						{i18n.t('orientations.detail.playlistTitle')}
					</h2>
					<p class="mt-1 text-sm text-text-muted">
						{i18n.t('orientations.detail.playlistSubtitle')}
					</p>
				</header>

				{#if playlist.length === 0}
					<p class="rounded-lg bg-surface-overlay px-4 py-3 text-sm text-text-muted">
						{i18n.t('orientations.detail.playlistEmpty')}
					</p>
				{:else}
					<ol class="space-y-2" role="list">
						{#each playlist.slice(0, 5) as item, i (item.id)}
							<li class="flex items-start gap-3 rounded-lg border border-border bg-surface-overlay p-3">
								<span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-fg">
									{i + 1}
								</span>
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium text-text-primary">{item.title}</p>
									{#if item.description}
										<p class="mt-0.5 text-xs text-text-muted">{item.description}</p>
									{/if}
								</div>
								<span class="rounded bg-surface px-2 py-0.5 text-[10px] uppercase text-text-muted">
									{item.type === 'challenge'
										? i18n.t('common.nav.challenges')
										: (i18n.locale === 'fr' ? 'Team' : 'Team')}
								</span>
							</li>
						{/each}
					</ol>
				{/if}
			</section>

			<div class="mt-8 flex items-center justify-end">
				<Button variant="primary" onclick={() => goto('/onboarding/orientations')}>
					{i18n.t('orientations.detail.pickCta')}
				</Button>
			</div>
		</article>
	{/if}
</div>
