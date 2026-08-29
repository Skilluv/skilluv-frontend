<script lang="ts">
	interface Props {
		data: Record<string, unknown>;
	}

	let { data }: Props = $props();

	/**
	 * The character that would close the element this JSON is embedded in.
	 *
	 * Held in a constant rather than written inline: a bare instance of it in a
	 * regex or a string inside a Svelte script block fails to parse, which is
	 * how the first version of this guard stopped the whole file compiling.
	 * Writing a closing script tag in a comment here does the same thing.
	 */
	const LT = '<';

	/**
	 * Escape every instance of it as its JSON escape sequence, so a string in
	 * `data` that closes the script element cannot break out of the JSON-LD
	 * block — the classic JSON-in-HTML injection.
	 *
	 * The replacement is the six characters that spell the sequence, not the
	 * character they denote: written as the character it replaces the thing
	 * with itself and does nothing at all, which is what the first version
	 * did. A JSON parser decodes the sequence back, so the payload is
	 * unchanged for whoever reads it and inert for the HTML parser that gets
	 * there first.
	 */
	let json = $derived(JSON.stringify(data).replaceAll(LT, '\\u003c'));
</script>

<svelte:head>
	<!-- The element is assembled from LT rather than written literally, for
	     the same reason the constant exists at all: a literal `<script>` inside
	     this template defeats parsers reading the file. svelte-check coped;
	     svelte-eslint-parser did not, and excluding the whole file to hide one
	     parse error would have hidden everything else in it too. -->
	{@html `${LT}script type="application/ld+json">${json}${LT}/script>`}
</svelte:head>
