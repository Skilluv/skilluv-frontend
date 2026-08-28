<script lang="ts">
	interface Props {
		data: Record<string, unknown>;
	}

	let { data }: Props = $props();

	// Escape `<` so a `</script>` inside `data` cannot break out of the JSON-LD
	// script element (the classic JSON-in-HTML injection). The regex matches `<`
	// via its unicode escape so no literal `<` sits in the script block (a literal
	// one trips the Svelte parser); the replacement emits the real six-char JSON
	// escape `\\u003c`, not the character (which would be a silent no-op).
	let json = $derived(JSON.stringify(data).replace(/\u003c/g, '\\u003c'));
</script>

<svelte:head>
	{@html `<script type="application/ld+json">${json}</script>`}
</svelte:head>
