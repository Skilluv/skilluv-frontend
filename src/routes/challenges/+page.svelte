<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { challengesApi } from '$api/challenges';
	import { SkilluError } from '$api/client';
	import ChallengeCard from '$components/challenge/ChallengeCard.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import type { Challenge, SkillDomain } from '$types';

	// State
	let challenges = $state<{ challenge: Challenge; locked: boolean }[]>([]);
	let loading = $state(true);
	let error = $state('');
	let currentPage = $state(1);
	let totalPages = $state(1);

	// Filtres
	let filterDomain = $state<SkillDomain | ''>('');
	let filterDifficulty = $state<number | 0>(0);

	const domainValues: (SkillDomain | '')[] = ['', 'code', 'design', 'game', 'security'];
	const difficultyValues = [0, 1, 2, 3, 4, 5];

	$effect(() => {
		loadChallenges();
	});

	async function loadChallenges() {
		loading = true;
		error = '';
		try {
			const res = await challengesApi.list({
				domain: filterDomain || undefined,
				difficulty: filterDifficulty || undefined,
				page: currentPage,
				per_page: 12
			});
			challenges = res.data;
			totalPages = res.pagination.total_pages;
		} catch (err) {
			if (err instanceof SkilluError) error = err.message;
			else error = 'Impossible de charger les challenges.';
		} finally {
			loading = false;
		}
	}

	function applyFilter() {
		currentPage = 1;
		loadChallenges();
	}

	function nextPage() {
		if (currentPage < totalPages) {
			currentPage++;
			loadChallenges();
		}
	}

	function prevPage() {
		if (currentPage > 1) {
			currentPage--;
			loadChallenges();
		}
	}
</script>

<svelte:head>
	<title>{i18n.t('challenges.title')} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-8">
	<h1 class="mb-2 text-3xl font-bold">{i18n.t('challenges.title')}</h1>
	<p class="mb-8 text-text-muted">{i18n.t('challenges.subtitle')}</p>

	<!-- Filtres -->
	<div class="mb-6 flex flex-wrap items-center gap-3">
		<!-- Domaine -->
		<div class="flex gap-1.5">
			{#each domainValues as d}
				<button
					type="button"
					class="rounded-xl px-3 py-1.5 text-sm font-medium transition-colors
						{filterDomain === d
						? 'bg-primary text-white'
						: 'bg-surface-elevated text-text-muted hover:text-text-primary'}"
					onclick={() => { filterDomain = d; applyFilter(); }}
				>
					{d === '' ? i18n.t('challenges.allDomains') : i18n.t(`common.domains.${d}`)}
				</button>
			{/each}
		</div>

		<!-- Difficulté -->
		<select
			bind:value={filterDifficulty}
			onchange={applyFilter}
			class="rounded-xl border border-border bg-surface-elevated px-3 py-1.5 text-sm text-text-primary"
		>
			{#each difficultyValues as d}
				<option value={d}>{d === 0 ? i18n.t('challenges.allDifficulties') : i18n.t(`common.difficulty.${d}`)}</option>
			{/each}
		</select>
	</div>

	<!-- Grille -->
	{#if loading}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each Array(6) as _}
				<div class="rounded-2xl border border-border bg-surface-elevated p-5">
					<div class="mb-3 flex gap-2">
						<Skeleton class="h-5 w-16" />
						<Skeleton class="h-5 w-14" />
					</div>
					<Skeleton class="mb-2 h-5 w-3/4" />
					<Skeleton class="mb-4 h-4 w-full" />
					<Skeleton class="h-4 w-1/2" />
				</div>
			{/each}
		</div>
	{:else if error}
		<div class="text-center py-12">
			<p class="text-text-muted mb-4">{error}</p>
			<Button variant="secondary" onclick={loadChallenges}>{i18n.t('common.actions.retry')}</Button>
		</div>
	{:else if challenges.length === 0}
		<div class="text-center py-12">
			<p class="text-4xl mb-4">🔍</p>
			<p class="text-text-muted">{i18n.t('challenges.noneFound')}</p>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each challenges as { challenge, locked }}
				<ChallengeCard {challenge} {locked} />
			{/each}
		</div>

		<!-- Pagination -->
		{#if totalPages > 1}
			<div class="mt-8 flex items-center justify-center gap-4">
				<Button variant="ghost" size="sm" disabled={currentPage <= 1} onclick={prevPage}>
					← {i18n.t('common.actions.previous')}
				</Button>
				<span class="text-sm text-text-muted">
					{i18n.t('common.page')} {currentPage} / {totalPages}
				</span>
				<Button variant="ghost" size="sm" disabled={currentPage >= totalPages} onclick={nextPage}>
					{i18n.t('common.actions.next')} →
				</Button>
			</div>
		{/if}
	{/if}
</div>
