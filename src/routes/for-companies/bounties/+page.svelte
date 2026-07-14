<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import CtaSection from '$components/landing/CtaSection.svelte';
	import FaqSection from '$components/landing/FaqSection.svelte';

	let ctaHref = $derived(auth.isAuthenticated ? '/enterprise/bounties/new' : '/enterprise/register?intent=bounty');
	let ctaLabel = $derived(
		auth.isAuthenticated
			? (i18n.locale === 'fr' ? 'Poster ma première bounty' : 'Post my first bounty')
			: (i18n.locale === 'fr' ? 'Créer mon espace entreprise' : 'Create my enterprise space')
	);
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Bounties open-source pour entreprises — Skilluv' : 'Open-source bounties for companies — Skilluv'}</title>
	<meta
		name="description"
		content={i18n.locale === 'fr'
			? 'Sponsorisez vos issues GitHub. Payez uniquement au merge. Zéro contrat, zéro embauche, payout automatique.'
			: 'Sponsor your GitHub issues. Pay only on merge. Zero contract, zero hiring, automatic payout.'}
	/>
</svelte:head>

<!-- ═══════════════════════════════════════════════════ -->
<!-- HERO -->
<!-- ═══════════════════════════════════════════════════ -->
<section class="relative overflow-hidden border-b border-border">
	<div
		aria-hidden="true"
		class="pointer-events-none absolute inset-x-0 -top-20 h-[100vh] opacity-[0.04]"
		style="background-image: linear-gradient(var(--sk-text) 1px, transparent 1px), linear-gradient(90deg, var(--sk-text) 1px, transparent 1px); background-size: 60px 60px; mask-image: linear-gradient(to bottom, black 70%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, black 70%, transparent 100%);"
	></div>
	<div class="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
		<h1 class="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black leading-[1.05] tracking-tight">
			{#if i18n.locale === 'fr'}
				Vos issues traînent<span class="text-accent">.</span><br />
				<span class="text-primary">Sponsorisez-les.</span>
			{:else}
				Your issues drag on<span class="text-accent">.</span><br />
				<span class="text-primary">Sponsor them.</span>
			{/if}
		</h1>
		<p class="mt-8 max-w-2xl text-lg sm:text-xl text-text-muted leading-relaxed">
			{i18n.locale === 'fr'
				? 'Postez une bounty sur une issue GitHub, les crédits sont séquestrés. Un talent revendique, ouvre une PR, elle merge : le payout est automatique. Zéro contrat, zéro embauche, aucune facture à valider.'
				: 'Post a bounty on a GitHub issue, credits are escrowed. A talent claims it, opens a PR, it merges: automatic payout. Zero contract, zero hiring, no invoice to validate.'}
		</p>
		<div class="mt-10 flex flex-wrap gap-3">
			<Button variant="accent" size="lg" href={ctaHref}>{ctaLabel}</Button>
			<Button variant="ghost" size="lg" href="/bounties">
				{i18n.locale === 'fr' ? 'Voir des exemples →' : 'See examples →'}
			</Button>
		</div>
	</div>
</section>

<!-- ═══════════════════════════════════════════════════ -->
<!-- 4 BÉNÉFICES CLÉS — pattern DomainsSection -->
<!-- ═══════════════════════════════════════════════════ -->
<section class="py-16 sm:py-24 lg:py-32">
	<div class="mx-auto max-w-6xl px-4">
		<div class="mb-10 sm:mb-16 max-w-3xl">
			<h2 class="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight mb-5">
				{i18n.locale === 'fr' ? 'Pourquoi' : 'Why'}<span class="text-accent">.</span><br />
				<span class="text-accent">{i18n.locale === 'fr' ? 'Quatre raisons.' : 'Four reasons.'}</span>
			</h2>
			<p class="text-text-muted text-base sm:text-lg">
				{i18n.locale === 'fr'
					? "Les bounties couvrent une catégorie de travail que le freelance et l'embauche ratent : le tech debt, les bugs edge-case, les features side-project."
					: "Bounties cover a category of work freelancing and hiring miss: tech debt, edge-case bugs, side-project features."}
			</p>
		</div>

		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{#each [
				{ n: '01', fr: { t: 'Vitesse', d: 'Un dev intéressé peut revendiquer en 5 minutes. Pas de recrutement, pas de screening, pas de contrat.' }, en: { t: 'Speed', d: 'An interested dev can claim in 5 minutes. No recruitment, no screening, no contract.' } },
				{ n: '02', fr: { t: 'Coût variable', d: "Vous payez uniquement au merge de la PR. Aucune facture d'attente, aucun engagement mensuel." }, en: { t: 'Variable cost', d: 'You pay only when the PR merges. No pending invoice, no monthly commitment.' } },
				{ n: '03', fr: { t: 'Qualité prouvée', d: "Chaque talent affiche son historique de challenges résolus, sa progression, ses badges. Vous savez à qui vous confiez l'issue." }, en: { t: 'Proven quality', d: 'Each talent shows their history of solved challenges, progression, badges. You know who you trust the issue to.' } },
				{ n: '04', fr: { t: 'Zéro RH', d: 'Pas d\'onboarding, pas d\'accès à donner, pas de review interne. Le code arrive via une PR standard sur GitHub.' }, en: { t: 'Zero HR', d: 'No onboarding, no access to grant, no internal review. Code arrives via a standard GitHub PR.' } }
			] as b}
				{@const t = i18n.locale === 'fr' ? b.fr : b.en}
				<div class="rounded-2xl border border-border bg-surface-elevated p-6 flex flex-col">
					<div class="mb-3 text-4xl font-black text-primary tabular-nums">{b.n}</div>
					<h3 class="mb-2 text-lg font-bold">{t.t}<span class="text-accent">.</span></h3>
					<p class="text-sm text-text-muted leading-relaxed">{t.d}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ═══════════════════════════════════════════════════ -->
<!-- MÉCANIQUE 4 étapes -->
<!-- ═══════════════════════════════════════════════════ -->
<section class="border-t border-border bg-surface-elevated/40 py-16 sm:py-24 lg:py-32">
	<div class="mx-auto max-w-6xl px-4">
		<div class="mb-10 sm:mb-16 max-w-3xl">
			<h2 class="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight mb-5">
				{i18n.locale === 'fr' ? 'Séquestre' : 'Escrow'}<span class="text-accent">.</span><br />
				<span class="text-accent">{i18n.locale === 'fr' ? 'Merge. Payout.' : 'Merge. Payout.'}</span>
			</h2>
			<p class="text-text-muted text-base sm:text-lg">
				{i18n.locale === 'fr'
					? 'Le mécanisme est automatique de bout en bout, via un webhook GitHub qui détecte le merge.'
					: 'The mechanism is automatic end-to-end, via a GitHub webhook that detects the merge.'}
			</p>
		</div>

		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{#each [
				{ n: '01', fr: { t: 'Vous postez', d: "URL GitHub de l'issue, contexte, compétences requises, récompense. Les crédits sont débités et séquestrés immédiatement." }, en: { t: 'You post', d: "GitHub issue URL, context, required skills, reward. Credits are debited and escrowed immediately." } },
				{ n: '02', fr: { t: 'Un talent revendique', d: 'Un talent qualifié la revendique. Il a 7 jours pour ouvrir une PR sur votre repo.' }, en: { t: 'A talent claims', d: 'A qualified talent claims it. They have 7 days to open a PR on your repo.' } },
				{ n: '03', fr: { t: 'Vous mergez', d: 'Vous reviewez la PR comme n\'importe quelle contribution. Merge, c\'est vous qui décidez.' }, en: { t: 'You merge', d: 'You review the PR like any other contribution. Merge is your call.' } },
				{ n: '04', fr: { t: 'Payout automatique', d: 'Le webhook GitHub détecte le merge. Les crédits séquestrés sont convertis en fragments pour le talent, la bounty est marquée payée.' }, en: { t: 'Automatic payout', d: 'The GitHub webhook detects the merge. Escrowed credits are converted into fragments for the talent, bounty is marked paid.' } }
			] as step}
				{@const t = i18n.locale === 'fr' ? step.fr : step.en}
				<div class="rounded-2xl border border-border bg-surface-elevated p-6 flex flex-col">
					<div class="mb-3 flex items-center gap-2">
						<span class="font-mono text-2xl font-black text-accent">{step.n}</span>
						<span class="h-px flex-1 bg-border"></span>
					</div>
					<h3 class="mb-2 text-lg font-bold">{t.t}<span class="text-accent">.</span></h3>
					<p class="text-sm text-text-muted leading-relaxed">{t.d}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ═══════════════════════════════════════════════════ -->
<!-- COMPARAISON — 3 colonnes -->
<!-- ═══════════════════════════════════════════════════ -->
<section class="py-16 sm:py-24 lg:py-32">
	<div class="mx-auto max-w-6xl px-4">
		<div class="mb-10 sm:mb-16 max-w-3xl">
			<h2 class="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight mb-5">
				{i18n.locale === 'fr' ? 'Bounty vs' : 'Bounty vs'}<span class="text-accent">.</span><br />
				<span class="text-accent">{i18n.locale === 'fr' ? "vos autres options." : 'your other options.'}</span>
			</h2>
		</div>

		<div class="grid gap-4 sm:grid-cols-3">
			<!-- Freelance -->
			<div class="rounded-2xl border border-border bg-surface-elevated overflow-hidden">
				<div class="flex items-center gap-3 border-b border-border px-5 py-3">
					<div class="h-2.5 w-2.5 rounded-sm bg-text-muted"></div>
					<span class="text-sm font-semibold text-text-muted">Freelance</span>
				</div>
				<div class="p-5 space-y-2 text-sm">
					<p class="flex gap-2 text-text-muted"><span class="text-text-muted">–</span> {i18n.locale === 'fr' ? 'Recherche, screening, entretien' : 'Search, screening, interview'}</p>
					<p class="flex gap-2 text-text-muted"><span class="text-text-muted">–</span> {i18n.locale === 'fr' ? 'Contrat, factures, TVA' : 'Contract, invoices, VAT'}</p>
					<p class="flex gap-2 text-text-muted"><span class="text-text-muted">–</span> {i18n.locale === 'fr' ? 'Onboarding accès repo' : 'Repo access onboarding'}</p>
					<p class="flex gap-2 text-text-muted"><span class="text-text-muted">–</span> {i18n.locale === 'fr' ? 'Vous payez même si le travail ne merge pas' : 'You pay even if the work doesn\'t merge'}</p>
				</div>
			</div>

			<!-- Embauche -->
			<div class="rounded-2xl border border-border bg-surface-elevated overflow-hidden">
				<div class="flex items-center gap-3 border-b border-border px-5 py-3">
					<div class="h-2.5 w-2.5 rounded-sm bg-text-muted"></div>
					<span class="text-sm font-semibold text-text-muted">{i18n.locale === 'fr' ? 'Embauche' : 'Hiring'}</span>
				</div>
				<div class="p-5 space-y-2 text-sm">
					<p class="flex gap-2 text-text-muted"><span class="text-text-muted">–</span> {i18n.locale === 'fr' ? 'Cycle de 3-6 mois' : '3-6 month cycle'}</p>
					<p class="flex gap-2 text-text-muted"><span class="text-text-muted">–</span> {i18n.locale === 'fr' ? 'Charges sociales, salaire fixe' : 'Payroll taxes, fixed salary'}</p>
					<p class="flex gap-2 text-text-muted"><span class="text-text-muted">–</span> {i18n.locale === 'fr' ? 'Overhead RH permanent' : 'Permanent HR overhead'}</p>
					<p class="flex gap-2 text-text-muted"><span class="text-text-muted">–</span> {i18n.locale === 'fr' ? 'Sur-dimensionné pour une issue isolée' : 'Overkill for an isolated issue'}</p>
				</div>
			</div>

			<!-- Skilluv Bounty -->
			<div class="rounded-2xl border border-border bg-surface-elevated overflow-hidden">
				<div class="flex items-center gap-3 border-b border-border px-5 py-3">
					<div class="h-2.5 w-2.5 rounded-sm bg-accent"></div>
					<span class="text-sm font-semibold text-accent">Skilluv Bounty</span>
					<span class="ml-auto">
						<Badge variant="accent" size="sm">{i18n.locale === 'fr' ? 'Recommandé' : 'Recommended'}</Badge>
					</span>
				</div>
				<div class="p-5 space-y-2 text-sm">
					<p class="flex gap-2 text-text-primary"><span class="text-success font-bold">+</span> {i18n.locale === 'fr' ? 'Publication en 3 minutes' : 'Publish in 3 minutes'}</p>
					<p class="flex gap-2 text-text-primary"><span class="text-success font-bold">+</span> {i18n.locale === 'fr' ? 'Payout au merge, séquestre garanti' : 'Payout on merge, guaranteed escrow'}</p>
					<p class="flex gap-2 text-text-primary"><span class="text-success font-bold">+</span> {i18n.locale === 'fr' ? "Aucun accès repo à donner (PR standard)" : 'No repo access needed (standard PR)'}</p>
					<p class="flex gap-2 text-text-primary"><span class="text-success font-bold">+</span> {i18n.locale === 'fr' ? 'Profil talent prouvé (challenges publics)' : 'Proven talent profile (public challenges)'}</p>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- ═══════════════════════════════════════════════════ -->
<!-- CAS D'USAGE — 3 cards -->
<!-- ═══════════════════════════════════════════════════ -->
<section class="border-t border-border bg-surface-elevated/40 py-16 sm:py-24 lg:py-32">
	<div class="mx-auto max-w-6xl px-4">
		<div class="mb-10 sm:mb-16 max-w-3xl">
			<h2 class="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight mb-5">
				{i18n.locale === 'fr' ? 'Cas d\'usage' : 'Use cases'}<span class="text-accent">.</span>
			</h2>
			<p class="text-text-muted text-base sm:text-lg">
				{i18n.locale === 'fr'
					? "Ces catégories de travail sont mal servies par le freelance et l'embauche."
					: 'These work categories are poorly served by freelancing and hiring.'}
			</p>
		</div>

		<div class="grid gap-4 sm:grid-cols-3">
			<div class="rounded-2xl border border-border bg-surface-elevated overflow-hidden">
				<div class="flex items-center gap-3 border-b border-border px-5 py-3">
					<div class="h-2.5 w-2.5 rounded-sm bg-primary"></div>
					<span class="text-sm font-semibold text-primary">
						{i18n.locale === 'fr' ? 'Tech debt' : 'Tech debt'}
					</span>
				</div>
				<div class="p-5">
					<p class="text-sm text-text-muted leading-relaxed mb-4">
						{i18n.locale === 'fr'
							? "Les migrations, refactos, upgrades de dépendances qui traînent depuis 6 mois. Vos devs ont autre chose à faire, mais le boulot doit être fait."
							: "The migrations, refactors, dependency upgrades that have been sitting for 6 months. Your devs have other things to do, but the work must be done."}
					</p>
					<p class="font-mono text-xs text-accent">
						{i18n.locale === 'fr' ? 'ex : Rails 6 → 7 · Node 16 → 20 · Vue 2 → 3' : 'ex: Rails 6 → 7 · Node 16 → 20 · Vue 2 → 3'}
					</p>
				</div>
			</div>

			<div class="rounded-2xl border border-border bg-surface-elevated overflow-hidden">
				<div class="flex items-center gap-3 border-b border-border px-5 py-3">
					<div class="h-2.5 w-2.5 rounded-sm bg-primary"></div>
					<span class="text-sm font-semibold text-primary">
						{i18n.locale === 'fr' ? 'Bugs edge-case' : 'Edge-case bugs'}
					</span>
				</div>
				<div class="p-5">
					<p class="text-sm text-text-muted leading-relaxed mb-4">
						{i18n.locale === 'fr'
							? "Le bug qu'un client sur cinquante rencontre. Reproductible mais chronophage à investiguer. Un talent spécialisé le résout en une soirée."
							: 'The bug one customer in fifty hits. Reproducible but time-consuming to investigate. A specialist talent solves it in an evening.'}
					</p>
					<p class="font-mono text-xs text-accent">
						{i18n.locale === 'fr' ? 'ex : race condition async · fuite mémoire · rendu Safari cassé' : 'ex: async race condition · memory leak · broken Safari render'}
					</p>
				</div>
			</div>

			<div class="rounded-2xl border border-border bg-surface-elevated overflow-hidden">
				<div class="flex items-center gap-3 border-b border-border px-5 py-3">
					<div class="h-2.5 w-2.5 rounded-sm bg-primary"></div>
					<span class="text-sm font-semibold text-primary">
						{i18n.locale === 'fr' ? 'Features side' : 'Side features'}
					</span>
				</div>
				<div class="p-5">
					<p class="text-sm text-text-muted leading-relaxed mb-4">
						{i18n.locale === 'fr'
							? "Les features utiles mais non-prioritaires : export CSV, intégration webhook, thème sombre. Utilité modérée, coût fixe si internalisé."
							: 'Useful but non-priority features: CSV export, webhook integration, dark theme. Moderate value, fixed cost if internalized.'}
					</p>
					<p class="font-mono text-xs text-accent">
						{i18n.locale === 'fr' ? 'ex : SSO SAML · dark mode · widget embed · API pagination cursor' : 'ex: SAML SSO · dark mode · embed widget · cursor pagination API'}
					</p>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- ═══════════════════════════════════════════════════ -->
<!-- FAQ — FaqSection réutilisé -->
<!-- ═══════════════════════════════════════════════════ -->
<FaqSection
	items={i18n.locale === 'fr'
		? [
			{ q: 'Et si personne ne merge la PR ?', a: "Les crédits séquestrés vous sont remboursés à l'expiration de la bounty (30 jours par défaut, configurable). Vous ne payez que si la PR est mergée par votre équipe." },
			{ q: 'La qualité du code est-elle garantie ?', a: "La qualité est validée par votre review — vous êtes libre de rejeter la PR. Le talent est incité à livrer propre car son profil publique enregistre le taux d'acceptation." },
			{ q: 'Qui possède le code produit ?', a: 'Votre entreprise. La bounty est un contrat de type work-for-hire : la contribution est incorporée à votre repo sous votre licence, comme n\'importe quelle PR merge.' },
			{ q: 'Comment reconnaissons-nous le talent ?', a: "Chaque talent a un profil public avec son historique de challenges résolus par domaine, ses badges, son streak, ses PRs mergées. Vous choisissez à qui vous confiez l'issue." },
			{ q: 'Combien coûte le service ?', a: 'Aucun abonnement, aucun coût fixe. Skilluv prélève une commission de 15% sur la récompense au merge — visible dans la simulation avant publication.' }
		]
		: [
			{ q: 'What if nobody merges the PR?', a: 'Escrowed credits are refunded to you on bounty expiration (30 days default, configurable). You only pay if the PR is merged by your team.' },
			{ q: 'Is code quality guaranteed?', a: 'Quality is validated by your review — you\'re free to reject the PR. The talent is incentivized to deliver clean work because their public profile records the acceptance rate.' },
			{ q: 'Who owns the produced code?', a: 'Your company. A bounty is a work-for-hire contract: the contribution is incorporated into your repo under your license, like any merged PR.' },
			{ q: 'How do we identify the talent?', a: 'Each talent has a public profile with their solved challenge history by domain, badges, streak, merged PRs. You choose who to trust the issue with.' },
			{ q: 'How much does the service cost?', a: 'No subscription, no fixed cost. Skilluv takes a 15% commission on the reward at merge — visible in the simulation before publication.' }
		]}
/>

<!-- ═══════════════════════════════════════════════════ -->
<!-- CTA final — CtaSection réutilisé -->
<!-- ═══════════════════════════════════════════════════ -->
<CtaSection
	title={i18n.locale === 'fr' ? 'Cette issue.' : 'That issue.'}
	accent={i18n.locale === 'fr' ? 'Elle mérite une bounty ?' : 'Does it deserve a bounty?'}
	description={i18n.locale === 'fr'
		? '3 minutes pour la publier. Aucun frais fixe. Vous ne payez qu\'au merge.'
		: '3 minutes to publish. No fixed fee. You only pay on merge.'}
	ctaHref={ctaHref}
	ctaLabel={ctaLabel}
>
	{#snippet secondary()}
		<Button variant="ghost" size="lg" href="/pricing">
			{i18n.locale === 'fr' ? 'Voir les tarifs →' : 'See pricing →'}
		</Button>
	{/snippet}
</CtaSection>
