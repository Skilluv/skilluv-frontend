<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { scrollReveal } from '$lib/utils/animations';
	import Button from '$components/ui/Button.svelte';
</script>

<section class="py-24 sm:py-32">
	<div class="mx-auto max-w-7xl px-4">
		<div use:scrollReveal class="mb-16">
			<h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
				{i18n.locale === 'fr' ? 'Ton titre, tu le gagnes.' : 'Your title, you earn it.'}
			</h2>
			<p class="text-text-muted text-lg max-w-2xl">
				{i18n.locale === 'fr'
					? 'Pas de raccourci. Chaque fragment vient d\'un challenge réussi. Ton niveau est public, vérifié, indiscutable.'
					: 'No shortcuts. Every fragment comes from a completed challenge. Your level is public, verified, undeniable.'}
			</p>
		</div>

		<!-- Progression as a journey: 4 columns, each a "stage" -->
		<div use:scrollReveal class="rounded-xl border border-border bg-surface-elevated overflow-hidden">

			<!-- Header row -->
			<div class="grid grid-cols-4 border-b border-border">
				{#each [
					{ titleFr: 'Apprenti', titleEn: 'Apprentice', color: 'text-text-muted' },
					{ titleFr: 'Artisan', titleEn: 'Artisan', color: 'text-blue-400' },
					{ titleFr: 'Maître', titleEn: 'Master', color: 'text-purple-400' },
					{ titleFr: 'Légende', titleEn: 'Legend', color: 'text-amber-400' }
				] as level, idx}
					<div class="p-4 sm:p-5 text-center {idx < 3 ? 'border-r border-border' : ''}">
						<p class="text-lg sm:text-xl font-bold {level.color}">{i18n.locale === 'fr' ? level.titleFr : level.titleEn}</p>
					</div>
				{/each}
			</div>

			<!-- Stars row -->
			<div class="grid grid-cols-4 border-b border-border">
				{#each [
					{ stars: '--', color: 'text-text-muted/30' },
					{ stars: '★', color: 'text-blue-400' },
					{ stars: '★★', color: 'text-purple-400' },
					{ stars: '★★★', color: 'text-amber-400' }
				] as level, idx}
					<div class="p-3 sm:p-4 text-center {idx < 3 ? 'border-r border-border' : ''}">
						<span class="text-lg {level.color}">{level.stars}</span>
					</div>
				{/each}
			</div>

			<!-- Fragments threshold -->
			<div class="grid grid-cols-4 border-b border-border">
				{#each ['0', '500', '2 000', '5 000+'] as threshold, idx}
					<div class="p-3 sm:p-4 text-center {idx < 3 ? 'border-r border-border' : ''}">
						<p class="text-xs text-text-muted font-mono">{threshold} ◆</p>
					</div>
				{/each}
			</div>

			<!-- What you unlock at each level -->
			<div class="grid grid-cols-4">
				{#each [
					{ lines: [
						{ fr: 'Accès aux challenges', en: 'Access challenges' },
						{ fr: 'Profil public', en: 'Public profile' }
					]},
					{ lines: [
						{ fr: 'Challenges avancés', en: 'Advanced challenges' },
						{ fr: 'Classements', en: 'Leaderboards' },
						{ fr: 'Badge vérifié', en: 'Verified badge' }
					]},
					{ lines: [
						{ fr: 'Challenges expert', en: 'Expert challenges' },
						{ fr: 'Visible par les recruteurs', en: 'Visible to recruiters' },
						{ fr: 'Titre premium', en: 'Premium title' }
					]},
					{ lines: [
						{ fr: 'Tout débloqué', en: 'Everything unlocked' },
						{ fr: 'Statut élite', en: 'Elite status' },
						{ fr: 'Profil mis en avant', en: 'Featured profile' }
					]}
				] as level, idx}
					<div class="p-4 sm:p-5 {idx < 3 ? 'border-r border-border' : ''}">
						<ul class="space-y-2">
							{#each level.lines as line}
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

		<!-- Bottom: a simulated profile showing the journey -->
		<div use:scrollReveal class="mt-8 grid sm:grid-cols-2 gap-4">
			<!-- Before -->
			<div class="rounded-xl border border-border bg-surface-elevated p-5">
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
			<div class="rounded-xl border border-amber-500/30 bg-surface-elevated p-5">
				<p class="text-[10px] text-amber-400 uppercase tracking-wider mb-3">{i18n.locale === 'fr' ? '6 mois plus tard' : '6 months later'}</p>
				<div class="flex items-center gap-3 mb-3">
					<div class="h-9 w-9 rounded-full bg-amber-500/15 flex items-center justify-center text-xs font-bold text-amber-400">R</div>
					<div>
						<p class="text-sm font-semibold">RustLord</p>
						<p class="text-xs text-amber-400">{i18n.locale === 'fr' ? 'Légende' : 'Legend'} ★★★ · 4 821 ◆</p>
					</div>
				</div>
				<div class="flex gap-2">
					<span class="rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-400">Rust</span>
					<span class="rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-400">Go</span>
					<span class="rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-400">TypeScript</span>
					<span class="rounded-md bg-surface-overlay px-2 py-0.5 text-[10px] text-text-muted">142 challenges</span>
				</div>
			</div>
		</div>
	</div>
</section>
