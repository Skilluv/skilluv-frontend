<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { challengesApi } from '$api/challenges';
	import { SkilluError } from '$api/client';
	import ChallengeCard from '$components/challenge/ChallengeCard.svelte';
	import Button from '$components/ui/Button.svelte';
	import SegmentedControl from '$components/ui/SegmentedControl.svelte';
	import Pagination from '$components/ui/Pagination.svelte';
	import type { Challenge, SkillDomain } from '$types';

	let challenges = $state<{ challenge: Challenge; locked: boolean }[]>([]);
	let loading = $state(true);
	let error = $state('');
	let currentPage = $state(1);
	let totalPages = $state(1);

	let filterDomain = $state<SkillDomain | ''>('');
	let filterDifficulty = $state<number | 0>(0);

	const domains: { value: SkillDomain | ''; dot: string }[] = [
		{ value: '', dot: '' },
		{ value: 'code', dot: 'bg-blue-500' },
		{ value: 'design', dot: 'bg-pink-500' },
		{ value: 'game', dot: 'bg-green-500' },
		{ value: 'security', dot: 'bg-red-500' }
	];

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
			else error = i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	function applyFilter() { currentPage = 1; loadChallenges(); }
	function nextPage() { if (currentPage < totalPages) { currentPage++; loadChallenges(); } }
	function prevPage() { if (currentPage > 1) { currentPage--; loadChallenges(); } }
</script>

<svelte:head>
	<title>{i18n.t('challenges.title')} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-10 sm:py-16">

	<!-- Header -->
	<div class="mb-8 sm:mb-10">
		<h1 class="text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-3 sm:mb-4">
			{i18n.t('challenges.title')}<span class="text-accent">.</span>
		</h1>
		<p class="text-base sm:text-lg text-text-muted max-w-2xl">{i18n.t('challenges.subtitle')}</p>
	</div>

	<!-- Filters — scrollables horizontalement sur mobile -->
	<div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
		<div class="filter-scroll -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto">
			<SegmentedControl
				items={domains.map((d) => ({
					value: d.value,
					label: d.value === '' ? i18n.t('challenges.allDomains') : i18n.t(`common.domains.${d.value}`),
					dot: d.dot || undefined
				}))}
				bind:value={filterDomain}
				onchange={applyFilter}
			/>
		</div>

		<div class="filter-scroll -mx-4 px-4 sm:mx-0 sm:px-0 sm:ml-auto overflow-x-auto">
			<SegmentedControl
				items={difficultyValues.map((d) => ({
					value: d,
					label: d === 0 ? i18n.t('challenges.allDifficulties') : i18n.t(`common.difficulty.${d}`)
				}))}
				bind:value={filterDifficulty}
				onchange={applyFilter}
				size="sm"
			/>
		</div>
	</div>

	<!-- Grid -->
	{#if loading}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each Array(6) as _}
				<ChallengeCard loading />
			{/each}
		</div>
	{:else if error}
		<div class="rounded-2xl border border-border bg-surface-elevated p-8 sm:p-12 text-center">
			<p class="text-text-muted mb-4">{error}</p>
			<Button variant="secondary" onclick={loadChallenges}>{i18n.t('common.actions.retry')}</Button>
		</div>
	{:else if challenges.length === 0}
		<div class="rounded-2xl border border-border bg-surface-elevated p-8 sm:p-12 text-center">
			<p class="text-sm text-text-muted">{i18n.t('challenges.noneFound')}</p>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each challenges as { challenge, locked }}
				<ChallengeCard {challenge} {locked} />
			{/each}
		</div>

		<Pagination current={currentPage} total={totalPages} onchange={(p) => { currentPage = p; loadChallenges(); }} />
	{/if}
</div>

<style>
	/* Cache la scrollbar des conteneurs de filtres (visuel propre sur mobile) */
	.filter-scroll {
		scrollbar-width: none;
	}
	.filter-scroll::-webkit-scrollbar {
		display: none;
	}
</style>
