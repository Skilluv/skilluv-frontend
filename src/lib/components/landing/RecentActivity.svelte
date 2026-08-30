<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { i18n } from '$lib/i18n';
	import { scrollReveal } from '$lib/utils/animations';
	import { domainStyle, titleColor } from '$lib/utils/domains';
	import { leaderboardApi } from '$lib/api/leaderboard';
	import Button from '$components/ui/Button.svelte';
	import type { LeaderboardEntry } from '$lib/types';

	/**
	 * Community board, fed by the real leaderboard.
	 *
	 * This section used to hard-code five contributors with ranks and fragment
	 * counts, on a platform with no registered users. It now shows whoever is
	 * actually there.
	 *
	 * Before the opening the board is empty, and an empty board is not something
	 * to write a headline about. So this slot carries the positioning instead —
	 * the comparison from `business-docs/00-socle`, which is what actually
	 * differentiates Skilluv and is true whether or not anyone has signed up.
	 */
	let entries = $state<LeaderboardEntry[]>([]);
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

	const hasEntries = $derived(entries.length > 0);

	// Categories only, never brand names.
	const comparison = $derived(
		['bootcamps', 'practice', 'jobs', 'freelance', 'offshore'].map((key) => ({
			key,
			label: i18n.t(`board.${key}Label`),
			them: i18n.t(`board.${key}Them`),
			us: i18n.t(`board.${key}Us`)
		}))
	);
</script>

<section class="py-16 sm:py-24 lg:py-32">
	<div class="mx-auto max-w-7xl px-4">
		{#if hasEntries}
			<div use:scrollReveal class="mb-12 flex items-end justify-between">
				<h2
					class="text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl"
				>
					{i18n.t('leaderboard.title')}<span class="text-accent">.</span>
				</h2>
				<Button variant="ghost" href="/leaderboards" class="hidden shrink-0 sm:inline-flex">
					{i18n.t('leaderboard.title')} →
				</Button>
			</div>

			<div
				use:scrollReveal
				data-testid="board-entries"
				class="overflow-hidden rounded-2xl border-2 border-cat-share bg-surface-share"
			>
				{#each entries as entry, idx (entry.user_id)}
					{@const ds = domainStyle(null)}
					<a
						href={resolve(`/profile/${entry.username}`)}
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
			<div use:scrollReveal class="mb-10 max-w-3xl sm:mb-14">
				<h2
					class="mb-4 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl"
				>
					{i18n.t('board.title')}<br />
					<span class="text-text-muted">{i18n.t('board.titleAccent')}</span>
				</h2>
				<p class="text-2xl font-bold text-accent sm:text-3xl">
					{i18n.t('board.subtitle')}
				</p>
			</div>

			<div
				use:scrollReveal
				data-testid="board-comparison"
				class="overflow-hidden rounded-2xl border border-border bg-surface-elevated"
			>
				<div
					class="hidden grid-cols-[1fr_1fr] gap-6 border-b border-border px-6 py-3 text-xs font-bold uppercase tracking-widest text-text-muted sm:grid"
				>
					<span>{i18n.t('board.rowThem')}</span>
					<span class="text-accent">{i18n.t('board.rowUs')}</span>
				</div>

				{#each comparison as row, idx (row.key)}
					<div
						class="px-6 py-5 {idx < comparison.length - 1 ? 'border-b border-border' : ''}"
						data-testid="comparison-row"
					>
						<p class="mb-3 text-sm font-bold">{row.label}</p>
						<div class="grid gap-3 sm:grid-cols-2 sm:gap-6">
							<p class="text-sm text-text-muted">{row.them}</p>
							<p class="text-sm font-medium">{row.us}</p>
						</div>
					</div>
				{/each}
			</div>

			<div use:scrollReveal class="mt-8">
				<Button variant="accent" size="lg" href="/auth/register">
					{i18n.t('board.cta')}
				</Button>
				{#if failed}
					<p class="mt-4 text-xs text-text-muted">{i18n.t('board.loadError')}</p>
				{/if}
			</div>
		{/if}
	</div>
</section>
