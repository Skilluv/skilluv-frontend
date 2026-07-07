<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { scrollReveal, countUp } from '$lib/utils/animations';
	import { domainStyle } from '$lib/utils/domains';
	import type { SkillDomain } from '$lib/types';

	const allDomains: SkillDomain[] = ['code', 'design', 'game', 'security'];
</script>

<section class="py-16 sm:py-24 lg:py-32">
	<div class="mx-auto max-w-7xl px-4">
		<div use:scrollReveal class="mb-10 sm:mb-16">
			<h2 class="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight mb-5">
				{i18n.locale === 'fr' ? 'Skilluv' : 'Skilluv'}<br />
				<span class="text-accent">{i18n.locale === 'fr' ? 'en chiffres.' : 'in numbers.'}</span>
			</h2>
			<p class="text-text-muted text-base sm:text-lg max-w-xl">
				{i18n.locale === 'fr'
					? 'Tout ce qu\'il faut pour prouver ce que tu vaux. Rien de plus.'
					: 'Everything you need to prove your worth. Nothing more.'}
			</p>
		</div>

		<div class="grid sm:grid-cols-2 lg:grid-cols-4 rounded-2xl overflow-hidden border border-border">
			<!-- Domaines -->
			<div use:scrollReveal class="bg-surface-elevated p-8 flex flex-col min-h-[280px]">
				<div class="flex items-center gap-3">
					{#each allDomains as d}
						<div class="h-3 w-3 rounded-sm {domainStyle(d).dot}"></div>
					{/each}
				</div>
				<div class="mt-auto">
					<p use:countUp={{ target: 4, duration: 1.5 }} class="text-5xl sm:text-7xl lg:text-8xl font-black text-text-primary tracking-tight mb-2">4</p>
					<p class="text-sm font-semibold mb-1">{i18n.locale === 'fr' ? 'Domaines' : 'Domains'}</p>
					<p class="text-xs text-text-muted">Code, Design, Game, Security</p>
				</div>
			</div>

			<!-- Langages -->
			<div use:scrollReveal={{ delay: 0.1 }} class="bg-surface-elevated p-8 flex flex-col min-h-[280px] border-t border-border sm:border-t-0 sm:border-l">
				<div class="font-mono text-xs text-text-muted leading-relaxed">
					<p>.rs .ts .py .go</p>
					<p>.cpp .css .gdscript</p>
					<p>.cs .figma .svg ...</p>
				</div>
				<div class="mt-auto">
					<div class="flex items-baseline gap-1">
						<p use:countUp={{ target: 20, duration: 2 }} class="text-5xl sm:text-7xl lg:text-8xl font-black text-text-primary tracking-tight">20</p>
						<span class="text-4xl lg:text-5xl font-black text-accent">+</span>
					</div>
					<p class="text-sm font-semibold mb-1 mt-3">{i18n.locale === 'fr' ? 'Langages & outils' : 'Languages & tools'}</p>
					<p class="text-xs text-text-muted">{i18n.locale === 'fr' ? 'De Rust à Figma' : 'From Rust to Figma'}</p>
				</div>
			</div>

			<!-- Niveaux -->
			<div use:scrollReveal={{ delay: 0.2 }} class="bg-surface-elevated p-8 flex flex-col min-h-[280px] border-t border-border lg:border-t-0 lg:border-l">
				<div class="flex items-end gap-1.5 h-10">
					<div class="w-3 h-2 rounded-sm bg-text-muted/30"></div>
					<div class="w-3 h-3 rounded-sm bg-text-muted/40"></div>
					<div class="w-3 h-5 rounded-sm bg-text-muted/50"></div>
					<div class="w-3 h-7 rounded-sm bg-accent/60"></div>
					<div class="w-3 h-10 rounded-sm bg-accent"></div>
				</div>
				<div class="mt-auto">
					<p use:countUp={{ target: 5, duration: 1.5 }} class="text-5xl sm:text-7xl lg:text-8xl font-black text-text-primary tracking-tight mb-2">5</p>
					<p class="text-sm font-semibold mb-1">{i18n.locale === 'fr' ? 'Niveaux' : 'Levels'}</p>
					<p class="text-xs text-text-muted">{i18n.locale === 'fr' ? 'Débutant à Expert' : 'Beginner to Expert'}</p>
				</div>
			</div>

			<!-- Gratuit -->
			<div use:scrollReveal={{ delay: 0.3 }} class="bg-surface-elevated p-8 flex flex-col min-h-[280px] border-t border-border sm:border-l lg:border-t-0">
				<div class="text-xs text-text-muted space-y-1">
					<p class="line-through decoration-error/50">paywall</p>
					<p class="line-through decoration-error/50">freemium</p>
					<p class="line-through decoration-error/50">premium</p>
					<p class="text-success font-semibold no-underline">{i18n.locale === 'fr' ? 'gratuit. point.' : 'free. period.'}</p>
				</div>
				<div class="mt-auto">
					<div class="flex items-baseline gap-1">
						<p use:countUp={{ target: 100, duration: 2.5 }} class="text-5xl sm:text-7xl lg:text-8xl font-black text-text-primary tracking-tight">100</p>
						<span class="text-4xl lg:text-5xl font-black text-accent">%</span>
					</div>
					<p class="text-sm font-semibold mb-1 mt-2">{i18n.locale === 'fr' ? 'Gratuit' : 'Free'}</p>
					<p class="text-xs text-text-muted">{i18n.locale === 'fr' ? 'Aucun paywall' : 'No paywall'}</p>
				</div>
			</div>
		</div>
	</div>
</section>
