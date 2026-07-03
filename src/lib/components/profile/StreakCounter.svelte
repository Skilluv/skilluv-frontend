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
			<svg
				class="h-5 w-5 drop-shadow-[0_0_8px_rgba(234,88,12,0.5)] {danger ? 'text-warning' : 'text-accent'}"
				viewBox="0 0 24 24"
				fill="currentColor"
				aria-hidden="true"
			>
				<path d="M12 2c1.5 3 5 5 5 9a5 5 0 11-10 0c0-1.8.8-3 2-4 0 1.5 1 2.5 2 2.5-1-2-1-4 1-7.5z" />
			</svg>
		{:else}
			<svg class="h-5 w-5 text-text-muted opacity-40" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
				<path d="M12 2c1.5 3 5 5 5 9a5 5 0 11-10 0c0-1.8.8-3 2-4 0 1.5 1 2.5 2 2.5-1-2-1-4 1-7.5z" />
			</svg>
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
