<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import Button from '$components/ui/Button.svelte';
	import CtaSection from '$components/landing/CtaSection.svelte';

	let ctaHref = $derived(auth.isAuthenticated ? '/enterprise/dashboard' : '/enterprise/register');
	let ctaLabel = $derived(
		auth.isAuthenticated
			? i18n.locale === 'fr'
				? 'Accéder à mon espace'
				: 'Go to my space'
			: i18n.locale === 'fr'
				? 'Créer mon espace entreprise'
				: 'Create my enterprise space'
	);

	const benefits = [
		{
			fr: { title: 'Sourcing par compétence prouvée', body: 'Filtrez par domaine (code, design, game, security), niveau (apprenti → légende), pays, langage, badges. Tous les profils sont alimentés par des soumissions évaluées, pas par des déclarations.' },
			en: { title: 'Source by proven skill', body: 'Filter by domain (code, design, game, security), level (apprentice → legend), country, language, badges. Every profile is fed by graded submissions, not self-declared claims.' }
		},
		{
			fr: { title: 'Bookmarks et listes', body: 'Organisez vos talents par projet ou par poste. Partagez les listes avec votre équipe RH ou technique.' },
			en: { title: 'Bookmarks and lists', body: 'Organise talents by project or role. Share lists with your HR or tech team.' }
		},
		{
			fr: { title: 'Messagerie respectueuse', body: 'Aucun spam : vous manifestez un intérêt, le talent accepte ou refuse. Une conversation directe ne s\'ouvre qu\'après accord mutuel.' },
			en: { title: 'Respectful messaging', body: 'No spam: you express interest, the talent accepts or declines. A direct conversation opens only after mutual agreement.' }
		},
		{
			fr: { title: 'Données fiables', body: 'Fragments, séries, badges, profondeur dans l\'arbre de compétences. Vous voyez l\'engagement réel, pas un CV embelli.' },
			en: { title: 'Reliable data', body: 'Fragments, streaks, badges, depth in the skill tree. You see real engagement, not a polished resume.' }
		}
	];

	const steps = [
		{ n: '01', fr: { t: 'Créez votre espace', d: 'Inscription en moins de 2 minutes. Confirmez votre identité entreprise.' }, en: { t: 'Create your space', d: 'Sign up in under 2 minutes. Confirm your company identity.' } },
		{ n: '02', fr: { t: 'Définissez vos critères', d: 'Domaine, niveau, langues techniques, pays, disponibilité.' }, en: { t: 'Define your criteria', d: 'Domain, level, tech stack, country, availability.' } },
		{ n: '03', fr: { t: 'Identifiez les talents', d: 'Parcourez les profils, ouvrez les preuves (solutions, séries), enregistrez-les.' }, en: { t: 'Identify talents', d: 'Browse profiles, open the proofs (solutions, streaks), bookmark them.' } },
		{ n: '04', fr: { t: 'Engagez la conversation', d: 'Manifestez votre intérêt. Si accepté, échangez directement avec le talent.' }, en: { t: 'Start the conversation', d: 'Express interest. If accepted, message the talent directly.' } }
	];
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Espace entreprises — Skilluv' : 'For companies — Skilluv'}</title>
	<meta
		name="description"
		content={i18n.locale === 'fr'
			? 'Skilluv pour les entreprises : recrutez sur la base de compétences prouvées, pas de déclarations.'
			: 'Skilluv for companies: hire on proven skills, not declarations.'}
	/>
</svelte:head>

<!-- Hero -->
<section class="relative overflow-hidden border-b border-border">
	<div class="mx-auto max-w-6xl px-4 py-20 sm:py-28">
		<div class="max-w-4xl">
			<h1 class="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black leading-[1.05] tracking-tight">
				{#if i18n.locale === 'fr'}
					Le CV est mort.<br />
					<span class="text-primary">Bienvenue dans la preuve.</span>
				{:else}
					The resume is dead.<br />
					<span class="text-primary">Welcome to proof.</span>
				{/if}
			</h1>
			<p class="mt-8 max-w-2xl text-lg text-text-muted">
				{i18n.locale === 'fr'
					? "Recrutez des talents tech qui ont déjà prouvé ce qu'ils savent faire. Sourcing par compétence, pas par diplôme. Disponible en France, au Bénin et partout en Afrique."
					: 'Hire tech talents who have already proven what they can do. Source by skill, not by degree. Available in France, Benin and across Africa.'}
			</p>
			<div class="mt-8 flex flex-wrap gap-3">
				<Button variant="accent" size="lg" href={ctaHref}>{ctaLabel}</Button>
				<Button variant="ghost" size="lg" href="/enterprise/register">
					{i18n.locale === 'fr' ? 'Découvrir le sourcing' : 'Explore sourcing'}
				</Button>
			</div>
			<p class="mt-4 text-xs text-text-muted">
				{i18n.locale === 'fr' ? 'Inscription gratuite · Sans engagement · Données conformes RGPD' : 'Free signup · No commitment · GDPR-compliant data'}
			</p>
		</div>
	</div>
</section>

<!-- Benefits -->
<section class="mx-auto max-w-6xl px-4 py-20 sm:py-28">
	<h2 class="mb-5 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight">
		{i18n.locale === 'fr' ? 'Ce que vous' : 'What you'}<br />
		<span class="text-accent">{i18n.locale === 'fr' ? 'obtenez.' : 'get.'}</span>
	</h2>
	<div class="grid gap-4 sm:grid-cols-2">
		{#each benefits as b, i}
			{@const t = i18n.locale === 'fr' ? b.fr : b.en}
			<article class="rounded-2xl border border-border bg-surface-elevated overflow-hidden flex flex-col">
				<div class="flex items-center gap-3 border-b border-border px-5 py-3">
					<div class="h-2.5 w-2.5 rounded-sm bg-primary"></div>
					<span class="text-sm font-semibold text-primary">{t.title}</span>
					<span class="ml-auto font-mono text-xs text-text-muted">0{i + 1}</span>
				</div>
				<div class="p-5">
					<p class="text-sm text-text-muted leading-relaxed">{t.body}</p>
				</div>
			</article>
		{/each}
	</div>
</section>

<!-- Comparison block -->
<section class="border-y border-border bg-surface-elevated/40 py-20 sm:py-24">
	<div class="mx-auto max-w-6xl px-4">
		<h2 class="mb-5 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight">
			{i18n.locale === 'fr' ? 'Classique' : 'Classic'}<br />
			<span class="text-accent">{i18n.locale === 'fr' ? 'vs Skilluv.' : 'vs Skilluv.'}</span>
		</h2>
		<div class="grid gap-4 sm:grid-cols-2">
			<div class="rounded-2xl border border-border bg-surface-elevated overflow-hidden">
				<div class="flex items-center gap-3 border-b border-border px-5 py-3">
					<div class="h-2.5 w-2.5 rounded-sm bg-text-muted"></div>
					<span class="text-sm font-semibold text-text-muted">
						{i18n.locale === 'fr' ? 'Recrutement classique' : 'Classic hiring'}
					</span>
				</div>
				<ul class="p-5 space-y-3 text-sm">
					{#each [
						{ fr: 'CV déclaratif, non vérifiable', en: 'Self-declared resume, unverifiable' },
						{ fr: 'Tests techniques génériques en entretien', en: 'Generic tech tests during interviews' },
						{ fr: "Aucune visibilité sur l'engagement réel", en: 'No visibility into real engagement' },
						{ fr: 'Spam et messages froids', en: 'Spam and cold outreach' }
					] as item}
						<li class="flex items-start gap-2 text-text-muted">
							<span class="mt-0.5 shrink-0 text-error">×</span>
							<span>{i18n.locale === 'fr' ? item.fr : item.en}</span>
						</li>
					{/each}
				</ul>
			</div>
			<div class="rounded-2xl border border-border bg-surface-elevated overflow-hidden">
				<div class="flex items-center gap-3 border-b border-border px-5 py-3">
					<div class="h-2.5 w-2.5 rounded-sm bg-accent"></div>
					<span class="text-sm font-semibold text-accent">Skilluv</span>
				</div>
				<ul class="p-5 space-y-3 text-sm">
					{#each [
						{ fr: 'Compétences prouvées par des challenges évalués', en: 'Skills proven through graded challenges' },
						{ fr: 'Niveau, streak, badges et progression visibles', en: 'Level, streak, badges and progression visible' },
						{ fr: 'Sourcing affiné par domaine, langage, pays', en: 'Sourcing refined by domain, stack, country' },
						{ fr: 'Contact direct uniquement après accord du talent', en: 'Direct contact only after the talent accepts' }
					] as item}
						<li class="flex items-start gap-2 text-text-primary">
							<span class="mt-0.5 shrink-0 text-success">+</span>
							<span>{i18n.locale === 'fr' ? item.fr : item.en}</span>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	</div>
</section>

<!-- How it works -->
<section class="mx-auto max-w-6xl px-4 py-20 sm:py-28">
	<h2 class="mb-5 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight">
		{i18n.locale === 'fr' ? 'Comment ça marche' : 'How it works'}<span class="text-accent">.</span>
	</h2>
	<ol class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
		{#each steps as s}
			{@const t = i18n.locale === 'fr' ? s.fr : s.en}
			<li class="rounded-2xl border border-border bg-surface-elevated overflow-hidden flex flex-col">
				<div class="flex items-center gap-3 border-b border-border px-5 py-3">
					<div class="h-2.5 w-2.5 rounded-sm bg-primary"></div>
					<span class="text-sm font-semibold text-primary">{t.t}</span>
					<span class="ml-auto font-mono text-xs text-text-muted">{s.n}</span>
				</div>
				<div class="p-5">
					<p class="text-sm text-text-muted leading-relaxed">{t.d}</p>
				</div>
			</li>
		{/each}
	</ol>
</section>

<!-- =====================================================
     HUB — Tout ce que tu peux faire côté entreprise
     ===================================================== -->
<section class="border-t border-border bg-surface-elevated/40 py-20 sm:py-24">
	<div class="mx-auto max-w-6xl px-4">
		<div use:scrollReveal class="mb-10 sm:mb-16">
			<h2 class="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight mb-5">
				{i18n.locale === 'fr' ? 'Tout ce dont' : 'Everything you'}<br />
				<span class="text-accent">{i18n.locale === 'fr' ? 'vous avez besoin.' : 'need.'}</span>
			</h2>
		</div>

		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<!-- Recherche avancée -->
			<a href="/enterprise/register" class="group flex flex-col rounded-2xl border border-border bg-surface-elevated overflow-hidden transition-colors duration-200 hover:border-primary/40">
				<div class="flex items-center gap-3 border-b border-border px-5 py-3">
					<div class="h-2.5 w-2.5 rounded-sm bg-primary"></div>
					<span class="text-sm font-semibold text-primary">
						{i18n.locale === 'fr' ? 'Recherche avancée' : 'Advanced search'}
					</span>
					<span class="ml-auto text-xs text-text-muted">13 {i18n.locale === 'fr' ? 'filtres' : 'filters'}</span>
				</div>
				<div class="p-5 flex-1 flex flex-col">
					<p class="text-sm text-text-muted leading-relaxed mb-5">
						{i18n.locale === 'fr'
							? 'Croise compétence, niveau, streak, badges, langue, pays, disponibilité, GitHub.'
							: 'Cross skill, level, streak, badges, language, country, availability, GitHub.'}
					</p>
					<div class="mt-auto flex flex-wrap gap-1.5">
						{#each ['skill', 'level', 'streak', 'badges', 'country', 'lang'] as tag}
							<span class="rounded-md bg-surface-overlay px-2 py-0.5 text-[11px] font-medium text-text-muted">{tag}</span>
						{/each}
					</div>
				</div>
			</a>

			<!-- Bounties -->
			<a href="/for-companies/bounties" id="bounties" class="group flex flex-col scroll-mt-24 rounded-2xl border border-border bg-surface-elevated overflow-hidden transition-colors duration-200 hover:border-accent/40">
				<div class="flex items-center gap-3 border-b border-border px-5 py-3">
					<div class="h-2.5 w-2.5 rounded-sm bg-accent"></div>
					<span class="text-sm font-semibold text-accent">
						{i18n.locale === 'fr' ? 'Bounties open-source' : 'Open-source bounties'}
					</span>
					<span class="ml-auto text-xs text-text-muted font-mono">OSS</span>
				</div>
				<div class="p-5 flex-1 flex flex-col">
					<p class="text-sm text-text-muted leading-relaxed mb-5">
						{i18n.locale === 'fr'
							? 'Séquestre à la publication, payout automatique au merge. Zéro contrat.'
							: 'Escrow on publish, automatic payout on merge. Zero contract.'}
					</p>
					<div class="mt-auto font-mono text-xs text-text-muted flex items-center gap-2 flex-wrap">
						<span class="text-accent font-bold">SÉQUESTRE</span>
						<span>→</span>
						<span>MERGE</span>
						<span>→</span>
						<span class="text-accent font-bold">PAYOUT</span>
					</div>
				</div>
			</a>

			<!-- Tarifs multi-devise -->
			<a href="/pricing" class="group flex flex-col rounded-2xl border border-border bg-surface-elevated overflow-hidden transition-colors duration-200 hover:border-primary/40">
				<div class="flex items-center gap-3 border-b border-border px-5 py-3">
					<div class="h-2.5 w-2.5 rounded-sm bg-primary"></div>
					<span class="text-sm font-semibold text-primary">
						{i18n.locale === 'fr' ? 'Tarifs multi-devise' : 'Multi-currency pricing'}
					</span>
					<span class="ml-auto text-xs text-text-muted">Pay-as-you-go</span>
				</div>
				<div class="p-5 flex-1 flex flex-col">
					<p class="text-sm text-text-muted leading-relaxed mb-5">
						{i18n.locale === 'fr'
							? "Aucun engagement mensuel. Refund automatique 50% si le talent décline l'intérêt."
							: 'No monthly commitment. Automatic 50% refund if talent declines the interest.'}
					</p>
					<div class="mt-auto flex flex-wrap gap-1.5">
						{#each ['EUR', 'USD', 'NGN', 'XOF', 'MAD'] as cur}
							<span class="rounded-md bg-surface-overlay px-2 py-0.5 text-[11px] font-mono font-semibold text-text-muted">{cur}</span>
						{/each}
					</div>
				</div>
			</a>

			<!-- Certifications -->
			<a href="/certifications" class="group flex flex-col rounded-2xl border border-border bg-surface-elevated overflow-hidden transition-colors duration-200 hover:border-accent/40">
				<div class="flex items-center gap-3 border-b border-border px-5 py-3">
					<div class="h-2.5 w-2.5 rounded-sm bg-accent"></div>
					<span class="text-sm font-semibold text-accent">
						Certifications
					</span>
					<span class="ml-auto text-xs text-text-muted">4 823 {i18n.locale === 'fr' ? 'signés' : 'signed'}</span>
				</div>
				<div class="p-5 flex-1 flex flex-col">
					<p class="text-sm text-text-muted leading-relaxed mb-5">
						{i18n.locale === 'fr'
							? "Vérifie un diplôme candidat en 1 clic sur son code court. Opposable au recruteur."
							: "Verify a candidate's diploma in 1 click via short code. Recruiter-proof."}
					</p>
					<div class="mt-auto rounded-md bg-surface-overlay px-3 py-2">
						<p class="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">
							{i18n.locale === 'fr' ? 'Code vérifiable' : 'Verifiable code'}
						</p>
						<p class="font-mono text-sm font-bold text-accent">#SLV-2026-R7X4</p>
					</div>
				</div>
			</a>

			<!-- Crédits & facturation -->
			<a href="/enterprise/credits" class="group flex flex-col rounded-2xl border border-border bg-surface-elevated overflow-hidden transition-colors duration-200 hover:border-primary/40">
				<div class="flex items-center gap-3 border-b border-border px-5 py-3">
					<div class="h-2.5 w-2.5 rounded-sm bg-primary"></div>
					<span class="text-sm font-semibold text-primary">
						{i18n.locale === 'fr' ? 'Crédits & facturation' : 'Credits & billing'}
					</span>
					<span class="ml-auto text-xs text-text-muted">PDF</span>
				</div>
				<div class="p-5 flex-1 flex flex-col">
					<p class="text-sm text-text-muted leading-relaxed mb-5">
						{i18n.locale === 'fr'
							? 'Achète des crédits, redeem des codes promo, télécharge tes factures PDF.'
							: 'Buy credits, redeem promo codes, download PDF invoices.'}
					</p>
					<div class="mt-auto rounded-md bg-surface-overlay px-3 py-2">
						<p class="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">
							{i18n.locale === 'fr' ? 'Numéro facture' : 'Invoice number'}
						</p>
						<p class="font-mono text-sm font-bold text-primary">SKL-2026-00042</p>
					</div>
				</div>
			</a>

			<!-- Abonnements Pipeline -->
			<a href="/enterprise/subscriptions" class="group flex flex-col rounded-2xl border border-border bg-surface-elevated overflow-hidden transition-colors duration-200 hover:border-accent/40">
				<div class="flex items-center gap-3 border-b border-border px-5 py-3">
					<div class="h-2.5 w-2.5 rounded-sm bg-accent"></div>
					<span class="text-sm font-semibold text-accent">
						{i18n.locale === 'fr' ? 'Abonnements Pipeline' : 'Pipeline subscriptions'}
					</span>
					<span class="ml-auto text-xs text-text-muted">
						{i18n.locale === 'fr' ? 'mensuel' : 'monthly'}
					</span>
				</div>
				<div class="p-5 flex-1 flex flex-col">
					<p class="text-sm text-text-muted leading-relaxed mb-5">
						{i18n.locale === 'fr'
							? 'Crédits inclus tous les mois. Annulation à tout moment sans frais cachés.'
							: 'Credits included monthly. Cancel anytime, no hidden fees.'}
					</p>
					<div class="mt-auto flex items-center gap-2 flex-wrap">
						<span class="rounded-md bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">Starter</span>
						<span class="rounded-md bg-accent/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-accent">Growth</span>
						<span class="rounded-md bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">Scale</span>
					</div>
				</div>
			</a>
		</div>
	</div>
</section>

<!-- CTA final — CtaSection component, identique à /accueil sauf le texte -->
<CtaSection
	title={i18n.locale === 'fr' ? 'Prêt à recruter' : 'Ready to hire'}
	accent={i18n.locale === 'fr' ? 'sur la preuve ?' : 'on proof?'}
	description={i18n.locale === 'fr' ? 'Créez votre espace entreprise gratuitement. Aucune carte bancaire requise.' : 'Create your enterprise space for free. No credit card required.'}
	ctaHref={ctaHref}
	ctaLabel={ctaLabel}
>
	{#snippet secondary()}
		<Button variant="ghost" size="lg" href="/legal/terms">
			{i18n.locale === 'fr' ? 'Lire les CGU' : 'Read terms'}
		</Button>
	{/snippet}
</CtaSection>
