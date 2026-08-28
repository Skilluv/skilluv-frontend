<script lang="ts">
	interface Props {
		data: Record<string, unknown>;
	}

	let { data }: Props = $props();

	// Escape the less-than character so a closing
	// script tag embedded in `data` cannot break out of the JSON-LD script element
	// (the classic JSON-in-HTML injection). Keeping any literal less-than out of
	// this block also avoids tripping the Svelte parser; the replacement emits the
	// six-character JSON escape, not the character itself (which is a silent no-op).
	let json = $derived(JSON.stringify(data).replace(/\u003c/g, '\\u003c'));
</script>

<svelte:head>
	{@html `<script type="application/ld+json">${json}</script>`}
</svelte:head>
