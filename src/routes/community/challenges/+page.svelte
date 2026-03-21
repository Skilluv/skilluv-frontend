<script lang="ts">
	import { communityApi } from '$api/community';
	import { auth } from '$stores/auth.svelte';
	import ChallengeCard from '$components/challenge/ChallengeCard.svelte';
	import Button from '$components/ui/Button.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
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

<div class="mx-auto max-w-6xl px-4 py-8">
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">{i18n.t('community.title')}</h1>
			<p class="text-text-muted">{i18n.t('community.subtitle')}</p>
		</div>
		<div class="flex gap-3">
			{#if auth.isAuthenticated}
				<Button variant="secondary" href="/community/challenges/mine">{i18n.t('community.myChallenges')}</Button>
				<Button variant="accent" href="/community/challenges/create">{i18n.t('community.createBtn')}</Button>
			{/if}
		</div>
	</div>

	{#if loading}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each Array(6) as _}
				<div class="rounded-2xl border border-border bg-surface-elevated p-5">
					<Skeleton class="mb-3 h-5 w-20" />
					<Skeleton class="mb-2 h-5 w-3/4" />
					<Skeleton class="h-4 w-full" />
				</div>
			{/each}
		</div>
	{:else if challenges.length === 0}
		<div class="py-12 text-center">
			<p class="mb-2 text-4xl">🌟</p>
			<p class="text-text-muted">{i18n.t('community.empty')}</p>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each challenges as ch}
				<div class="relative">
					<ChallengeCard challenge={ch} />
					<!-- Vote overlay -->
					<button
						class="absolute bottom-3 right-3 flex items-center gap-1 rounded-lg bg-surface-overlay px-2 py-1 text-xs transition-colors hover:bg-primary/20"
						onclick={() => toggleVote(ch)}
					>
						<span>▲</span>
						<span class="font-bold">{ch.vote_count}</span>
					</button>
				</div>
			{/each}
		</div>

		{#if totalPages > 1}
			<div class="mt-8 flex items-center justify-center gap-4">
				<Button variant="ghost" size="sm" disabled={currentPage <= 1} onclick={() => { currentPage--; loadPopular(); }}>←</Button>
				<span class="text-sm text-text-muted">{currentPage}/{totalPages}</span>
				<Button variant="ghost" size="sm" disabled={currentPage >= totalPages} onclick={() => { currentPage++; loadPopular(); }}>→</Button>
			</div>
		{/if}
	{/if}
</div>
