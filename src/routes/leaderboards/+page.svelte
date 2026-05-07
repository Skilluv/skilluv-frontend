<script lang="ts">
	import { leaderboardApi } from '$api/leaderboard';
	import { auth } from '$stores/auth.svelte';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import type { LeaderboardEntry, LeaderboardDomain, LeaderboardPeriod } from '$types';

	let domain = $state<LeaderboardDomain>('global');
	let period = $state<LeaderboardPeriod>('alltime');
	let entries = $state<LeaderboardEntry[]>([]);
	let myRank = $state<{ rank: number; score: number; total_participants: number } | null>(null);
	let loading = $state(true);
	let error = $state('');

	const domains: { value: LeaderboardDomain; dot: string }[] = [
		{ value: 'global', dot: '' },
		{ value: 'code', dot: 'bg-blue-500' },
		{ value: 'design', dot: 'bg-pink-500' },
		{ value: 'game', dot: 'bg-green-500' },
		{ value: 'security', dot: 'bg-red-500' }
	];

	const periods: LeaderboardPeriod[] = ['alltime', 'monthly', 'weekly'];

	const titleColors: Record<string, string> = {
		apprenti: 'text-text-muted',
		artisan: 'text-blue-400',
		maitre: 'text-purple-400',
		legende: 'text-amber-400'
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

			if (lbRes.status === 'fulfilled') entries = lbRes.value.data.entries;
			if (rankRes.status === 'fulfilled' && rankRes.value) myRank = rankRes.value.data;
		} catch (err) {
			if (err instanceof SkilluError) error = err.message;
			else error = i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	function switchDomain(d: LeaderboardDomain) { domain = d; loadLeaderboard(); }
	function switchPeriod(p: LeaderboardPeriod) { period = p; loadLeaderboard(); }

	function domainLabel(d: LeaderboardDomain): string {
		if (d === 'global') return i18n.t('leaderboard.global');
		return i18n.t(`common.domains.${d}`);
	}
</script>

<svelte:head>
	<title>{i18n.t('leaderboard.title')} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-8">

	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-3xl sm:text-4xl font-bold mb-2">{i18n.t('leaderboard.title')}</h1>
		<p class="text-text-muted">{i18n.t('leaderboard.subtitle')}</p>
	</div>

	<!-- My rank — prominent if logged in -->
	{#if myRank && auth.isAuthenticated}
		<div class="mb-8 rounded-xl border border-border bg-surface-elevated overflow-hidden">
			<div class="border-b border-border px-5 py-2.5">
				<span class="text-xs font-bold uppercase tracking-wider text-text-muted">{i18n.t('leaderboard.yourRank')}</span>
			</div>
			<div class="grid grid-cols-3 divide-x divide-border">
				<div class="p-5 text-center">
					<p class="text-3xl font-bold">#{myRank.rank}</p>
					<p class="text-xs text-text-muted mt-1">{i18n.locale === 'fr' ? 'Rang' : 'Rank'}</p>
				</div>
				<div class="p-5 text-center">
					<p class="text-3xl font-bold text-accent">{myRank.score.toLocaleString()} <span class="text-lg">◆</span></p>
					<p class="text-xs text-text-muted mt-1">{i18n.t('leaderboard.score')}</p>
				</div>
				<div class="p-5 text-center">
					<p class="text-3xl font-bold">{myRank.total_participants.toLocaleString()}</p>
					<p class="text-xs text-text-muted mt-1">{i18n.t('leaderboard.participants')}</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Filters -->
	<div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
		<!-- Domain tabs -->
		<div class="flex gap-1 rounded-lg border border-border bg-surface-elevated p-1">
			{#each domains as d}
				<button
					type="button"
					class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-200
						{domain === d.value ? 'bg-surface-overlay text-text-primary' : 'text-text-muted hover:text-text-primary'}"
					onclick={() => switchDomain(d.value)}
				>
					{#if d.dot}
						<div class="h-2 w-2 rounded-full {d.dot}"></div>
					{/if}
					{domainLabel(d.value)}
				</button>
			{/each}
		</div>

		<!-- Period tabs -->
		<div class="flex gap-1 rounded-lg border border-border bg-surface-elevated p-1 sm:ml-auto">
			{#each periods as p}
				<button
					type="button"
					class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-200
						{period === p ? 'bg-surface-overlay text-text-primary' : 'text-text-muted hover:text-text-primary'}"
					onclick={() => switchPeriod(p)}
				>
					{i18n.t(`leaderboard.${p}`)}
				</button>
			{/each}
		</div>
	</div>

	<!-- Leaderboard -->
	{#if loading}
		<div class="rounded-xl border border-border bg-surface-elevated overflow-hidden">
			<div class="grid grid-cols-[3rem_1fr_6rem] gap-4 items-center px-5 py-3 border-b border-border">
				<Skeleton class="h-4 w-6" />
				<Skeleton class="h-4 w-32" />
				<Skeleton class="h-4 w-16 ml-auto" />
			</div>
			{#each Array(10) as _, idx}
				<div class="grid grid-cols-[3rem_1fr_6rem] gap-4 items-center px-5 py-4 {idx < 9 ? 'border-b border-border' : ''}">
					<Skeleton class="h-5 w-5" rounded="full" />
					<div class="flex items-center gap-3">
						<Skeleton class="h-9 w-9" rounded="full" />
						<div class="space-y-1.5">
							<Skeleton class="h-4 w-28" />
							<Skeleton class="h-3 w-16" />
						</div>
					</div>
					<Skeleton class="h-5 w-14 ml-auto" />
				</div>
			{/each}
		</div>
	{:else if error}
		<p class="py-12 text-center text-text-muted">{error}</p>
	{:else if entries.length === 0}
		<p class="py-12 text-center text-text-muted">{i18n.t('leaderboard.noParticipants')}</p>
	{:else}
		<div class="rounded-xl border border-border bg-surface-elevated overflow-hidden">
			<!-- Table header -->
			<div class="grid grid-cols-[3rem_1fr_auto_6rem] gap-4 items-center px-5 py-2.5 border-b border-border text-xs text-text-muted font-medium">
				<span>#</span>
				<span>Talent</span>
				<span class="hidden sm:block">{i18n.locale === 'fr' ? 'Titre' : 'Title'}</span>
				<span class="text-right">Score</span>
			</div>

			{#each entries as entry, idx}
				{@const isMe = auth.user?.username === entry.username}
				{@const isTop3 = entry.rank <= 3}
				<a
					href="/profile/{entry.username}"
					class="grid grid-cols-[3rem_1fr_auto_6rem] gap-4 items-center px-5 py-3.5 transition-colors duration-200
						{idx < entries.length - 1 ? 'border-b border-border' : ''}
						{isMe ? 'bg-accent/5' : 'hover:bg-surface-overlay/30'}"
				>
					<!-- Rank -->
					<span class="text-center font-bold {isTop3 ? 'text-lg' : 'text-sm text-text-muted'} {entry.rank === 1 ? 'text-amber-400' : ''}">{entry.rank}</span>

					<!-- User -->
					<div class="flex items-center gap-3 min-w-0">
						<div class="shrink-0 h-9 w-9 rounded-full bg-surface-overlay flex items-center justify-center text-sm font-bold {isMe ? 'text-accent' : 'text-text-muted'}">
							{entry.display_name.charAt(0).toUpperCase()}
						</div>
						<div class="min-w-0">
							<p class="text-sm font-semibold truncate {isMe ? 'text-accent' : ''}">{entry.display_name}</p>
							<div class="flex items-center gap-1.5 sm:hidden">
								<span class="text-[11px] capitalize {titleColors[entry.title]}">{i18n.t(`common.titles.${entry.title}`)}</span>
								{#if entry.golden_stars > 0}
									<span class="text-[11px] text-amber-400">{'★'.repeat(Math.min(entry.golden_stars, 3))}</span>
								{/if}
							</div>
						</div>
					</div>

					<!-- Title (desktop) -->
					<div class="hidden sm:flex items-center gap-1.5">
						<span class="text-xs capitalize {titleColors[entry.title]}">{i18n.t(`common.titles.${entry.title}`)}</span>
						{#if entry.golden_stars > 0}
							<span class="text-xs text-amber-400">{'★'.repeat(Math.min(entry.golden_stars, 3))}</span>
						{/if}
						{#if entry.country}
							<span class="text-[11px] text-text-muted ml-1">{entry.country}</span>
						{/if}
					</div>

					<!-- Score -->
					<span class="text-sm font-mono font-semibold text-right {isMe ? 'text-accent' : ''}">{entry.score.toLocaleString()} ◆</span>
				</a>
			{/each}
		</div>
	{/if}
</div>
