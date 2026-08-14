<script lang="ts">
	import { onMount } from 'svelte';
	import { i18n } from '$lib/i18n';
	import { scrollReveal } from '$lib/utils/animations';
	import { domainStyle, titleColor } from '$lib/utils/domains';
	import { leaderboardApi } from '$lib/api/leaderboard';
	import Button from '$components/ui/Button.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import type { LeaderboardEntry } from '$lib/types';
	import { Check } from '@lucide/svelte';

	/**
	 * Community board, fed by the real leaderboard.
	 *
	 * This section used to hard-code five contributors with ranks and fragment
	 * counts. There are no registered users yet, so every name on it was made up
	 * — on the page a recruiter reads first. It now shows whoever is actually
	 * there, and says plainly that nobody is when the board comes back empty.
	 * That emptiness is the strongest thing we can say before opening: the first
	 * arrivals are not catching up with a ranking, they are setting it.
	 */
	let entries = $state<LeaderboardEntry[] | null>(null);
	let failed = $state(false);

	onMount(async () => {
		try {
			const res = await leaderboardApi.get('global', 'alltime', 1, 5);
			entries = res.data.entries ?? [];
		} catch {
			// A leaderboard outage must not take the landing page down with it.
			failed = true;
			entries = [];
		}
	});

	const hasEntries = $derived((entries?.length ?? 0) > 0);
</script>

<section class="py-16 sm:py-24 lg:py-32">
	<div class="mx-auto max-w-7xl px-4">
		<div use:scrollReveal class="mb-12 flex items-end justify-between">
			<div>
				<h2
					class="mb-4 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl"
				>
					{i18n.t('board.title')}<br />
					<span class="text-accent">{i18n.t('board.titleAccent')}</span>
				</h2>
				<p class="max-w-2xl text-base text-text-muted sm:text-lg">
					{i18n.t('board.subtitle')}
				</p>
			</div>
			<Button variant="ghost" href="/leaderboards" class="hidden shrink-0 sm:inline-flex">
				{i18n.t('leaderboard.title')} →
			</Button>
		</div>

		{#if entries === null}
			<div class="flex flex-col gap-2" data-testid="board-loading">
				<Skeleton class="h-16 w-full" rounded="xl" />
				<Skeleton class="h-16 w-full" rounded="xl" />
				<Skeleton class="h-16 w-full" rounded="xl" />
			</div>
		{:else if hasEntries}
			<div
				use:scrollReveal
				data-testid="board-entries"
				class="overflow-hidden rounded-2xl border-2 border-cat-share bg-surface-share"
			>
				{#each entries as entry, idx (entry.user_id)}
					{@const ds = domainStyle(null)}
					<a
						href={`/profile/${entry.username}`}
						class="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-overlay {idx <
						entries.length - 1
							? 'border-b border-border'
							: ''}"
					>
						<span class="w-6 shrink-0 font-mono text-sm text-text-muted">#{entry.rank}</span>
						<span
							class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-overlay text-sm font-bold {ds.text}"
						>
							{entry.display_name.charAt(0).toUpperCase()}
						</span>
						<span class="min-w-0 flex-1">
							<span class="block truncate text-sm font-semibold">{entry.display_name}</span>
							<span class="block text-xs {titleColor(entry.title)}">
								{i18n.t(`common.titles.${entry.title}`)}
							</span>
						</span>
						<span class="shrink-0 font-mono text-xs text-text-muted">
							{entry.score.toLocaleString(i18n.locale)} ◆
						</span>
					</a>
				{/each}
			</div>
		{:else}
			<div
				use:scrollReveal
				data-testid="board-empty"
				class="rounded-2xl border-2 border-accent/30 bg-accent/5 p-6 sm:p-10"
			>
				<h3 class="text-2xl font-black tracking-tight sm:text-3xl">
					{i18n.t('board.emptyTitle')}
				</h3>
				<p class="mt-3 max-w-2xl text-base leading-relaxed text-text-muted">
					{i18n.t('board.emptyBody')}
				</p>

				<ul class="mt-6 flex flex-col gap-2.5">
					{#each ['board.emptyPoint1', 'board.emptyPoint2', 'board.emptyPoint3'] as key (key)}
						<li class="flex items-start gap-2.5 text-sm">
							<Check size={16} strokeWidth={2.5} class="mt-0.5 shrink-0 text-accent" />
							<span>{i18n.t(key)}</span>
						</li>
					{/each}
				</ul>

				<div class="mt-8">
					<Button variant="accent" size="lg" href="/auth/register">
						{i18n.t('board.emptyCta')}
					</Button>
				</div>

				{#if failed}
					<p class="mt-4 text-xs text-text-muted">{i18n.t('board.loadError')}</p>
				{/if}
			</div>
		{/if}

		<div class="mt-6 sm:hidden">
			<Button variant="ghost" href="/leaderboards" class="w-full">
				{i18n.t('leaderboard.title')} →
			</Button>
		</div>
	</div>
</section>
