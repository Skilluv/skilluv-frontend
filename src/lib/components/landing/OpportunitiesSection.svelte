<script lang="ts">
	import { resolve } from '$app/paths';
	import { i18n } from '$lib/i18n';
	import { scrollReveal } from '$lib/utils/animations';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';

	// Every figure this section used to display was invented: an active-bounty
	// count, a weekly payout, a diploma tally, a mentor count, a match rate.
	// The three products are real; the numbers were not, so they are gone and
	// the terms of each deal are shown instead. Those are true today.

</script>

<section class="py-16 sm:py-24 lg:py-32">
	<div class="mx-auto max-w-7xl px-4">
		<!-- Header aligned with landing pattern -->
		<div use:scrollReveal class="mb-10 sm:mb-16">
			<h2 class="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight mb-5">
				{i18n.locale === 'fr' ? 'Trois manières' : 'Three ways'}<span class="text-accent">.</span><br />
				<span class="text-accent">{i18n.locale === 'fr' ? 'De te faire remarquer.' : 'To get noticed.'}</span>
			</h2>
			<p class="text-text-muted text-base sm:text-lg max-w-2xl">
				{i18n.locale === 'fr'
					? "Les challenges ne suffisent pas ? Chasse des bounties, décroche un diplôme vérifiable, réserve un mentor."
					: 'Challenges not enough? Hunt bounties, earn a verifiable diploma, book a mentor.'}
			</p>
		</div>

		<div class="grid gap-4 lg:grid-cols-3">

			<!-- ═══ CARD 01 — BOUNTIES ═══ -->
			<a
				href={resolve('/bounties')}
				use:scrollReveal
				class="group rounded-2xl border-2 border-cat-craft bg-surface-craft overflow-hidden transition-colors duration-200 hover:border-primary/40 flex flex-col"
			>
				<!-- Header bar : dot + label + right meta -->
				<div class="flex items-center gap-3 border-b border-border px-5 py-3">
					<div class="h-2.5 w-2.5 rounded-sm bg-primary"></div>
					<span class="text-sm font-semibold text-primary">
						{i18n.locale === 'fr' ? 'Bounties OSS' : 'OSS Bounties'}
					</span>
				</div>

				<div class="p-5 flex-1 flex flex-col">
					<!-- Ticker (voix "hunt") -->

					<h3 class="text-2xl font-black tracking-tight mb-2 group-hover:text-accent transition-colors duration-200">
						{i18n.locale === 'fr' ? 'Chasse. Merge. Empoche.' : 'Hunt. Merge. Cash.'}
					</h3>
					<p class="text-sm text-text-muted leading-relaxed">
						{i18n.locale === 'fr'
							? 'Les entreprises paient pour la résolution de leurs issues GitHub. PR merge = fragments.'
							: 'Companies pay for their GitHub issues to be solved. PR merges = fragments.'}
					</p>

					<!-- Metric bottom (comme DomainsSection : pulse + N°) -->
					<div class="mt-auto pt-5 flex items-center gap-1.5 text-xs text-text-muted">
						<span class="h-1.5 w-1.5 rounded-full bg-success"></span>
						<span>{i18n.locale === 'fr'
							? 'L’entreprise finance, le talent encaisse, Skilluv prend une commission modérée.'
							: 'The company funds it, the talent receives it, Skilluv takes a moderate commission.'}</span>
					</div>
				</div>
			</a>

			<!-- ═══ CARD 02 — CERTIFICATIONS ═══ -->
			<a
				href={resolve('/certifications')}
				use:scrollReveal
				class="group rounded-2xl border-2 border-cat-meta bg-surface-meta overflow-hidden transition-colors duration-200 hover:border-accent/40 flex flex-col"
			>
				<div class="flex items-center gap-3 border-b border-border px-5 py-3">
					<div class="h-2.5 w-2.5 rounded-sm bg-accent"></div>
					<span class="text-sm font-semibold text-accent">
						Certifications
					</span>
					<span class="ml-auto">
						<Badge variant="accent" size="sm">{i18n.locale === 'fr' ? 'Nouveau' : 'New'}</Badge>
					</span>
				</div>

				<div class="p-5 flex-1 flex flex-col">
					<!-- Sample cert code (voix "officiel") -->
					<div class="mb-5 rounded-md bg-surface-overlay px-3 py-2">
						<p class="text-[10px] uppercase tracking-widest text-text-muted mb-1">
							{i18n.locale === 'fr' ? 'Code vérifiable' : 'Verifiable code'}
						</p>
						<p class="font-mono text-sm font-bold text-accent">#SKV-2027-XXXX</p>
						<p class="mt-1 text-[10px] uppercase tracking-widest text-text-muted">{i18n.t('commonExtra.exampleLabel')}</p>
					</div>

					<h3 class="text-2xl font-black tracking-tight mb-2 group-hover:text-accent transition-colors duration-200">
						{i18n.locale === 'fr' ? 'Diplôme signé.' : 'Signed diploma.'}<br />
						<span class="text-accent">{i18n.locale === 'fr' ? 'Vérifiable.' : 'Verifiable.'}</span>
					</h3>
					<p class="text-sm text-text-muted leading-relaxed">
						{i18n.locale === 'fr'
							? 'Séries chronométrées. Diplôme opposable au recruteur, code publiquement vérifiable. Zéro tricherie.'
							: 'Timed series. Recruiter-proof diploma with publicly verifiable code. Zero cheating.'}
					</p>

					<div class="mt-auto pt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
						<span>{i18n.locale === 'fr'
							? 'Chaque diplôme porte un code que n’importe qui peut vérifier en ligne.'
							: 'Every diploma carries a code anyone can verify online.'}</span>
					</div>
				</div>
			</a>

			<!-- ═══ CARD 03 — MENTORSHIP ═══ -->
			<a
				href={resolve('/mentors')}
				use:scrollReveal
				class="group rounded-2xl border-2 border-cat-share bg-surface-share overflow-hidden transition-colors duration-200 hover:border-primary/40 flex flex-col"
			>
				<div class="flex items-center gap-3 border-b border-border px-5 py-3">
					<div class="h-2.5 w-2.5 rounded-sm bg-primary"></div>
					<span class="text-sm font-semibold text-primary">
						Mentorship
					</span>
					<span class="ml-auto">
						
					</span>
				</div>

				<div class="p-5 flex-1 flex flex-col">
					<!-- Duo avatars (voix "humain") -->
					<div class="mb-5 flex items-center gap-3">
						<div class="h-10 w-10 rounded-full bg-surface-overlay flex items-center justify-center text-sm font-bold text-primary">M</div>
						<div class="flex-1 flex items-center justify-center text-accent">
							<span class="font-mono text-lg">↔</span>
						</div>
						<div class="h-10 w-10 rounded-full bg-surface-overlay flex items-center justify-center text-sm font-bold text-accent">?</div>
					</div>

					<h3 class="text-2xl font-black tracking-tight mb-2 group-hover:text-primary transition-colors duration-200">
						{i18n.locale === 'fr' ? 'Un mentor.' : 'A mentor.'}<br />
						<span class="text-accent">{i18n.locale === 'fr' ? 'Une trajectoire.' : 'A trajectory.'}</span>
					</h3>
					<p class="text-sm text-text-muted leading-relaxed mb-4">
						{i18n.locale === 'fr'
							? 'Session 1-on-1 : code review, prépa entretien, coaching. Ou deviens mentor — 80% pour toi.'
							: '1-on-1 session: code review, interview prep, coaching. Or become a mentor — 80% is yours.'}
					</p>

					<div class="flex flex-wrap gap-1.5">
						{#each [{fr: 'Code review', en: 'Code review'}, {fr: 'Entretien', en: 'Interview'}, {fr: 'Coaching', en: 'Coaching'}] as chip (chip.en)}
							<span class="rounded-md bg-surface-overlay px-2 py-0.5 text-[11px] font-medium text-text-muted">
								{i18n.locale === 'fr' ? chip.fr : chip.en}
							</span>
						{/each}
					</div>

					<div class="mt-auto pt-5 flex items-center gap-1.5 text-xs text-text-muted">
						<span class="h-1.5 w-1.5 rounded-full bg-success"></span>
						<span>{i18n.locale === 'fr' ? '80 % du tarif revient au mentor.' : '80% of the fee goes to the mentor.'}</span>
					</div>
				</div>
			</a>
		</div>

		<div use:scrollReveal class="mt-8 text-center">
			<Button variant="ghost" size="lg" href="/opportunities">
				{i18n.locale === 'fr' ? 'Tout voir en détail →' : 'See everything in detail →'}
			</Button>
		</div>
	</div>
</section>
