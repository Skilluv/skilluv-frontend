<script lang="ts">
	import type { KeyType } from './types';
	import Key from './primitives/Key.svelte';

	interface Props {
		eventName: string;
		year: number;
		color?: string;
		keyOverlay?: KeyType;
		size?: 'sm' | 'md' | 'hero';
	}

	let {
		eventName,
		year,
		color = 'var(--color-accent)',
		keyOverlay,
		size = 'md'
	}: Props = $props();

	const dim = $derived(size === 'sm' ? 64 : size === 'md' ? 96 : 144);
</script>

<div
	class="stamp"
	style:width="{dim}px"
	style:height="{dim}px"
	style:--stamp-color={color}
	role="img"
	aria-label="{eventName} {year}"
>
	{#if keyOverlay}
		<div class="stamp__key-overlay">
			<Key type={keyOverlay} size={dim / 4} color="rgba(244, 237, 224, 0.4)" />
		</div>
	{/if}
	<span class="stamp__name">{eventName}</span>
	<span class="stamp__year">{year}</span>
</div>

<style>
	.stamp {
		position: relative;
		display: grid;
		place-items: center;
		grid-template-rows: auto auto;
		gap: 2px;
		background: var(--stamp-color);
		clip-path: polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%);
		color: rgba(244, 237, 224, 0.95);
		font-family: var(--font-sans);
		text-align: center;
		box-shadow: inset 0 -4px 8px rgba(0, 0, 0, 0.25), var(--shadow-sm);
	}
	.stamp__key-overlay {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		z-index: 0;
	}
	.stamp__name,
	.stamp__year {
		position: relative;
		z-index: 1;
	}
	.stamp__name {
		font-family: var(--font-display);
		font-weight: 700;
		font-variation-settings: 'opsz' 24, 'SOFT' 40, 'WONK' 0.5;
		font-size: 0.75rem;
		letter-spacing: 0.05em;
		line-height: 1;
	}
	.stamp__year {
		font-family: var(--font-mono);
		font-size: 0.625rem;
		letter-spacing: 0.1em;
		opacity: 0.85;
	}
</style>
