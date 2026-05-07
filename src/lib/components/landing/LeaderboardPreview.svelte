<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { scrollReveal } from '$lib/utils/animations';
	import Button from '$components/ui/Button.svelte';

	const leaderboard = [
		{ rank: 1, name: 'RustLord', domain: 'code', title: 'Maître ★★', score: 4821 },
		{ rank: 2, name: 'Kira_x42', domain: 'code', title: 'Maître ★★', score: 3204 },
		{ rank: 3, name: 'GhostShell', domain: 'security', title: 'Artisan ★', score: 2917 },
		{ rank: 4, name: 'PixelMaestro', domain: 'design', title: 'Artisan ★', score: 2340 },
		{ rank: 5, name: 'NeonCraft', domain: 'game', title: 'Artisan ★', score: 1987 },
	];

	const domainDot: Record<string, string> = {
		code: 'bg-blue-500', design: 'bg-pink-500', game: 'bg-green-500', security: 'bg-red-500'
	};
	const domainText: Record<string, string> = {
		code: 'text-blue-400', design: 'text-pink-400', game: 'text-green-400', security: 'text-red-400'
	};
	const rankColor: Record<number, string> = {
		1: 'text-amber-400',
		2: 'text-text-muted',
		3: 'text-text-muted'
	};
</script>

<section class="py-24 sm:py-32">
	<div class="mx-auto max-w-7xl px-4">
		<div use:scrollReveal class="flex items-end justify-between mb-12">
			<div>
				<h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3">
					{i18n.locale === 'fr' ? 'Qui domine cette semaine ?' : 'Who\'s on top this week?'}
				</h2>
				<p class="text-text-muted text-lg">
					{i18n.locale === 'fr'
						? 'Le classement global, mis à jour en temps réel.'
						: 'The global leaderboard, updated in real time.'}
				</p>
			</div>
			<Button variant="ghost" href="/leaderboards" class="hidden sm:inline-flex shrink-0">
				{i18n.locale === 'fr' ? 'Classement complet →' : 'Full leaderboard →'}
			</Button>
		</div>

		<div use:scrollReveal class="rounded-xl border border-border bg-surface-elevated overflow-hidden">
			<!-- Header -->
			<div class="grid grid-cols-[3rem_1fr_auto_6rem] gap-4 items-center px-5 py-3 border-b border-border text-xs text-text-muted font-medium">
				<span>#</span>
				<span>{i18n.locale === 'fr' ? 'Talent' : 'Talent'}</span>
				<span class="hidden sm:block">{i18n.locale === 'fr' ? 'Titre' : 'Title'}</span>
				<span class="text-right">Score</span>
			</div>

			{#each leaderboard as entry, idx}
				<div class="grid grid-cols-[3rem_1fr_auto_6rem] gap-4 items-center px-5 py-4 {idx < leaderboard.length - 1 ? 'border-b border-border' : ''}">
					<!-- Rank -->
					<span class="text-lg font-bold {rankColor[entry.rank] ?? 'text-text-muted'}">
						{entry.rank}
					</span>

					<!-- User -->
					<div class="flex items-center gap-3 min-w-0">
						<div class="shrink-0 h-9 w-9 rounded-full bg-surface-overlay flex items-center justify-center font-bold text-sm {domainText[entry.domain]}">
							{entry.name[0]}
						</div>
						<div class="min-w-0">
							<p class="text-sm font-semibold truncate">{entry.name}</p>
							<div class="flex items-center gap-1.5">
								<div class="h-1.5 w-1.5 rounded-full {domainDot[entry.domain]}"></div>
								<span class="text-[11px] text-text-muted capitalize">{entry.domain}</span>
							</div>
						</div>
					</div>

					<!-- Title -->
					<span class="hidden sm:block text-xs text-text-muted">{entry.title}</span>

					<!-- Score -->
					<span class="text-sm font-mono font-semibold text-right">{entry.score.toLocaleString()} ◆</span>
				</div>
			{/each}
		</div>

		<div class="mt-6 sm:hidden">
			<Button variant="ghost" href="/leaderboards" class="w-full">
				{i18n.locale === 'fr' ? 'Classement complet →' : 'Full leaderboard →'}
			</Button>
		</div>
	</div>
</section>
