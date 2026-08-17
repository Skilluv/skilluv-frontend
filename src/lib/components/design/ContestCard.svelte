<script lang="ts">
	/**
	 * A design contest, as a card (SKI-237).
	 *
	 * Deliberately large and image-forward: design sells itself visually, and
	 * a dense dashboard row would be the wrong shape for a brief. The
	 * moodboard from `rules` is the hero when there is one; otherwise the
	 * card falls back to type, which is honest rather than a grey placeholder
	 * pretending to be artwork.
	 */
	import { CalendarRange, Trophy } from '@lucide/svelte';
	import { i18n } from '$lib/i18n';
	import Badge from '$components/ui/Badge.svelte';
	import type { Tournament } from '$types';

	interface Props {
		contest: Tournament;
	}

	let { contest }: Props = $props();

	let moodboard = $derived(
		typeof contest.rules?.moodboard_url === 'string' ? contest.rules.moodboard_url : null
	);

	let statusLabel = $derived.by(() => {
		const key = `designContests.statuses.${contest.status}`;
		const translated = i18n.t(key);
		return translated === key ? contest.status : translated;
	});

	let statusVariant = $derived.by<'success' | 'accent' | 'default'>(() => {
		if (contest.status === 'active') return 'success';
		if (contest.status === 'registration' || contest.status === 'upcoming') return 'accent';
		return 'default';
	});

	/** Days remaining, or null once the contest is over. */
	let daysLeft = $derived.by(() => {
		const end = new Date(contest.ends_at).getTime();
		const diff = end - Date.now();
		if (diff <= 0) return null;
		return Math.ceil(diff / 86_400_000);
	});

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}
</script>

<article
	class="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-elevated transition-colors duration-200 hover:border-text-muted"
	data-testid="contest-card"
>
	<a href="/design/contests/{contest.slug}" class="block">
		{#if moodboard}
			<img
				src={moodboard}
				alt=""
				loading="lazy"
				class="aspect-[16/9] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
			/>
		{:else}
			<div
				class="flex aspect-[16/9] w-full items-center justify-center bg-surface-overlay"
				aria-hidden="true"
			>
				<Trophy size={36} strokeWidth={1.5} class="text-text-muted" />
			</div>
		{/if}
	</a>

	<div class="flex flex-1 flex-col p-5">
		<div class="flex flex-wrap items-start justify-between gap-2">
			<a
				href="/design/contests/{contest.slug}"
				class="text-lg font-bold text-text-primary underline-offset-4 hover:underline"
			>
				{contest.name}
			</a>
			<Badge variant={statusVariant} size="sm">{statusLabel}</Badge>
		</div>

		{#if contest.description}
			<p class="mt-2 line-clamp-3 flex-1 text-sm text-text-muted">{contest.description}</p>
		{/if}

		<div class="mt-4 flex flex-wrap items-center gap-4 border-t border-border pt-4 text-xs">
			<span class="inline-flex items-center gap-1.5 text-text-muted">
				<CalendarRange size={12} strokeWidth={2} />
				{daysLeft !== null
					? i18n.t('designContests.daysLeft', { n: daysLeft })
					: i18n.t('designContests.endsOn', { date: fmtDate(contest.ends_at) })}
			</span>
			{#if contest.prize_pool_fragments > 0}
				<span class="inline-flex items-center gap-1.5 font-semibold text-accent">
					<Trophy size={12} strokeWidth={2} />
					{i18n.t('designContests.prizePool', {
						n: contest.prize_pool_fragments.toLocaleString()
					})}
				</span>
			{/if}
		</div>
	</div>
</article>
