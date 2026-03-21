<script lang="ts">
	interface Props {
		data: Record<string, unknown>;
	}

	let { data }: Props = $props();

	let json = $derived(JSON.stringify(data));
</script>

<svelte:head>
	{@html `<script type="application/ld+json">${json}</script>`}
</svelte:head>
