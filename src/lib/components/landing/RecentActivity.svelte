<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { scrollReveal } from '$lib/utils/animations';
	import Button from '$components/ui/Button.svelte';

	const activity = [
		{ user: 'PixelMaestro', event: 'levelup', title: 'Artisan ★', domain: 'design', fragments: 847 },
		{ user: 'Kira_x42', event: 'levelup', title: 'Maître ★★', domain: 'code', fragments: 2103 },
		{ user: 'NeonCraft', event: 'levelup', title: 'Artisan ★', domain: 'game', fragments: 612 },
		{ user: '0xDead', event: 'streak', title: '45 jours', domain: 'security', fragments: 1890 },
		{ user: 'ByteQueen', event: 'levelup', title: 'Artisan ★', domain: 'code', fragments: 534 },
	];

	const domainDot: Record<string, string> = {
		code: 'bg-blue-500', design: 'bg-pink-500', game: 'bg-green-500', security: 'bg-red-500'
	};
	const domainText: Record<string, string> = {
		code: 'text-blue-400', design: 'text-pink-400', game: 'text-green-400', security: 'text-red-400'
	};
	const titleColor: Record<string, string> = {
		'Artisan ★': 'text-blue-400',
		'Maître ★★': 'text-purple-400',
		'Légende ★★★': 'text-amber-400'
	};
</script>

<section class="py-24 sm:py-32">
	<div class="mx-auto max-w-7xl px-4">
		<div use:scrollReveal class="flex items-end justify-between mb-12">
			<div>
				<h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3">
					{i18n.locale === 'fr' ? 'Ça bouge en ce moment' : 'Happening now'}
				</h2>
				<p class="text-text-muted text-lg">
					{i18n.locale === 'fr'
						? 'Progressions, streaks, nouveaux titres. La communauté avance.'
						: 'Progressions, streaks, new titles. The community moves forward.'}
				</p>
			</div>
			<Button variant="ghost" href="/leaderboards" class="hidden sm:inline-flex shrink-0">
				{i18n.locale === 'fr' ? 'Classements complets →' : 'Full leaderboards →'}
			</Button>
		</div>

		<div use:scrollReveal class="rounded-xl border border-border bg-surface-elevated overflow-hidden">
			{#each activity as item, idx}
				<div class="flex items-center gap-4 px-5 py-4 {idx < activity.length - 1 ? 'border-b border-border' : ''}">
					<!-- Avatar -->
					<div class="shrink-0 h-10 w-10 rounded-full bg-surface-overlay flex items-center justify-center font-bold text-sm {domainText[item.domain]}">
						{item.user[0]}
					</div>

					<!-- Info -->
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2 mb-0.5">
							<span class="text-sm font-semibold truncate">{item.user}</span>
							<div class="h-1.5 w-1.5 rounded-full {domainDot[item.domain]}"></div>
						</div>
						{#if item.event === 'levelup'}
							<p class="text-xs text-text-muted">
								{i18n.locale === 'fr' ? 'Vient de passer' : 'Just became'}
								<span class="font-semibold {titleColor[item.title] ?? 'text-text-primary'}">{item.title}</span>
							</p>
						{:else}
							<p class="text-xs text-text-muted">
								{i18n.locale === 'fr' ? 'Streak de' : 'Streak of'}
								<span class="font-semibold text-accent">{item.title}</span>
							</p>
						{/if}
					</div>

					<!-- Fragments -->
					<span class="shrink-0 text-xs text-text-muted font-mono">{item.fragments.toLocaleString()} ◆</span>
				</div>
			{/each}
		</div>

		<div class="mt-6 sm:hidden">
			<Button variant="ghost" href="/leaderboards" class="w-full">
				{i18n.locale === 'fr' ? 'Classements complets →' : 'Full leaderboards →'}
			</Button>
		</div>
	</div>
</section>
