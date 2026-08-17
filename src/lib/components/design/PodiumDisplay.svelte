<script lang="ts">
	/**
	 * The top three of a concluded contest (SKI-237).
	 *
	 * The standing carries participant UUIDs and no names — `leaderboard_of`
	 * joins nothing — so a step shows its rank, its score and what it won, and
	 * marks the reader's own place. Inventing a display name here would be
	 * inventing a winner.
	 */
	import { Trophy } from '@lucide/svelte';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import type { TournamentParticipant } from '$types';

	interface Props {
		standing: TournamentParticipant[];
	}

	let { standing }: Props = $props();

	/** Ranked entries only, top three, in podium order. */
	let podium = $derived(
		standing
			.filter((p) => p.rank !== null && p.rank <= 3)
			.sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
	);

	/** Second, first, third — the shape a podium actually has. */
	let arranged = $derived.by(() => {
		const byRank = new Map(podium.map((p) => [p.rank, p]));
		return [byRank.get(2), byRank.get(1), byRank.get(3)].filter(
			(p): p is TournamentParticipant => p !== undefined
		);
	});

	const stepHeight: Record<number, string> = { 1: 'h-32', 2: 'h-24', 3: 'h-20' };
	const stepTone: Record<number, string> = {
		1: 'border-accent/50 bg-accent/10',
		2: 'border-border bg-surface-overlay',
		3: 'border-border bg-surface-overlay'
	};

	function rankLabel(rank: number): string {
		if (rank === 1) return i18n.t('designContests.podiumFirst');
		if (rank === 2) return i18n.t('designContests.podiumSecond');
		return i18n.t('designContests.podiumThird');
	}
</script>

{#if arranged.length > 0}
	<div class="flex items-end justify-center gap-3 sm:gap-5" data-testid="podium">
		{#each arranged as entry (entry.participant_id)}
			{@const rank = entry.rank ?? 3}
			{@const isMe = entry.participant_id === auth.user?.id}
			<div class="flex w-28 flex-col items-center sm:w-36">
				{#if rank === 1}
					<Trophy size={22} strokeWidth={2} class="mb-2 text-accent" />
				{/if}
				<p class="text-xs font-semibold text-text-muted">
					{isMe ? i18n.t('designContests.yourEntry') : rankLabel(rank)}
				</p>
				<p class="mt-0.5 font-mono text-lg font-black text-text-primary">
					{entry.score.toLocaleString()}
				</p>
				<div
					class="mt-2 flex w-full items-center justify-center rounded-t-xl border border-b-0 {stepHeight[
						rank
					]} {stepTone[rank]}"
				>
					<span class="text-2xl font-black text-text-muted">{rank}</span>
				</div>
				{#if entry.prize_fragments_awarded > 0}
					<p class="mt-2 text-xs text-accent">
						+{entry.prize_fragments_awarded.toLocaleString()} {i18n.t('common.fragments')}
					</p>
				{/if}
			</div>
		{/each}
	</div>
{/if}
