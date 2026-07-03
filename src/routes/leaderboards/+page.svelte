<script lang="ts">
	import { leaderboardApi } from '$api/leaderboard';
	import { auth } from '$stores/auth.svelte';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import SegmentedControl from '$components/ui/SegmentedControl.svelte';
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

<div class="mx-auto max-w-5xl px-4 py-12 sm:py-16">

	<!-- Header -->
	<div class="mb-10">
		<h1 class="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-4">
			{i18n.t('leaderboard.title')}<span class="text-accent">.</span>
		</h1>
		<p class="text-lg text-text-muted max-w-2xl">{i18n.t('leaderboard.subtitle')}</p>
	</div>

	<!-- My rank — prominent if logged in -->
	{#if myRank && auth.isAuthenticated}
		<div class="mb-10 rounded-2xl border border-border bg-surface-elevated overflow-hidden">
			<div class="border-b border-border px-6 py-3">
				<span class="text-xs font-bold uppercase tracking-wider text-text-muted">{i18n.t('leaderboard.yourRank')}</span>
			</div>
			<div class="grid grid-cols-3 divide-x divide-border">
				<div class="p-6 text-center">
					<p class="text-5xl sm:text-6xl font-black tracking-tight">#{myRank.rank}</p>
					<p class="text-xs uppercase tracking-wider text-text-muted mt-2">{i18n.locale === 'fr' ? 'Rang' : 'Rank'}</p>
				</div>
				<div class="p-6 text-center">
					<p class="text-5xl sm:text-6xl font-black text-accent tracking-tight">{myRank.score.toLocaleString()} <span class="text-2xl align-middle">◆</span></p>
					<p class="text-xs uppercase tracking-wider text-text-muted mt-2">{i18n.t('leaderboard.score')}</p>
				</div>
				<div class="p-6 text-center">
					<p class="text-5xl sm:text-6xl font-black tracking-tight">{myRank.total_participants.toLocaleString()}</p>
					<p class="text-xs uppercase tracking-wider text-text-muted mt-2">{i18n.t('leaderboard.participants')}</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Filters -->
	<div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
		<SegmentedControl
			items={domains.map((d) => ({
				value: d.value,
				label: domainLabel(d.value),
				dot: d.dot || undefined
			}))}
			bind:value={domain}
			onchange={loadLeaderboard}
		/>

		<SegmentedControl
			items={periods.map((p) => ({ value: p, label: i18n.t(`leaderboard.${p}`) }))}
			bind:value={period}
			onchange={loadLeaderboard}
			size="sm"
			class="sm:ml-auto"
		/>
	</div>

	<!-- Leaderboard -->
	{#if loading}
		<div class="rounded-2xl border border-border bg-surface-elevated overflow-hidden" aria-busy="true">
			<!-- Header row : grid identique au tableau réel -->
			<div class="grid grid-cols-[3rem_1fr_auto_6rem] gap-4 items-center px-5 py-2.5 border-b border-border">
				<div class="h-3 w-3 rounded bg-surface-overlay animate-[skeleton-pulse_1.5s_ease-in-out_infinite]"></div>
				<div class="h-3 w-16 rounded bg-surface-overlay animate-[skeleton-pulse_1.5s_ease-in-out_infinite]"></div>
				<div class="hidden h-3 w-12 rounded bg-surface-overlay animate-[skeleton-pulse_1.5s_ease-in-out_infinite] sm:block"></div>
				<div class="h-3 w-12 rounded bg-surface-overlay animate-[skeleton-pulse_1.5s_ease-in-out_infinite] justify-self-end"></div>
			</div>

			{#each Array(10) as _, idx}
				<div class="grid grid-cols-[3rem_1fr_auto_6rem] gap-4 items-center px-5 py-3.5 {idx < 9 ? 'border-b border-border' : ''}">
					<!-- Rank -->
					<div class="mx-auto h-5 w-5 rounded bg-surface-overlay animate-[skeleton-pulse_1.5s_ease-in-out_infinite]"></div>
					<!-- User -->
					<div class="flex items-center gap-3 min-w-0">
						<div class="shrink-0 h-9 w-9 rounded-full bg-surface-overlay animate-[skeleton-pulse_1.5s_ease-in-out_infinite]"></div>
						<div class="min-w-0 space-y-1.5">
							<div class="h-4 w-32 rounded bg-surface-overlay animate-[skeleton-pulse_1.5s_ease-in-out_infinite]"></div>
							<div class="h-3 w-20 rounded bg-surface-overlay animate-[skeleton-pulse_1.5s_ease-in-out_infinite] sm:hidden"></div>
						</div>
					</div>
					<!-- Title (desktop only) -->
					<div class="hidden sm:flex items-center gap-1.5">
						<div class="h-3 w-16 rounded bg-surface-overlay animate-[skeleton-pulse_1.5s_ease-in-out_infinite]"></div>
					</div>
					<!-- Score -->
					<div class="h-4 w-16 rounded bg-surface-overlay animate-[skeleton-pulse_1.5s_ease-in-out_infinite] justify-self-end"></div>
				</div>
			{/each}
		</div>
	{:else if error}
		<p class="py-12 text-center text-text-muted">{error}</p>
	{:else if entries.length === 0}
		<p class="py-12 text-center text-text-muted">{i18n.t('leaderboard.noParticipants')}</p>
	{:else}
		<div class="rounded-2xl border border-border bg-surface-elevated overflow-hidden">
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
