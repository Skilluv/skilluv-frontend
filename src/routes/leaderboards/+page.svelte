<script lang="ts">
	import { leaderboardApi } from '$api/leaderboard';
	import { auth } from '$stores/auth.svelte';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import Badge from '$components/ui/Badge.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import type { LeaderboardEntry, LeaderboardDomain, LeaderboardPeriod } from '$types';

	let domain = $state<LeaderboardDomain>('global');
	let period = $state<LeaderboardPeriod>('alltime');
	let entries = $state<LeaderboardEntry[]>([]);
	let myRank = $state<{ rank: number; score: number; total_participants: number } | null>(null);
	let loading = $state(true);
	let error = $state('');

	const domainValues: LeaderboardDomain[] = ['global', 'code', 'design', 'game', 'security'];

	const periodValues: LeaderboardPeriod[] = ['alltime', 'monthly', 'weekly'];

	const titleColors: Record<string, string> = {
		apprenti: 'text-text-muted',
		artisan: 'text-blue-400',
		maitre: 'text-accent',
		legende: 'text-yellow-400'
	};

	const rankMedals: Record<number, string> = {
		1: '🥇',
		2: '🥈',
		3: '🥉'
	};

	$effect(() => {
		loadLeaderboard();
	});

	async function loadLeaderboard() {
		loading = true;
		error = '';
		try {
			const [lbRes, rankRes] = await Promise.allSettled([
				leaderboardApi.get(domain, period, 1, 100),
				auth.isAuthenticated ? leaderboardApi.myRank(domain, period) : Promise.resolve(null)
			]);

			if (lbRes.status === 'fulfilled') {
				entries = lbRes.value.data.entries;
			}

			if (rankRes.status === 'fulfilled' && rankRes.value) {
				myRank = rankRes.value.data;
			}
		} catch (err) {
			if (err instanceof SkilluError) error = err.message;
			else error = i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	function switchDomain(d: LeaderboardDomain) {
		domain = d;
		loadLeaderboard();
	}

	function switchPeriod(p: LeaderboardPeriod) {
		period = p;
		loadLeaderboard();
	}

	function domainLabel(d: LeaderboardDomain): string {
		if (d === 'global') return i18n.t('leaderboard.global');
		return i18n.t(`common.domains.${d}`);
	}
</script>

<svelte:head>
	<title>{i18n.t('leaderboard.title')} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-8">
	<h1 class="mb-2 text-3xl font-bold">{i18n.t('leaderboard.title')}</h1>
	<p class="mb-8 text-text-muted">{i18n.t('leaderboard.subtitle')}</p>

	<!-- Filtres domaine -->
	<div class="mb-4 flex flex-wrap gap-2">
		{#each domainValues as d}
			<button
				type="button"
				class="rounded-xl px-4 py-2 text-sm font-medium transition-colors
					{domain === d
					? 'bg-primary text-white'
					: 'bg-surface-elevated text-text-muted hover:text-text-primary'}"
				onclick={() => switchDomain(d)}
			>
				{domainLabel(d)}
			</button>
		{/each}
	</div>

	<!-- Filtres période -->
	<div class="mb-6 flex gap-2">
		{#each periodValues as p}
			<button
				type="button"
				class="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors
					{period === p
					? 'bg-accent text-white'
					: 'bg-surface-overlay text-text-muted hover:text-text-primary'}"
				onclick={() => switchPeriod(p)}
			>
				{i18n.t(`leaderboard.${p}`)}
			</button>
		{/each}
	</div>

	<!-- Mon rang -->
	{#if myRank && auth.isAuthenticated}
		<div class="mb-6 rounded-2xl border border-accent/30 bg-accent/5 p-4">
			<div class="flex items-center justify-between">
				<div>
					<span class="text-sm text-text-muted">{i18n.t('leaderboard.yourRank')}</span>
					<p class="text-2xl font-bold">#{myRank.rank}</p>
				</div>
				<div class="text-right">
					<span class="text-sm text-text-muted">{i18n.t('leaderboard.score')}</span>
					<p class="text-lg font-semibold text-accent">{myRank.score.toLocaleString()} ◆</p>
				</div>
				<div class="text-right">
					<span class="text-sm text-text-muted">{i18n.t('leaderboard.participants')}</span>
					<p class="text-lg font-semibold">{myRank.total_participants.toLocaleString()}</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Tableau -->
	{#if loading}
		<div class="flex flex-col gap-3">
			{#each Array(10) as _}
				<Skeleton class="h-14 w-full" rounded="xl" />
			{/each}
		</div>
	{:else if error}
		<p class="py-8 text-center text-text-muted">{error}</p>
	{:else if entries.length === 0}
		<p class="py-8 text-center text-text-muted">{i18n.t('leaderboard.noParticipants')}</p>
	{:else}
		<div class="overflow-hidden rounded-2xl border border-border">
			{#each entries as entry, i}
				{@const isMe = auth.user?.username === entry.username}
				<a
					href="/profile/{entry.username}"
					class="flex items-center gap-4 border-b border-border px-4 py-3 transition-colors last:border-0
						{isMe ? 'bg-accent/5' : 'hover:bg-surface-elevated'}"
				>
					<!-- Rang -->
					<div class="w-10 text-center">
						{#if rankMedals[entry.rank]}
							<span class="text-xl">{rankMedals[entry.rank]}</span>
						{:else}
							<span class="text-sm font-bold text-text-muted">#{entry.rank}</span>
						{/if}
					</div>

					<!-- User -->
					<div class="flex-1">
						<p class="font-medium {isMe ? 'text-accent' : ''}">{entry.display_name}</p>
						<div class="flex items-center gap-2 text-xs">
							<span class="capitalize {titleColors[entry.title]}">{i18n.t(`common.titles.${entry.title}`)}</span>
							{#if entry.golden_stars > 0}
								<span class="text-yellow-400">{'★'.repeat(Math.min(entry.golden_stars, 5))}</span>
							{/if}
							{#if entry.country}
								<span class="text-text-muted">{entry.country}</span>
							{/if}
						</div>
					</div>

					<!-- Score -->
					<div class="text-right">
						<p class="font-bold text-accent">{entry.score.toLocaleString()}</p>
						<p class="text-xs text-text-muted">{i18n.t('common.fragments')}</p>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
