<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { challengesApi } from '$api/challenges';
	import { SkilluError } from '$api/client';
	import ChallengeCard from '$components/challenge/ChallengeCard.svelte';
	import Button from '$components/ui/Button.svelte';
	import SegmentedControl from '$components/ui/SegmentedControl.svelte';
	import ChipFilter from '$components/ui/ChipFilter.svelte';
	import Select from '$components/ui/Select.svelte';
	import Pagination from '$components/ui/Pagination.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import type { Challenge, SkillDomain } from '$types';
	import { PUBLIC_DOMAINS, domainStyle } from '$lib/utils/domains';

	let challenges = $state<{ challenge: Challenge; locked: boolean }[]>([]);
	let loading = $state(true);
	let error = $state('');
	let currentPage = $state(1);
	let totalPages = $state(1);

	let filterDomain = $state<SkillDomain | ''>('');
	let filterDifficulty = $state<number | 0>(0);

	// Driven by the catalogue: this listed four domains and duplicated their
	// colours, so seven disciplines had no filter at all.
	const domains: { value: SkillDomain | ''; dot: string }[] = [
		{ value: '', dot: '' },
		...PUBLIC_DOMAINS.map((d) => ({ value: d as SkillDomain | '', dot: domainStyle(d).dot }))
	];

	const difficultyValues = [0, 1, 2, 3, 4, 5];

	// Built once and handed to both the chips and the menu, so the two widths
	// can never offer different domains.
	let domainItems = $derived(
		domains.map((d) => ({
			value: d.value,
			label: d.value === '' ? i18n.t('challenges.allDomains') : i18n.t(`common.domains.${d.value}`),
			dot: d.dot || undefined
		}))
	);

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
	<title>{i18n.t('challenges.title')} | Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-10 sm:py-16">

	<!-- Header -->
	<div class="mb-8 sm:mb-10">
		<h1 class="text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-3 sm:mb-4">
			{i18n.t('challenges.title')}<span class="text-accent">.</span>
		</h1>
		<p class="text-base sm:text-lg text-text-muted max-w-2xl">{i18n.t('challenges.subtitle')}</p>
	</div>

	<!--
		Filters.

		The domain catalogue is twelve entries with "all" included, which no
		single row holds. It used to scroll sideways, so on any screen the last
		disciplines sat off-frame with nothing saying they were there: audio,
		communication and education were unreachable unless you thought to drag
		a row that looks like it ends.

		So the two filters no longer share one treatment, because they are not
		the same kind of choice. Difficulty is an ordered scale of six short
		labels — a track with a sliding indicator is exactly right, and it fits
		one line down to 360px. Domain is a flat set of peers, and peers wrap.

		Below `sm` the chips would take four rows, pushing the first challenge
		off a phone screen, so that width gets the same list as a menu instead.
		Both write the same `filterDomain`; only one is ever rendered.
	-->
	<div class="mb-6 flex flex-col gap-4">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
			<div class="min-w-0">
				<span class="mb-2 block text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.t('common.filters.domain')}
				</span>

				<ChipFilter
					class="hidden sm:flex"
					label={i18n.t('common.filters.domain')}
					items={domainItems}
					bind:value={filterDomain}
					onchange={applyFilter}
				/>

				<div class="sm:hidden">
					<Select
						items={domainItems}
						bind:value={filterDomain}
						onchange={applyFilter}
						searchable={false}
					/>
				</div>
			</div>

			<div class="shrink-0">
				<span class="mb-2 block text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.t('common.filters.difficulty')}
				</span>
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
		<EmptyState
			variant="search"
			title={i18n.locale === 'fr' ? 'Rien à trouver ici.' : 'Nothing to find here.'}
			body={i18n.locale === 'fr'
				? 'Essaie d\'autres mots ou d\'autres filtres — ou propose ce challenge à la commu.'
				: 'Try different words or filters — or propose this challenge to the community.'}
		>
			{#snippet action()}
				<Button variant="secondary" href="/community/challenges/create">
					{i18n.locale === 'fr' ? 'Proposer un challenge' : 'Propose a challenge'}
				</Button>
			{/snippet}
		</EmptyState>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each challenges as { challenge, locked }}
				<ChallengeCard {challenge} {locked} />
			{/each}
		</div>

		<Pagination current={currentPage} total={totalPages} onchange={(p) => { currentPage = p; loadChallenges(); }} />
	{/if}
</div>
