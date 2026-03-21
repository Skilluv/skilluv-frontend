<script lang="ts">
	import type { HeatmapEntry } from '$types';

	interface Props {
		data: HeatmapEntry[];
		compact?: boolean;
	}

	let { data, compact = false }: Props = $props();

	// Construire la grille 52×7 (12 derniers mois)
	function buildGrid(): { date: string; level: number; count: number }[][] {
		const map = new Map<string, HeatmapEntry>();
		for (const entry of data) {
			map.set(entry.activity_date, entry);
		}

		const weeks: { date: string; level: number; count: number }[][] = [];
		const today = new Date();
		const start = new Date(today);
		start.setDate(start.getDate() - (compact ? 90 : 364));

		// Aligner au dimanche
		start.setDate(start.getDate() - start.getDay());

		let current = new Date(start);
		let week: { date: string; level: number; count: number }[] = [];

		while (current <= today) {
			const dateStr = current.toISOString().split('T')[0];
			const entry = map.get(dateStr);
			const count = entry?.challenges_completed ?? 0;

			let level = 0;
			if (count >= 5) level = 4;
			else if (count >= 3) level = 3;
			else if (count >= 2) level = 2;
			else if (count >= 1) level = 1;

			week.push({ date: dateStr, level, count });

			if (week.length === 7) {
				weeks.push(week);
				week = [];
			}

			current.setDate(current.getDate() + 1);
		}

		if (week.length > 0) weeks.push(week);
		return weeks;
	}

	let grid = $derived(buildGrid());

	const levelColors = [
		'bg-surface-overlay',
		'bg-primary/30',
		'bg-primary/50',
		'bg-primary/70',
		'bg-primary'
	];
</script>

<div class="overflow-x-auto">
	<div class="inline-flex gap-[3px]">
		{#each grid as week}
			<div class="flex flex-col gap-[3px]">
				{#each week as day}
					<div
						class="h-3 w-3 rounded-sm {levelColors[day.level]} transition-colors"
						title="{day.date}: {day.count} challenge{day.count !== 1 ? 's' : ''}"
					></div>
				{/each}
			</div>
		{/each}
	</div>
</div>
