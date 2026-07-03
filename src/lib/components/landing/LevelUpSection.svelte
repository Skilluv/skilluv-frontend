<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { scrollReveal } from '$lib/utils/animations';
	import { titleColor, domainStyle } from '$lib/utils/domains';
	import Button from '$components/ui/Button.svelte';
	import type { Title } from '$lib/types';

	const levels: { titleFr: string; titleEn: string; title: Title; stars: string; threshold: string }[] = [
		{ titleFr: 'Apprenti', titleEn: 'Apprentice', title: 'apprenti', stars: '--', threshold: '0' },
		{ titleFr: 'Artisan', titleEn: 'Artisan', title: 'artisan', stars: '★', threshold: '500' },
		{ titleFr: 'Maître', titleEn: 'Master', title: 'maitre', stars: '★★', threshold: '2 000' },
		{ titleFr: 'Légende', titleEn: 'Legend', title: 'legende', stars: '★★★', threshold: '5 000+' }
	];

	const codeStyle = domainStyle('code');

	const unlocks: { fr: string; en: string }[][] = [
		[
			{ fr: 'Accès aux challenges', en: 'Access challenges' },
			{ fr: 'Profil public', en: 'Public profile' }
		],
		[
			{ fr: 'Challenges avancés', en: 'Advanced challenges' },
			{ fr: 'Classements', en: 'Leaderboards' },
			{ fr: 'Badge vérifié', en: 'Verified badge' }
		],
		[
			{ fr: 'Challenges expert', en: 'Expert challenges' },
			{ fr: 'Visible par les recruteurs', en: 'Visible to recruiters' },
			{ fr: 'Titre premium', en: 'Premium title' }
		],
		[
			{ fr: 'Tout débloqué', en: 'Everything unlocked' },
			{ fr: 'Statut élite', en: 'Elite status' },
			{ fr: 'Profil mis en avant', en: 'Featured profile' }
		]
	];
</script>

<section class="py-16 sm:py-24 lg:py-32">
	<div class="mx-auto max-w-7xl px-4">
		<div use:scrollReveal class="mb-10 sm:mb-16">
			<h2 class="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight mb-5">
				{i18n.locale === 'fr' ? 'Ton titre,' : 'Your title,'}<br />
				<span class="text-accent">{i18n.locale === 'fr' ? 'tu le gagnes.' : 'you earn it.'}</span>
			</h2>
			<p class="text-text-muted text-base sm:text-lg max-w-2xl">
				{i18n.locale === 'fr'
					? 'Pas de raccourci. Chaque fragment vient d\'un challenge réussi. Ton niveau est public, vérifié, indiscutable.'
					: 'No shortcuts. Every fragment comes from a completed challenge. Your level is public, verified, undeniable.'}
			</p>
		</div>

		<!-- Progression as a journey: vertical stack on mobile, 4-column table on desktop -->
		<div use:scrollReveal class="rounded-2xl border border-border bg-surface-elevated overflow-hidden">

			<!-- Mobile: 1 card per level, stacked vertically -->
			<div class="flex flex-col divide-y divide-border sm:hidden">
				{#each levels as level, idx}
					<div class="p-5">
						<div class="mb-3 flex items-baseline justify-between">
							<p class="text-xl font-bold {titleColor(level.title)}">
								{i18n.locale === 'fr' ? level.titleFr : level.titleEn}
								<span class="ml-2 text-base">{idx === 0 ? '' : level.stars}</span>
							</p>
							<p class="text-xs font-mono text-text-muted">{level.threshold} ◆</p>
						</div>
						<ul class="space-y-1.5">
							{#each unlocks[idx] as line}
								<li class="flex items-start gap-2 text-xs text-text-muted">
									<span class="shrink-0 mt-0.5 text-accent">+</span>
									<span>{i18n.locale === 'fr' ? line.fr : line.en}</span>
								</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>

			<!-- Desktop: original 4-column table layout -->
			<div class="hidden sm:block">
				<!-- Header row -->
				<div class="grid grid-cols-4 border-b border-border">
					{#each levels as level, idx}
						<div class="p-5 text-center {idx < 3 ? 'border-r border-border' : ''}">
							<p class="text-lg sm:text-xl font-bold {titleColor(level.title)}">{i18n.locale === 'fr' ? level.titleFr : level.titleEn}</p>
						</div>
					{/each}
				</div>

				<!-- Stars row -->
				<div class="grid grid-cols-4 border-b border-border">
					{#each levels as level, idx}
						<div class="p-4 text-center {idx < 3 ? 'border-r border-border' : ''}">
							<span class="text-lg {idx === 0 ? 'text-text-muted/30' : titleColor(level.title)}">{level.stars}</span>
						</div>
					{/each}
				</div>

				<!-- Fragments threshold -->
				<div class="grid grid-cols-4 border-b border-border">
					{#each levels as level, idx}
						<div class="p-4 text-center {idx < 3 ? 'border-r border-border' : ''}">
							<p class="text-xs text-text-muted font-mono">{level.threshold} ◆</p>
						</div>
					{/each}
				</div>

				<!-- What you unlock at each level -->
				<div class="grid grid-cols-4">
					{#each unlocks as lines, idx}
						<div class="p-5 {idx < 3 ? 'border-r border-border' : ''}">
							<ul class="space-y-2">
								{#each lines as line}
									<li class="flex items-start gap-2 text-xs text-text-muted">
										<span class="shrink-0 mt-0.5 text-accent">+</span>
										<span>{i18n.locale === 'fr' ? line.fr : line.en}</span>
									</li>
								{/each}
							</ul>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Bottom: a simulated profile showing the journey -->
		<div use:scrollReveal class="mt-8 grid sm:grid-cols-2 gap-4">
			<!-- Before -->
			<div class="rounded-2xl border border-border bg-surface-elevated p-5">
				<p class="text-[10px] text-text-muted uppercase tracking-wider mb-3">{i18n.locale === 'fr' ? 'Jour 1' : 'Day 1'}</p>
				<div class="flex items-center gap-3 mb-3">
					<div class="h-9 w-9 rounded-full bg-surface-overlay flex items-center justify-center text-xs font-bold text-text-muted">?</div>
					<div>
						<p class="text-sm font-semibold text-text-muted">{i18n.locale === 'fr' ? 'Nouveau talent' : 'New talent'}</p>
						<p class="text-xs text-text-muted">Apprenti · 0 ◆</p>
					</div>
				</div>
				<div class="flex gap-2">
					<span class="rounded-md bg-surface-overlay px-2 py-0.5 text-[10px] text-text-muted/50">{i18n.locale === 'fr' ? 'Aucun badge' : 'No badges'}</span>
					<span class="rounded-md bg-surface-overlay px-2 py-0.5 text-[10px] text-text-muted/50">{i18n.locale === 'fr' ? 'Aucun challenge' : 'No challenges'}</span>
				</div>
			</div>

			<!-- After -->
			<div class="rounded-2xl border border-amber-500/30 bg-surface-elevated p-5">
				<p class="text-[10px] text-amber-400 uppercase tracking-wider mb-3">{i18n.locale === 'fr' ? '6 mois plus tard' : '6 months later'}</p>
				<div class="flex items-center gap-3 mb-3">
					<div class="h-9 w-9 rounded-full bg-amber-500/15 flex items-center justify-center text-xs font-bold text-amber-400">R</div>
					<div>
						<p class="text-sm font-semibold">RustLord</p>
						<p class="text-xs text-amber-400">{i18n.locale === 'fr' ? 'Légende' : 'Legend'} ★★★ · 4 821 ◆</p>
					</div>
				</div>
				<div class="flex gap-2">
					{#each ['Rust', 'Go', 'TypeScript'] as skill}
						<span class="rounded-md {codeStyle.bgSoft} px-2 py-0.5 text-[10px] font-medium {codeStyle.text}">{skill}</span>
					{/each}
					<span class="rounded-md bg-surface-overlay px-2 py-0.5 text-[10px] text-text-muted">142 challenges</span>
				</div>
			</div>
		</div>
	</div>
</section>
