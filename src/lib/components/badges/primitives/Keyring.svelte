<script lang="ts">
	import type { KeyType } from '../types';
	import { KEY_MEANINGS } from '../types';

	interface Props {
		keys?: KeyType[];
		size?: number;
		interactive?: boolean;
		animated?: boolean;
		onKeyClick?: (key: KeyType) => void;
		emptyMessage?: string;
	}

	let {
		keys = [],
		size = 200,
		interactive = false,
		animated = true,
		onKeyClick,
		emptyMessage = 'Ton trousseau attend.'
	}: Props = $props();

	// Distribution en éventail — les clés s'étalent depuis l'anneau
	function keyTransform(i: number, total: number) {
		if (total === 0) return '';
		const center = (total - 1) / 2;
		const offset = i - center;
		const spread = Math.min(20, 60 / Math.max(1, total - 1));
		const x = 100 + offset * spread;
		const y = 80 + Math.abs(offset) * 3;
		const rotate = offset * 6;
		return `translate(${x - 50}, ${y}) rotate(${rotate} 50 150)`;
	}
</script>

<div class="keyring-wrap" style:width="{size}px" style:height="{Math.round(size * 1.4)}px">
	<svg
		class:animate-sway={animated && keys.length > 0}
		viewBox="0 0 200 280"
		role="img"
		aria-label="Trousseau de {keys.length} clé{keys.length > 1 ? 's' : ''}"
	>
		<!-- L'anneau -->
		<g fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round">
			<circle cx="100" cy="40" r="30" />
			<circle cx="100" cy="40" r="22" stroke-width="1.5" opacity="0.5" />
		</g>

		<!-- Les clés -->
		{#each keys as key, i (i)}
			{@const meaning = KEY_MEANINGS[key]}
			<g class="keyring-key" class:keyring-key--interactive={interactive} transform={keyTransform(i, keys.length)}>
				<title>{meaning.label_fr} — {meaning.fr}</title>
				{#if interactive && onKeyClick}
					<foreignObject x="0" y="0" width="80" height="240">
						<button
							type="button"
							class="keyring-key-btn"
							onclick={() => onKeyClick?.(key)}
							aria-label={meaning.label_fr}
						>
							<svg viewBox="0 0 100 300" style:color="currentColor" aria-hidden="true">
								<use href="#key-{key}" />
							</svg>
						</button>
					</foreignObject>
				{:else}
					<svg x="0" y="0" width="80" height="240" viewBox="0 0 100 300" style:color="currentColor">
						<use href="#key-{key}" />
					</svg>
				{/if}
			</g>
		{/each}

		<!-- Empty state -->
		{#if keys.length === 0}
			<text
				x="100"
				y="180"
				text-anchor="middle"
				fill="currentColor"
				opacity="0.4"
				font-family="var(--font-display)"
				font-size="12"
			>
				{emptyMessage}
			</text>
		{/if}
	</svg>
</div>

<style>
	.keyring-wrap {
		display: grid;
		place-items: center;
	}
	.keyring-key {
		transition: transform 160ms cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	.keyring-key-btn {
		width: 100%;
		height: 100%;
		background: transparent;
		border: 0;
		padding: 0;
		cursor: pointer;
		color: inherit;
	}
	.keyring-key-btn:hover svg {
		filter: brightness(1.2);
	}
	.keyring-key-btn:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
		border-radius: 4px;
	}
</style>
