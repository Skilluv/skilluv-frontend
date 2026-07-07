<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { scrollReveal } from '$lib/utils/animations';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';

	// Ticker fake bounties (rotate every 2.5s)
	const bountyTicker = [
		{ frag: 250, slug: 'reverse-async-runtime' },
		{ frag: 180, slug: 'fix-hydration-race' },
		{ frag: 320, slug: 'pentest-jwt-flow' },
		{ frag: 140, slug: 'godot-physics-drift' }
	];
	let tickerIndex = $state(0);

	$effect(() => {
		const id = setInterval(() => { tickerIndex = (tickerIndex + 1) % bountyTicker.length; }, 2500);
		return () => clearInterval(id);
	});
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
				href="/bounties"
				use:scrollReveal
				class="group rounded-2xl border border-border bg-surface-elevated overflow-hidden transition-colors duration-200 hover:border-primary/40 flex flex-col"
			>
				<!-- Header bar : dot + label + right meta -->
				<div class="flex items-center gap-3 border-b border-border px-5 py-3">
					<div class="h-2.5 w-2.5 rounded-sm bg-primary"></div>
					<span class="text-sm font-semibold text-primary">
						{i18n.locale === 'fr' ? 'Bounties OSS' : 'OSS Bounties'}
					</span>
					<span class="ml-auto flex items-center gap-1.5 text-xs text-text-muted">
						<span class="h-1.5 w-1.5 rounded-full bg-success"></span>
						142 {i18n.locale === 'fr' ? 'actives' : 'active'}
					</span>
				</div>

				<div class="p-5 flex-1 flex flex-col">
					<!-- Ticker (voix "hunt") -->
					<div class="font-mono text-xs leading-relaxed mb-5 space-y-1">
						{#key tickerIndex}
							<p class="flex items-baseline gap-2 text-text-primary animate-in slide-in-from-bottom-1">
								<span class="text-accent font-bold">+{bountyTicker[tickerIndex].frag}◆</span>
								<span class="truncate text-text-muted">{bountyTicker[tickerIndex].slug}</span>
							</p>
						{/key}
						<p class="flex items-baseline gap-2 opacity-40">
							<span class="text-accent font-bold">+{bountyTicker[(tickerIndex + 1) % bountyTicker.length].frag}◆</span>
							<span class="truncate text-text-muted">{bountyTicker[(tickerIndex + 1) % bountyTicker.length].slug}</span>
						</p>
						<p class="flex items-baseline gap-2 opacity-20">
							<span class="text-accent font-bold">+{bountyTicker[(tickerIndex + 2) % bountyTicker.length].frag}◆</span>
							<span class="truncate text-text-muted">{bountyTicker[(tickerIndex + 2) % bountyTicker.length].slug}</span>
						</p>
					</div>

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
						<span>3.2K◆ {i18n.locale === 'fr' ? 'payés cette semaine' : 'paid this week'}</span>
					</div>
				</div>
			</a>

			<!-- ═══ CARD 02 — CERTIFICATIONS ═══ -->
			<a
				href="/certifications"
				use:scrollReveal
				class="group rounded-2xl border border-border bg-surface-elevated overflow-hidden transition-colors duration-200 hover:border-accent/40 flex flex-col"
			>
				<div class="flex items-center gap-3 border-b border-border px-5 py-3">
					<div class="h-2.5 w-2.5 rounded-sm bg-accent"></div>
					<span class="text-sm font-semibold text-accent">
						Certifications
					</span>
					<span class="ml-auto">
						<Badge variant="accent" size="sm">★ {i18n.locale === 'fr' ? 'Nouveau' : 'New'}</Badge>
					</span>
				</div>

				<div class="p-5 flex-1 flex flex-col">
					<!-- Sample cert code (voix "officiel") -->
					<div class="mb-5 rounded-md bg-surface-overlay px-3 py-2">
						<p class="text-[10px] uppercase tracking-widest text-text-muted mb-1">
							{i18n.locale === 'fr' ? 'Code vérifiable' : 'Verifiable code'}
						</p>
						<p class="font-mono text-sm font-bold text-accent">#SLV-2026-R7X4</p>
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
						<span><b class="text-text-primary">12</b> certifs</span>
						<span class="text-border">·</span>
						<span><b class="text-text-primary">4 823</b> {i18n.locale === 'fr' ? 'diplômes' : 'diplomas'}</span>
						<span class="text-border">·</span>
						<span><b class="text-accent">0</b> {i18n.locale === 'fr' ? 'tricheurs' : 'cheaters'}</span>
					</div>
				</div>
			</a>

			<!-- ═══ CARD 03 — MENTORSHIP ═══ -->
			<a
				href="/mentors"
				use:scrollReveal
				class="group rounded-2xl border border-border bg-surface-elevated overflow-hidden transition-colors duration-200 hover:border-primary/40 flex flex-col"
			>
				<div class="flex items-center gap-3 border-b border-border px-5 py-3">
					<div class="h-2.5 w-2.5 rounded-sm bg-primary"></div>
					<span class="text-sm font-semibold text-primary">
						Mentorship
					</span>
					<span class="ml-auto">
						<Badge variant="success" size="sm">92% match</Badge>
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
						{#each [{fr: 'Code review', en: 'Code review'}, {fr: 'Entretien', en: 'Interview'}, {fr: 'Coaching', en: 'Coaching'}] as chip}
							<span class="rounded-md bg-surface-overlay px-2 py-0.5 text-[11px] font-medium text-text-muted">
								{i18n.locale === 'fr' ? chip.fr : chip.en}
							</span>
						{/each}
					</div>

					<div class="mt-auto pt-5 flex items-center gap-1.5 text-xs text-text-muted">
						<span class="h-1.5 w-1.5 rounded-full bg-success"></span>
						<span>89 {i18n.locale === 'fr' ? 'mentors actifs' : 'active mentors'}</span>
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
