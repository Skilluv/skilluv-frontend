<script lang="ts">
	import type { BadgeSize, KeyType } from './types';
	import Key from './primitives/Key.svelte';

	interface Props {
		guildName: string;
		keys: KeyType[];
		color: string;
		size?: BadgeSize;
		memberCount?: number;
	}

	let { guildName, keys, color, size = 'md', memberCount }: Props = $props();

	const dim = $derived(size === 'sm' ? 80 : size === 'md' ? 140 : size === 'lg' ? 200 : 280);
	const keySize = $derived(dim / 7);
</script>

<div class="crest crest--{size}" style:--crest-color={color} style:width="{dim}px">
	<div class="crest__shield" style:aspect-ratio="3/4">
		<div class="crest__inner">
			<div class="crest__name">{guildName}</div>
			<div class="crest__keys">
				{#each keys.slice(0, 3) as k, i (i)}
					<Key type={k} size={keySize} color="rgba(244, 237, 224, 0.9)" />
				{/each}
			</div>
			{#if memberCount != null}
				<div class="crest__members">{memberCount} membre{memberCount > 1 ? 's' : ''}</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.crest {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
	}
	.crest__shield {
		width: 100%;
		background: var(--crest-color);
		clip-path: polygon(0 0, 100% 0, 100% 60%, 50% 100%, 0 60%);
		border: 3px solid rgba(28, 26, 23, 0.6);
		box-shadow: var(--shadow-md);
		display: grid;
		place-items: center;
		padding: 12%;
	}
	.crest__inner {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		text-align: center;
		color: rgba(244, 237, 224, 0.95);
		font-family: var(--font-sans);
	}
	.crest__name {
		font-family: var(--font-display);
		font-weight: 700;
		font-variation-settings: 'opsz' 24, 'SOFT' 30, 'WONK' 0.4;
		font-size: 0.9375rem;
		letter-spacing: 0.02em;
		line-height: 1.1;
	}
	.crest__keys {
		display: flex;
		gap: 4px;
		align-items: flex-start;
	}
	.crest__members {
		font-size: 0.625rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		opacity: 0.75;
	}
</style>
