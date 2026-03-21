<script lang="ts">
	interface Props {
		current: number;
		max: number;
		label?: string;
		showPercent?: boolean;
		color?: 'primary' | 'accent' | 'success';
		animated?: boolean;
	}

	let {
		current,
		max,
		label,
		showPercent = true,
		color = 'primary',
		animated = true
	}: Props = $props();

	let percent = $derived(max > 0 ? Math.min(Math.round((current / max) * 100), 100) : 0);
	let isComplete = $derived(percent >= 100);

	const barColors: Record<string, string> = {
		primary: 'bg-primary',
		accent: 'bg-accent',
		success: 'bg-success'
	};
</script>

<div class="flex flex-col gap-1">
	{#if label || showPercent}
		<div class="flex items-center justify-between text-xs">
			{#if label}
				<span class="text-text-primary">{label}</span>
			{/if}
			{#if showPercent}
				<span class="text-text-muted">{current}/{max} ({percent}%)</span>
			{/if}
		</div>
	{/if}

	<div class="relative h-2 w-full overflow-hidden rounded-full bg-surface-overlay">
		<div
			class="h-full rounded-full {barColors[color]}
				{animated ? 'transition-all duration-500 ease-out' : ''}
				{isComplete ? 'animate-[pulse-glow_2s_ease-in-out_infinite]' : ''}"
			style="width: {percent}%"
		></div>

		{#if isComplete}
			<!-- Flash doré à 100% -->
			<div class="absolute inset-0 animate-[fade-in_300ms_ease-out] rounded-full bg-yellow-400/20"></div>
		{/if}
	</div>
</div>
