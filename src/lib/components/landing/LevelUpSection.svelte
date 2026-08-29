<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { scrollReveal } from '$lib/utils/animations';
	import { rankColor, domainStyle } from '$lib/utils/domains';
	import type { Rank } from '$lib/types';

	// The canonical ladder is Rank (5 tiers, Apprenti -> Doyen). This listed 4
	// tiers from the deprecated Title type, including a "legende" that Rank does
	// not have, with fragment thresholds nobody had set.
	const ranks: { key: Rank; meaning: string }[] = $derived([
		{ key: 'apprenti', meaning: i18n.t('ranks.apprentiMeaning') },
		{ key: 'ranger', meaning: i18n.t('ranks.rangerMeaning') },
		{ key: 'artisan', meaning: i18n.t('ranks.artisanMeaning') },
		{ key: 'maitre', meaning: i18n.t('ranks.maitreMeaning') },
		{ key: 'doyen', meaning: i18n.t('ranks.doyenMeaning') }
	]);

	const codeStyle = domainStyle('code');

</script>

<section class="py-16 sm:py-24 lg:py-32">
	<div class="mx-auto max-w-7xl px-4">
		<div use:scrollReveal class="mb-10 sm:mb-16">
			<h2 class="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight mb-5">
				{i18n.t('ranks.title')}<br />
				<span class="text-accent">{i18n.t('ranks.titleAccent')}</span>
			</h2>
			<p class="text-text-muted text-base sm:text-lg max-w-2xl">
				{i18n.t('ranks.subtitle')}
			</p>
		</div>

		<!-- The ladder: what each rank means, not what it unlocks. -->
		<div
			use:scrollReveal
			data-testid="rank-ladder"
			class="overflow-hidden rounded-2xl border-2 border-cat-meta bg-surface-meta"
		>
			<ul class="divide-y divide-border">
				{#each ranks as r, idx (r.key)}
					<li class="flex flex-col gap-1 p-5 sm:flex-row sm:items-baseline sm:gap-6">
						<span class="w-8 shrink-0 font-mono text-xs text-text-muted">0{idx + 1}</span>
						<span class="w-40 shrink-0 text-lg font-bold {rankColor(r.key)}">
							{i18n.t(`common.titles.${r.key}`)}
						</span>
						<span class="text-sm text-text-muted">{r.meaning}</span>
					</li>
				{/each}
			</ul>
		</div>

		<p use:scrollReveal class="mt-6 max-w-3xl text-sm text-text-muted">
			{i18n.t('ranks.note')}
		</p>

		<!-- Bottom: a simulated profile showing the journey -->
		<div use:scrollReveal class="mt-8 grid sm:grid-cols-2 gap-4">
			<!-- Before -->
			<div class="rounded-2xl border-2 border-border bg-surface-alt p-5">
				<p class="text-[10px] text-text-muted uppercase tracking-wider mb-3">{i18n.locale === 'fr' ? 'Jour 1' : 'Day 1'}</p>
				<div class="flex items-center gap-3 mb-3">
					<div class="h-9 w-9 rounded-full bg-surface-overlay flex items-center justify-center text-xs font-bold text-text-muted">?</div>
					<div>
						<p class="text-sm font-semibold text-text-muted">{i18n.locale === 'fr' ? 'Nouveau talent' : 'New talent'}</p>
						<p class="text-xs text-text-muted">{i18n.t('common.titles.apprenti')}</p>
					</div>
				</div>
				<div class="flex gap-2">
					<span class="rounded-md bg-surface-overlay px-2 py-0.5 text-[10px] text-text-muted/50">{i18n.locale === 'fr' ? 'Aucun badge' : 'No badges'}</span>
					<span class="rounded-md bg-surface-overlay px-2 py-0.5 text-[10px] text-text-muted/50">{i18n.locale === 'fr' ? 'Aucun challenge' : 'No challenges'}</span>
				</div>
			</div>

			<!-- After -->
			<div class="rounded-2xl border-2 border-cat-craft bg-surface-craft p-5">
				<p class="text-[10px] text-amber-400 uppercase tracking-wider mb-1">{i18n.locale === 'fr' ? '6 mois plus tard' : '6 months later'}</p>
				<p class="mb-3 text-[10px] uppercase tracking-widest text-text-muted">{i18n.t('commonExtra.exampleLabel')}</p>
				<div class="flex items-center gap-3 mb-3">
					<div class="h-9 w-9 rounded-full bg-amber-500/15 flex items-center justify-center text-xs font-bold text-amber-400">A</div>
					<div>
						<p class="text-sm font-semibold">A. Diallo</p>
						<p class="text-xs text-amber-400">{i18n.t('common.titles.doyen')}</p>
					</div>
				</div>
				<div class="flex gap-2">
					{#each ['Rust', 'Go', 'TypeScript'] as skill (skill)}
						<span class="rounded-md {codeStyle.bgSoft} px-2 py-0.5 text-[10px] font-medium {codeStyle.text}">{skill}</span>
					{/each}
				</div>
			</div>
		</div>
	</div>
</section>
