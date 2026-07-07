<script lang="ts">
	import { enterpriseApi } from '$api/enterprise';
	import { SkilluError } from '$api/client';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import Select from '$components/ui/Select.svelte';
	import SegmentedControl from '$components/ui/SegmentedControl.svelte';
	import FilterBar from '$components/ui/FilterBar.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import { i18n } from '$lib/i18n';
	import type { TalentCard, SkillDomain, Title } from '$types';

	let talents = $state<TalentCard[]>([]);
	let loading = $state(true);
	let error = $state('');
	let currentPage = $state(1);
	let totalPages = $state(1);

	// Filtres
	let query = $state('');
	let filterDomain = $state<SkillDomain | ''>('');
	let filterTitle = $state<Title | ''>('');
	let filterCountry = $state('');
	let sortBy = $state<'fragments' | 'recent' | 'relevance'>('fragments');

	const domains: { value: SkillDomain | ''; key: string }[] = [
		{ value: '', key: 'challenges.allDomains' },
		{ value: 'code', key: 'common.domains.code' },
		{ value: 'design', key: 'common.domains.design' },
		{ value: 'game', key: 'common.domains.game' },
		{ value: 'security', key: 'common.domains.security' }
	];

	const titles: { value: Title | ''; key: string }[] = [
		{ value: '', key: 'enterprise.talents.allLevels' },
		{ value: 'apprenti', key: 'common.titles.apprenti' },
		{ value: 'artisan', key: 'common.titles.artisan' },
		{ value: 'maitre', key: 'common.titles.maitre' },
		{ value: 'legende', key: 'common.titles.legende' }
	];

	const titleColors: Record<string, string> = {
		apprenti: 'text-text-muted',
		artisan: 'text-blue-400',
		maitre: 'text-accent',
		legende: 'text-yellow-400'
	};

	$effect(() => {
		searchTalents();
	});

	async function searchTalents() {
		loading = true;
		error = '';
		try {
			const res = await enterpriseApi.searchTalents({
				q: query || undefined,
				skill_domain: filterDomain || undefined,
				title: filterTitle || undefined,
				country: filterCountry || undefined,
				sort_by: sortBy,
				page: currentPage,
				per_page: 20
			});
			talents = res.data;
			totalPages = res.pagination.total_pages;
		} catch (err) {
			if (err instanceof SkilluError) error = err.message;
			else error = i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	function applySearch() {
		currentPage = 1;
		searchTalents();
	}

	async function toggleBookmark(talent: TalentCard) {
		try {
			if (talent.is_bookmarked) {
				await enterpriseApi.removeBookmark(talent.id);
				talent.is_bookmarked = false;
			} else {
				await enterpriseApi.addBookmark(talent.id);
				talent.is_bookmarked = true;
			}
		} catch {
			// silently fail
		}
	}
</script>

<svelte:head>
	<title>{i18n.t('enterprise.talents.title')} — Skilluv</title>
</svelte:head>

<div class="p-6 lg:p-8">
	<h1 class="mb-2 text-2xl font-bold">{i18n.t('enterprise.talents.title')}</h1>
	<p class="mb-6 text-text-muted">{i18n.t('enterprise.talents.subtitle')}</p>

	<!-- Search bar -->
	<div class="mb-4 flex gap-3">
		<div class="flex-1">
			<Input placeholder={i18n.t('enterprise.talents.searchPlaceholder')} bind:value={query} />
		</div>
		<Button variant="primary" onclick={applySearch}>{i18n.t('enterprise.talents.searchBtn')}</Button>
	</div>

	<!-- Filtres -->
	<FilterBar class="mb-6">
		<SegmentedControl
			size="sm"
			items={domains.map((d) => ({ value: d.value, label: i18n.t(d.key) }))}
			bind:value={filterDomain}
			onchange={applySearch}
		/>
		<Select
			size="sm"
			items={titles.map((t) => ({ value: t.value, label: i18n.t(t.key) }))}
			bind:value={filterTitle}
			onchange={applySearch}
		/>
		<Select
			size="sm"
			items={[
				{ value: 'fragments', label: i18n.t('enterprise.talents.byFragments') },
				{ value: 'recent', label: i18n.t('enterprise.talents.byRecent') },
				...(query ? [{ value: 'relevance', label: i18n.t('enterprise.talents.byRelevance') }] : [])
			]}
			bind:value={sortBy}
			onchange={applySearch}
		/>
	</FilterBar>

	<!-- Résultats -->
	{#if loading}
		<div class="flex flex-col gap-3">
			{#each Array(5) as _}
				<Skeleton class="h-20 w-full" rounded="xl" />
			{/each}
		</div>
	{:else if error}
		<p class="py-8 text-center text-text-muted">{error}</p>
	{:else if talents.length === 0}
		<p class="py-8 text-center text-text-muted">{i18n.t('enterprise.talents.noResults')}</p>
	{:else}
		<div class="flex flex-col gap-3">
			{#each talents as talent}
				<div class="flex items-center gap-4 rounded-2xl border border-border bg-surface-elevated p-4 transition-all hover:border-primary/30">
					<!-- Avatar -->
					<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-overlay text-lg font-bold text-text-muted">
						{talent.display_name.charAt(0).toUpperCase()}
					</div>

					<!-- Info -->
					<a href="/profile/{talent.username}" class="flex-1">
						<p class="font-medium hover:text-accent">{talent.display_name}</p>
						<div class="flex items-center gap-2 text-xs">
							<span class="capitalize {titleColors[talent.title]}">{talent.title}</span>
							{#if talent.golden_stars > 0}
								<span class="text-yellow-400">{'★'.repeat(Math.min(talent.golden_stars, 5))}</span>
							{/if}
							<Badge variant={talent.skill_domain}>{talent.skill_domain}</Badge>
							{#if talent.country}
								<span class="text-text-muted">{talent.country}</span>
							{/if}
						</div>
					</a>

					<!-- Stats -->
					<div class="hidden items-center gap-4 text-sm sm:flex">
						<div class="text-center">
							<p class="font-bold text-accent">{talent.total_fragments}</p>
							<p class="text-xs text-text-muted">{i18n.t('common.fragments')}</p>
						</div>
						<div class="text-center">
							<p class="font-bold">{talent.streak_current}j</p>
							<p class="text-xs text-text-muted">{i18n.t('common.streak')}</p>
						</div>
					</div>

					<!-- Actions -->
					<button
						class="shrink-0 text-lg transition-colors {talent.is_bookmarked ? 'text-accent' : 'text-text-muted hover:text-accent'}"
						onclick={() => toggleBookmark(talent)}
						title={talent.is_bookmarked ? i18n.t('enterprise.talents.removeBookmark') : i18n.t('enterprise.talents.addBookmark')}
					>
						{talent.is_bookmarked ? '★' : '☆'}
					</button>
				</div>
			{/each}
		</div>

		<!-- Pagination -->
		{#if totalPages > 1}
			<div class="mt-6 flex items-center justify-center gap-4">
				<Button variant="ghost" size="sm" disabled={currentPage <= 1} onclick={() => { currentPage--; searchTalents(); }}>
					← {i18n.t('common.actions.previous')}
				</Button>
				<span class="text-sm text-text-muted">{i18n.t('common.page')} {currentPage} / {totalPages}</span>
				<Button variant="ghost" size="sm" disabled={currentPage >= totalPages} onclick={() => { currentPage++; searchTalents(); }}>
					{i18n.t('common.actions.next')} →
				</Button>
			</div>
		{/if}
	{/if}
</div>
