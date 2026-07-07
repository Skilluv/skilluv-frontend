<script lang="ts">
	import { communityApi } from '$api/community';
	import { auth } from '$stores/auth.svelte';
	import ChallengeCard from '$components/challenge/ChallengeCard.svelte';
	import Button from '$components/ui/Button.svelte';
	import Pagination from '$components/ui/Pagination.svelte';
	import { i18n } from '$lib/i18n';
	import type { Challenge } from '$types';

	let challenges = $state<Challenge[]>([]);
	let loading = $state(true);
	let currentPage = $state(1);
	let totalPages = $state(1);

	$effect(() => { loadPopular(); });

	async function loadPopular() {
		loading = true;
		try {
			const res = await communityApi.popular(currentPage, 12);
			challenges = res.data;
			totalPages = res.pagination.total_pages;
		} catch { /* silent */ }
		loading = false;
	}

	async function toggleVote(ch: Challenge) {
		try {
			if (ch.vote_count > 0) {
				await communityApi.unvote(ch.id);
				ch.vote_count--;
			} else {
				await communityApi.vote(ch.id);
				ch.vote_count++;
			}
		} catch { /* silent */ }
	}
</script>

<svelte:head>
	<title>{i18n.t('community.title')} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-12 sm:py-16">
	<div class="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
		<div>
			<h1 class="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-4">
				{i18n.t('community.title')}<span class="text-accent">.</span>
			</h1>
			<p class="text-lg text-text-muted max-w-2xl">{i18n.t('community.subtitle')}</p>
		</div>
		<div class="flex flex-wrap gap-3">
			{#if auth.isAuthenticated}
				<Button variant="secondary" href="/community/challenges/mine">{i18n.t('community.myChallenges')}</Button>
				<Button variant="accent" href="/community/challenges/create">{i18n.t('community.createBtn')}</Button>
			{/if}
		</div>
	</div>

	{#if loading}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each Array(6) as _}
				<ChallengeCard loading />
			{/each}
		</div>
	{:else if challenges.length === 0}
		<div class="rounded-2xl border border-border bg-surface-elevated p-16 text-center">
			<div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-overlay text-text-muted">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M12 2v6m0 8v6M4.93 4.93l4.24 4.24m5.66 5.66 4.24 4.24M2 12h6m8 0h6M4.93 19.07l4.24-4.24m5.66-5.66 4.24-4.24" />
				</svg>
			</div>
			<p class="text-base text-text-muted">{i18n.t('community.empty')}</p>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each challenges as ch}
				<div class="relative">
					<ChallengeCard challenge={ch} />
					<!-- Vote overlay -->
					<button
						class="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated px-2.5 py-1 text-xs font-semibold transition-colors hover:border-primary hover:text-primary"
						onclick={() => toggleVote(ch)}
					>
						<span>▲</span>
						<span>{ch.vote_count}</span>
					</button>
				</div>
			{/each}
		</div>

		<Pagination
			current={currentPage}
			total={totalPages}
			onchange={(p) => { currentPage = p; loadPopular(); }}
			compact
		/>
	{/if}
</div>
