<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { challengesApi } from '$api/challenges';
	import { SkilluError } from '$api/client';
	import ChallengeCard from '$components/challenge/ChallengeCard.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import Button from '$components/ui/Button.svelte';
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

<div class="mx-auto max-w-6xl px-4 py-8">

	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-3xl sm:text-4xl font-bold mb-2">{i18n.t('challenges.title')}</h1>
		<p class="text-text-muted">{i18n.t('challenges.subtitle')}</p>
	</div>

	<!-- Filters -->
	<div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
		<!-- Domain tabs -->
		<div class="flex gap-1 rounded-lg border border-border bg-surface-elevated p-1">
			{#each domains as d}
				<button
					type="button"
					class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-200
						{filterDomain === d.value ? 'bg-surface-overlay text-text-primary' : 'text-text-muted hover:text-text-primary'}"
					onclick={() => { filterDomain = d.value; applyFilter(); }}
				>
					{#if d.dot}
						<div class="h-2 w-2 rounded-full {d.dot}"></div>
					{/if}
					{d.value === '' ? i18n.t('challenges.allDomains') : i18n.t(`common.domains.${d.value}`)}
				</button>
			{/each}
		</div>

		<!-- Difficulty -->
		<div class="flex gap-1 rounded-lg border border-border bg-surface-elevated p-1 sm:ml-auto">
			{#each difficultyValues as d}
				<button
					type="button"
					class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-200
						{filterDifficulty === d ? 'bg-surface-overlay text-text-primary' : 'text-text-muted hover:text-text-primary'}"
					onclick={() => { filterDifficulty = d; applyFilter(); }}
				>
					{d === 0 ? i18n.t('challenges.allDifficulties') : i18n.t(`common.difficulty.${d}`)}
				</button>
			{/each}
		</div>
	</div>

	<!-- Grid -->
	{#if loading}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each Array(6) as _}
				<div class="rounded-xl border border-border bg-surface-elevated overflow-hidden">
					<div class="flex items-center gap-2 border-b border-border px-4 py-2.5">
						<Skeleton class="h-2.5 w-2.5" rounded="sm" />
						<Skeleton class="h-3 w-12" />
						<div class="ml-auto"><Skeleton class="h-4 w-16" /></div>
					</div>
					<div class="p-4">
						<Skeleton class="h-4 w-3/4 mb-2" />
						<Skeleton class="h-3 w-full mb-1" />
						<Skeleton class="h-3 w-2/3 mb-4" />
						<div class="flex justify-between">
							<Skeleton class="h-3 w-12" />
							<Skeleton class="h-4 w-14" />
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else if error}
		<div class="rounded-xl border border-border bg-surface-elevated p-12 text-center">
			<p class="text-text-muted mb-4">{error}</p>
			<Button variant="secondary" onclick={loadChallenges}>{i18n.t('common.actions.retry')}</Button>
		</div>
	{:else if challenges.length === 0}
		<div class="rounded-xl border border-border bg-surface-elevated p-12 text-center">
			<p class="text-sm text-text-muted">{i18n.t('challenges.noneFound')}</p>
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
					{i18n.t('common.actions.previous')}
				</Button>
				<span class="text-sm text-text-muted font-mono">
					{currentPage} / {totalPages}
				</span>
				<Button variant="ghost" size="sm" disabled={currentPage >= totalPages} onclick={nextPage}>
					{i18n.t('common.actions.next')}
				</Button>
			</div>
		{/if}
	{/if}
</div>
