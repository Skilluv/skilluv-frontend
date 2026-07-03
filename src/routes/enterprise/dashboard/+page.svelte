<script lang="ts">
	import { enterpriseApi } from '$api/enterprise';
	import { SkilluError } from '$api/client';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import Button from '$components/ui/Button.svelte';
	import { i18n } from '$lib/i18n';

	let platformStats = $state<{
		total_talents: number;
		by_domain: Record<string, number>;
		by_title: Record<string, number>;
		avg_fragments: number;
		active_last_30d: number;
	} | null>(null);

	let myStats = $state<{
		bookmarks: number;
		talent_lists: number;
		interest_requests: { total: number; pending: number; accepted: number; declined: number };
		active_conversations: number;
		team_size: number;
	} | null>(null);

	let loading = $state(true);
	let error = $state('');

	$effect(() => {
		loadDashboard();
	});

	async function loadDashboard() {
		loading = true;
		try {
			const [pRes, mRes] = await Promise.all([
				enterpriseApi.platformStats(),
				enterpriseApi.myStats()
			]);
			platformStats = pRes.data;
			myStats = mRes.data;
		} catch (err) {
			if (err instanceof SkilluError) error = err.message;
			else error = i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>{i18n.t('enterprise.dashboard.title')} — Skilluv</title>
</svelte:head>

<div class="p-6 lg:p-8">
	<h1 class="mb-2 text-2xl font-bold">{i18n.t('enterprise.dashboard.title')}</h1>
	<p class="mb-8 text-text-muted">{i18n.t('enterprise.dashboard.subtitle')}</p>

	{#if loading}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{#each Array(8) as _}
				<Skeleton class="h-24 w-full" rounded="xl" />
			{/each}
		</div>
	{:else if error}
		<p class="text-text-muted">{error}</p>
	{:else}
		<!-- Mon activité -->
		{#if myStats}
			<h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-text-muted">{i18n.t('enterprise.dashboard.myActivity')}</h2>
			<div class="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<div class="rounded-xl border border-border bg-surface-elevated p-4">
					<p class="text-xs text-text-muted">{i18n.t('enterprise.dashboard.bookmarks')}</p>
					<p class="mt-1 text-2xl font-bold">{myStats.bookmarks}</p>
				</div>
				<div class="rounded-xl border border-border bg-surface-elevated p-4">
					<p class="text-xs text-text-muted">{i18n.t('enterprise.dashboard.lists')}</p>
					<p class="mt-1 text-2xl font-bold">{myStats.talent_lists}</p>
				</div>
				<div class="rounded-xl border border-border bg-surface-elevated p-4">
					<p class="text-xs text-text-muted">{i18n.t('enterprise.dashboard.interests')}</p>
					<p class="mt-1 text-2xl font-bold">{myStats.interest_requests.total}</p>
					<div class="mt-1 flex gap-2 text-xs text-text-muted">
						<span class="text-warning">{myStats.interest_requests.pending} {i18n.t('enterprise.dashboard.pending')}</span>
						<span class="text-success">{myStats.interest_requests.accepted} {i18n.t('enterprise.dashboard.accepted')}</span>
					</div>
				</div>
				<div class="rounded-xl border border-border bg-surface-elevated p-4">
					<p class="text-xs text-text-muted">{i18n.t('enterprise.dashboard.conversations')}</p>
					<p class="mt-1 text-2xl font-bold">{myStats.active_conversations}</p>
				</div>
			</div>
		{/if}

		<!-- Plateforme -->
		{#if platformStats}
			<h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-text-muted">{i18n.t('enterprise.dashboard.platform')}</h2>
			<div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<div class="rounded-xl border border-border bg-surface-elevated p-4">
					<p class="text-xs text-text-muted">{i18n.t('enterprise.dashboard.totalTalents')}</p>
					<p class="mt-1 text-2xl font-bold">{platformStats.total_talents.toLocaleString()}</p>
				</div>
				<div class="rounded-xl border border-border bg-surface-elevated p-4">
					<p class="text-xs text-text-muted">{i18n.t('enterprise.dashboard.active30d')}</p>
					<p class="mt-1 text-2xl font-bold">{platformStats.active_last_30d.toLocaleString()}</p>
				</div>
				<div class="rounded-xl border border-border bg-surface-elevated p-4">
					<p class="text-xs text-text-muted">{i18n.t('enterprise.dashboard.avgFragments')}</p>
					<p class="mt-1 text-2xl font-bold">{Math.round(platformStats.avg_fragments)}</p>
				</div>
				<div class="rounded-xl border border-border bg-surface-elevated p-4">
					<p class="text-xs text-text-muted">{i18n.t('enterprise.dashboard.byDomain')}</p>
					<div class="mt-1 flex flex-wrap gap-2 text-xs">
						{#each Object.entries(platformStats.by_domain) as [domain, count]}
							<span class="rounded bg-surface-overlay px-1.5 py-0.5">{i18n.t(`common.domains.${domain}`)}: {count}</span>
						{/each}
					</div>
				</div>
			</div>
		{/if}

		<!-- Actions rapides -->
		<div class="flex flex-wrap gap-3">
			<Button variant="accent" href="/enterprise/talents">{i18n.t('enterprise.dashboard.searchTalents')}</Button>
			<Button variant="secondary" href="/enterprise/bookmarks">{i18n.t('enterprise.dashboard.viewBookmarks')}</Button>
			<Button variant="secondary" href="/enterprise/credits">
				{i18n.locale === 'fr' ? 'Crédits & facturation' : 'Credits & billing'}
			</Button>
		</div>
	{/if}
</div>
