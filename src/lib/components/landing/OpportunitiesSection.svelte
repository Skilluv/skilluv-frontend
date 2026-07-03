<script lang="ts">
	import { i18n } from '$lib/i18n';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
</script>

<section class="relative overflow-hidden border-t border-border bg-surface-elevated/40 py-24 sm:py-32">
	<div class="mx-auto max-w-6xl px-4">
		<!-- Section header -->
		<div class="mb-16 max-w-3xl">
			<p class="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent">
				{i18n.locale === 'fr' ? 'Au-delà des challenges' : 'Beyond challenges'}
			</p>
			<h2 class="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight">
				{#if i18n.locale === 'fr'}
					Trois manières<br />
					<span class="text-primary">de te faire connaître.</span>
				{:else}
					Three ways<br />
					<span class="text-primary">to get noticed.</span>
				{/if}
			</h2>
			<p class="mt-6 max-w-xl text-lg text-text-muted">
				{i18n.locale === 'fr'
					? "Skilluv, ce n'est pas que des challenges. Résous des issues open-source, obtiens un diplôme vérifiable, réserve un mentor."
					: "Skilluv isn't just challenges. Solve open-source issues, earn a verifiable diploma, book a mentor."}
			</p>
		</div>

		<!-- 3 pilliers -->
		<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
			<!-- Bounties -->
			<a href="/bounties" class="group flex flex-col rounded-2xl border border-border bg-surface-elevated p-8 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg relative overflow-hidden">
				<div aria-hidden="true" class="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-primary/10 blur-3xl"></div>
				<div class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl text-primary">⬢</div>
				<h3 class="mb-2 text-2xl font-black tracking-tight group-hover:text-primary transition-colors">
					{i18n.locale === 'fr' ? 'Bounties OSS' : 'OSS Bounties'}
				</h3>
				<p class="mb-4 flex-1 text-sm text-text-muted leading-relaxed">
					{i18n.locale === 'fr'
						? 'Des entreprises paient pour la résolution de leurs issues GitHub. Tu revendiques, tu ouvres une PR, elle merge : tu récoltes des fragments.'
						: 'Companies pay for their GitHub issues to be solved. You claim, open a PR, it merges: you earn fragments.'}
				</p>
				<span class="text-sm font-semibold text-primary group-hover:underline">
					{i18n.locale === 'fr' ? 'Voir les bounties →' : 'See bounties →'}
				</span>
			</a>

			<!-- Certifications -->
			<a href="/certifications" class="group flex flex-col rounded-2xl border-2 border-accent/40 bg-surface-elevated p-8 transition-all hover:-translate-y-1 hover:shadow-xl relative overflow-hidden">
				<div class="absolute -top-3 left-6">
					<Badge variant="accent" size="md">★ {i18n.locale === 'fr' ? 'Nouveau' : 'New'}</Badge>
				</div>
				<div aria-hidden="true" class="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-accent/10 blur-3xl"></div>
				<div class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-2xl text-accent">◈</div>
				<h3 class="mb-2 text-2xl font-black tracking-tight group-hover:text-primary transition-colors">
					{i18n.locale === 'fr' ? 'Certifications' : 'Certifications'}
				</h3>
				<p class="mb-4 flex-1 text-sm text-text-muted leading-relaxed">
					{i18n.locale === 'fr'
						? "Suite de challenges chronométrés. Obtiens un diplôme signé Skilluv avec un code vérifiable en ligne. Zéro tricherie possible."
						: "Timed challenge series. Get a Skilluv-signed diploma with online-verifiable code. Zero cheating possible."}
				</p>
				<span class="text-sm font-semibold text-primary group-hover:underline">
					{i18n.locale === 'fr' ? 'Voir les certifications →' : 'See certifications →'}
				</span>
			</a>

			<!-- Mentorship -->
			<a href="/mentors" class="group flex flex-col rounded-2xl border border-border bg-surface-elevated p-8 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg relative overflow-hidden">
				<div aria-hidden="true" class="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-primary/10 blur-3xl"></div>
				<div class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl text-primary">★</div>
				<h3 class="mb-2 text-2xl font-black tracking-tight group-hover:text-primary transition-colors">
					{i18n.locale === 'fr' ? 'Mentorship' : 'Mentorship'}
				</h3>
				<p class="mb-4 flex-1 text-sm text-text-muted leading-relaxed">
					{i18n.locale === 'fr'
						? "Réserve une session 1-on-1 avec un mentor : code review, prépa entretien, coaching. Ou deviens mentor toi-même — 80% te reviennent."
						: 'Book a 1-on-1 session with a mentor: code review, interview prep, coaching. Or become a mentor yourself — 80% is yours.'}
				</p>
				<span class="text-sm font-semibold text-primary group-hover:underline">
					{i18n.locale === 'fr' ? 'Trouver un mentor →' : 'Find a mentor →'}
				</span>
			</a>
		</div>

		<div class="mt-10 text-center">
			<Button variant="ghost" size="lg" href="/opportunities">
				{i18n.locale === 'fr' ? 'Tout voir en détail →' : 'See everything in detail →'}
			</Button>
		</div>
	</div>
</section>
