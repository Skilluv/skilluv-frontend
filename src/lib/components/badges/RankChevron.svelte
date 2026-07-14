<script lang="ts">
	import type { BadgeSize, RankLevel } from './types';
	import { RANK_NAMES } from './types';

	interface Props {
		level: RankLevel;
		size?: BadgeSize;
		showLabel?: boolean;
	}

	let { level, size = 'sm', showLabel = false }: Props = $props();

	const rankName = $derived(RANK_NAMES[level]);
	const symbol = $derived(
		level === 4 ? '♛' : level === 5 ? '❋' : '⋆'.repeat(level)
	);

	const height = $derived(size === 'sm' ? 24 : size === 'md' ? 48 : 96);
</script>

<span
	class="chevron chevron--rank-{level} chevron--{size}"
	style:height="{height}px"
	role="img"
	aria-label="Rang {rankName}"
>
	<span class="chevron__symbol">{symbol}</span>
	{#if showLabel}
		<span class="chevron__label">{rankName}</span>
	{/if}
</span>

<style>
	.chevron {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding-inline: 1rem;
		font-family: var(--font-sans);
		font-weight: 600;
		font-size: 0.75rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		clip-path: polygon(0 0, 100% 0, 92% 50%, 100% 100%, 0 100%, 8% 50%);
	}
	.chevron--rank-1 {
		background: var(--sk-rank-1-fill);
		color: var(--sk-rank-1-ink);
	}
	.chevron--rank-2 {
		background: var(--sk-rank-2-fill);
		color: var(--sk-rank-2-ink);
	}
	.chevron--rank-3 {
		background: var(--sk-rank-3-fill);
		color: var(--sk-rank-3-ink);
	}
	.chevron--rank-4 {
		background: var(--sk-rank-4-fill);
		color: var(--sk-rank-4-ink);
	}
	.chevron--rank-5 {
		background: var(--sk-rank-5-fill);
		color: var(--sk-rank-5-ink);
	}
	.chevron__symbol {
		font-size: 0.9em;
	}
	.chevron--md {
		font-size: 1rem;
		padding-inline: 1.5rem;
	}
	.chevron--hero {
		font-size: 1.75rem;
		padding-inline: 3rem;
	}
</style>
