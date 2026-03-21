<script lang="ts">
	interface Props {
		count: number;
		danger?: boolean;
	}

	let { count, danger = false }: Props = $props();

	let sizeClass = $derived(
		count >= 100 ? 'text-4xl' : count >= 30 ? 'text-3xl' : count >= 7 ? 'text-2xl' : 'text-xl'
	);
</script>

<div class="flex items-center gap-2" title="{count} jours de streak">
	<!-- Flamme CSS animée -->
	<div
		class="relative flex items-center justify-center {sizeClass}
			{danger ? 'animate-pulse' : count > 0 ? 'animate-[pulse-glow_2s_ease-in-out_infinite]' : ''}"
	>
		{#if count > 0}
			<span class="drop-shadow-[0_0_8px_rgba(234,88,12,0.5)]
				{danger ? 'text-warning' : 'text-accent'}">
				🔥
			</span>
		{:else}
			<span class="text-text-muted opacity-40">🔥</span>
		{/if}
	</div>

	<div class="flex flex-col">
		<span class="text-lg font-bold leading-none {danger ? 'text-warning' : count > 0 ? 'text-text-primary' : 'text-text-muted'}">
			{count}
		</span>
		<span class="text-[10px] text-text-muted leading-none">
			{count === 1 ? 'jour' : 'jours'}
		</span>
	</div>
</div>
