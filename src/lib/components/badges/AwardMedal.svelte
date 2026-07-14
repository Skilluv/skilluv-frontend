<script lang="ts">
	import type { Rarity } from './types';

	interface Props {
		variant: string;
		label: string;
		rarity: Rarity;
		awardedAt: Date | string;
		size?: 'md' | 'hero';
	}

	let { variant, label, rarity, awardedAt, size = 'md' }: Props = $props();

	const dim = $derived(size === 'md' ? 96 : 160);
</script>

<div
	class="medal medal--{rarity}"
	data-variant={variant}
	style:width="{dim}px"
	style:height="{dim}px"
	role="img"
	aria-label="Médaille {label} — {rarity}"
>
	<!-- Laurier ornemental (SVG placeholder) -->
	<svg class="medal__laurel" viewBox="0 0 100 100" aria-hidden="true">
		<g fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.35">
			<path d="M 20 50 Q 25 30 45 20" />
			<path d="M 80 50 Q 75 30 55 20" />
			<path d="M 20 50 Q 25 70 45 80" />
			<path d="M 80 50 Q 75 70 55 80" />
			<ellipse cx="30" cy="38" rx="4" ry="1.5" transform="rotate(-40 30 38)" />
			<ellipse cx="38" cy="30" rx="4" ry="1.5" transform="rotate(-25 38 30)" />
			<ellipse cx="70" cy="38" rx="4" ry="1.5" transform="rotate(40 70 38)" />
			<ellipse cx="62" cy="30" rx="4" ry="1.5" transform="rotate(25 62 30)" />
			<ellipse cx="30" cy="62" rx="4" ry="1.5" transform="rotate(40 30 62)" />
			<ellipse cx="38" cy="70" rx="4" ry="1.5" transform="rotate(25 38 70)" />
			<ellipse cx="70" cy="62" rx="4" ry="1.5" transform="rotate(-40 70 62)" />
			<ellipse cx="62" cy="70" rx="4" ry="1.5" transform="rotate(-25 62 70)" />
		</g>
	</svg>
	<span class="medal__label">{label}</span>
</div>

<style>
	.medal {
		position: relative;
		border-radius: 50%;
		display: grid;
		place-items: center;
		background: linear-gradient(140deg, #2d1810 0%, #1c1a17 100%);
		color: rgba(244, 237, 224, 0.95);
		font-family: var(--font-display);
		text-align: center;
		border: 3px solid var(--sk-rarity-epic-border);
		box-shadow: var(--shadow-lg), var(--sk-rarity-epic-glow);
	}
	.medal--legendary {
		border-color: var(--sk-rarity-legendary-border);
		box-shadow: var(--shadow-lg), var(--sk-rarity-legendary-glow);
		color: var(--sk-rarity-legendary-border);
	}
	.medal__laurel {
		position: absolute;
		inset: 8%;
		color: currentColor;
	}
	.medal__label {
		font-weight: 700;
		font-variation-settings: 'opsz' 24, 'SOFT' 40, 'WONK' 0.5;
		font-size: 0.75rem;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		line-height: 1;
		padding: 0 20%;
		z-index: 1;
	}
</style>
