<script lang="ts">
	import type { KeyType } from '../types';
	import { KEY_MEANINGS } from '../types';

	interface Props {
		type: KeyType;
		size?: number;
		color?: string;
		animated?: boolean;
		title?: string;
		ariaLabel?: string;
	}

	let {
		type,
		size = 48,
		color,
		animated = false,
		title,
		ariaLabel
	}: Props = $props();

	const meaning = $derived(KEY_MEANINGS[type]);
	const label = $derived(ariaLabel ?? `Clé ${meaning.label_fr}`);
</script>

<svg
	class:animate-sway={animated}
	width={size}
	height={size * 3}
	viewBox="0 0 100 300"
	style:color={color ?? 'currentColor'}
	role="img"
	aria-label={label}
>
	{#if title}
		<title>{title}</title>
	{/if}
	<use href="#key-{type}" />
</svg>
