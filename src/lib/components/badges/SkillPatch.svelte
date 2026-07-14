<script lang="ts">
	import type { BadgeSize, KeyType, Rarity, SkillCategory } from './types';
	import Key from './primitives/Key.svelte';

	interface Props {
		skill: string;
		category: SkillCategory;
		keyType?: KeyType;
		rarity?: Rarity;
		size?: BadgeSize;
		count?: number;
		subLabel?: string;
		interactive?: boolean;
		onClick?: () => void;
	}

	let {
		skill,
		category,
		keyType = 'circle',
		rarity = 'common',
		size = 'md',
		count = 0,
		subLabel = '',
		interactive = false,
		onClick
	}: Props = $props();

	const dim = $derived(
		size === 'sm' ? 64 : size === 'md' ? 96 : size === 'lg' ? 128 : 192
	);
	const keySize = $derived(dim / 3);

	const label = $derived(
		`${skill} — ${rarity}${count ? `, ${count} preuve${count > 1 ? 's' : ''}` : ''}`
	);
</script>

<button
	type="button"
	class="patch patch--{category} patch--{rarity} patch--{size}"
	class:patch--interactive={interactive}
	style:width="{dim}px"
	style:height="{dim}px"
	onclick={onClick}
	disabled={!onClick && !interactive}
	aria-label={label}
>
	<span class="patch__top">{skill}</span>
	<span class="patch__key"><Key type={keyType} size={keySize} /></span>
	{#if subLabel}
		<span class="patch__bot">{subLabel}</span>
	{/if}
</button>

<style>
	.patch {
		display: grid;
		place-items: center;
		grid-template-rows: auto auto auto;
		gap: 2px;
		border-radius: 50%;
		padding: 8px;
		text-align: center;
		border-style: solid;
		border-width: 1px;
		box-shadow: var(--shadow-md), inset 0 -8px 16px rgba(0, 0, 0, 0.15);
		font-family: var(--font-sans);
		font-weight: 600;
		cursor: default;
		transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	.patch:disabled {
		cursor: default;
	}
	.patch--interactive {
		cursor: pointer;
	}
	.patch--interactive:hover {
		transform: rotate(-2deg) translateY(-3px);
	}

	/* Category background + border */
	.patch--craft {
		background: #3a2510;
		color: var(--color-cat-craft);
		border-color: var(--color-cat-craft);
	}
	.patch--create {
		background: #3a1010;
		color: var(--color-cat-create);
		border-color: var(--color-cat-create);
	}
	.patch--understand {
		background: #0f1e2a;
		color: var(--color-cat-understand);
		border-color: var(--color-cat-understand);
	}
	.patch--operate {
		background: #0d2725;
		color: var(--color-cat-operate);
		border-color: var(--color-cat-operate);
	}
	.patch--share {
		background: #2f1a1c;
		color: var(--color-cat-share);
		border-color: var(--color-cat-share);
	}
	.patch--meta {
		background: #2a2410;
		color: var(--color-cat-meta);
		border-color: var(--color-cat-meta);
	}

	/* Rarity overrides */
	.patch--rare {
		border-width: var(--sk-rarity-rare-width);
		border-color: var(--sk-rarity-rare-border);
		box-shadow: var(--shadow-md), var(--sk-rarity-rare-glow);
	}
	.patch--epic {
		border-width: var(--sk-rarity-epic-width);
		border-color: var(--sk-rarity-epic-border);
		box-shadow: var(--shadow-md), var(--sk-rarity-epic-glow);
	}
	.patch--legendary {
		border-width: var(--sk-rarity-legendary-width);
		border-color: var(--sk-rarity-legendary-border);
		box-shadow: var(--shadow-md), var(--sk-rarity-legendary-glow);
	}

	.patch__top {
		font-size: 0.6875rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		opacity: 0.9;
	}
	.patch__key {
		margin: 2px 0;
		line-height: 0;
	}
	.patch__bot {
		font-size: 0.5625rem;
		font-weight: 500;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		opacity: 0.6;
	}
</style>
