<script lang="ts">
	interface Props {
		data: Record<string, unknown>;
	}

	let { data }: Props = $props();

	// Escape `<` so a string containing `</script>` in `data` cannot break out
	// of the JSON-LD script element (the classic JSON-in-HTML injection).
	let json = $derived(JSON.stringify(data).replace(/</g, '\u003c'));
</script>

<svelte:head>
	{@html `<script type="application/ld+json">${json}</script>`}
</svelte:head>
