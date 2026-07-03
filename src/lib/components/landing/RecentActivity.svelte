<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { scrollReveal } from '$lib/utils/animations';
	import { domainStyle, titleColor } from '$lib/utils/domains';
	import Button from '$components/ui/Button.svelte';
	import type { SkillDomain, Title } from '$lib/types';

	interface ActivityItem {
		user: string;
		event: 'levelup' | 'streak';
		title: string;
		titleLevel?: Title;
		domain: SkillDomain;
		fragments: number;
	}

	const activity: ActivityItem[] = [
		{ user: 'PixelMaestro', event: 'levelup', title: 'Artisan ★', titleLevel: 'artisan', domain: 'design', fragments: 847 },
		{ user: 'Kira_x42', event: 'levelup', title: 'Maître ★★', titleLevel: 'maitre', domain: 'code', fragments: 2103 },
		{ user: 'NeonCraft', event: 'levelup', title: 'Artisan ★', titleLevel: 'artisan', domain: 'game', fragments: 612 },
		{ user: '0xDead', event: 'streak', title: '45 jours', domain: 'security', fragments: 1890 },
		{ user: 'ByteQueen', event: 'levelup', title: 'Artisan ★', titleLevel: 'artisan', domain: 'code', fragments: 534 },
	];
</script>

<section class="py-16 sm:py-24 lg:py-32">
	<div class="mx-auto max-w-7xl px-4">
		<div use:scrollReveal class="flex items-end justify-between mb-12">
			<div>
				<h2 class="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight mb-4">
					{i18n.locale === 'fr' ? 'Ça bouge' : 'Happening'}<br />
					<span class="text-accent">{i18n.locale === 'fr' ? 'en ce moment.' : 'now.'}</span>
				</h2>
				<p class="text-text-muted text-base sm:text-lg max-w-2xl">
					{i18n.locale === 'fr'
						? 'Progressions, streaks, nouveaux titres. La communauté avance.'
						: 'Progressions, streaks, new titles. The community moves forward.'}
				</p>
			</div>
			<Button variant="ghost" href="/leaderboards" class="hidden sm:inline-flex shrink-0">
				{i18n.locale === 'fr' ? 'Classements complets →' : 'Full leaderboards →'}
			</Button>
		</div>

		<div use:scrollReveal class="rounded-2xl border border-border bg-surface-elevated overflow-hidden">
			{#each activity as item, idx}
				{@const ds = domainStyle(item.domain)}
				<div class="flex items-center gap-4 px-5 py-4 {idx < activity.length - 1 ? 'border-b border-border' : ''}">
					<!-- Avatar -->
					<div class="shrink-0 h-10 w-10 rounded-full bg-surface-overlay flex items-center justify-center font-bold text-sm {ds.text}">
						{item.user[0]}
					</div>

					<!-- Info -->
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2 mb-0.5">
							<span class="text-sm font-semibold truncate">{item.user}</span>
							<div class="h-1.5 w-1.5 rounded-full {ds.dot}"></div>
						</div>
						{#if item.event === 'levelup'}
							<p class="text-xs text-text-muted">
								{i18n.locale === 'fr' ? 'Vient de passer' : 'Just became'}
								<span class="font-semibold {item.titleLevel ? titleColor(item.titleLevel) : 'text-text-primary'}">{item.title}</span>
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
