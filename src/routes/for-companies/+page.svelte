<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import Button from '$components/ui/Button.svelte';

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
			icon: '◎',
			fr: { title: 'Sourcing par compétence prouvée', body: 'Filtrez par domaine (code, design, game, security), niveau (apprenti → légende), pays, langage, badges. Tous les profils sont alimentés par des soumissions évaluées, pas par des déclarations.' },
			en: { title: 'Source by proven skill', body: 'Filter by domain (code, design, game, security), level (apprentice → legend), country, language, badges. Every profile is fed by graded submissions, not self-declared claims.' }
		},
		{
			icon: '★',
			fr: { title: 'Bookmarks et listes', body: 'Organisez vos talents par projet ou par poste. Partagez les listes avec votre équipe RH ou technique.' },
			en: { title: 'Bookmarks and lists', body: 'Organise talents by project or role. Share lists with your HR or tech team.' }
		},
		{
			icon: '◆',
			fr: { title: 'Messagerie respectueuse', body: 'Aucun spam : vous manifestez un intérêt, le talent accepte ou refuse. Une conversation directe ne s\'ouvre qu\'après accord mutuel.' },
			en: { title: 'Respectful messaging', body: 'No spam: you express interest, the talent accepts or declines. A direct conversation opens only after mutual agreement.' }
		},
		{
			icon: '⬢',
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
				<Button variant="ghost" size="lg" href="/find-talents">
					{i18n.locale === 'fr' ? 'Découvrir le sourcing →' : 'Explore sourcing →'}
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
	<h2 class="mb-12 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight">
		{i18n.locale === 'fr' ? 'Ce que vous' : 'What you'}<br />
		<span class="text-accent">{i18n.locale === 'fr' ? 'obtenez.' : 'get.'}</span>
	</h2>
	<div class="grid gap-5 sm:grid-cols-2">
		{#each benefits as b}
			{@const t = i18n.locale === 'fr' ? b.fr : b.en}
			<article class="rounded-2xl border border-border bg-surface-elevated p-6">
				<div class="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-xl text-primary">{b.icon}</div>
				<h3 class="text-base font-semibold text-text-primary">{t.title}</h3>
				<p class="mt-2 text-sm leading-relaxed text-text-muted">{t.body}</p>
			</article>
		{/each}
	</div>
</section>

<!-- Comparison block -->
<section class="border-y border-border bg-surface-elevated/40 py-20 sm:py-24">
	<div class="mx-auto max-w-6xl px-4">
		<h2 class="mb-12 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight">
			{i18n.locale === 'fr' ? 'Classique' : 'Classic'}<br />
			<span class="text-accent">{i18n.locale === 'fr' ? 'vs Skilluv.' : 'vs Skilluv.'}</span>
		</h2>
		<div class="grid gap-4 sm:grid-cols-2">
			<div class="rounded-2xl border border-border bg-surface-elevated p-6">
				<p class="mb-4 text-xs font-bold uppercase tracking-wider text-text-muted line-through decoration-error/50">
					{i18n.locale === 'fr' ? 'Recrutement classique' : 'Classic hiring'}
				</p>
				<ul class="space-y-3 text-sm">
					{#each [
						{ fr: 'CV déclaratif, non vérifiable', en: 'Self-declared resume, unverifiable' },
						{ fr: 'Tests techniques génériques en entretien', en: 'Generic tech tests during interviews' },
						{ fr: "Aucune visibilité sur l'engagement réel", en: 'No visibility into real engagement' },
						{ fr: 'Spam et messages froids', en: 'Spam and cold outreach' }
					] as item}
						<li class="flex items-start gap-2 text-text-primary opacity-90">
							<span class="mt-0.5 shrink-0 text-error">×</span>
							<span>{i18n.locale === 'fr' ? item.fr : item.en}</span>
						</li>
					{/each}
				</ul>
			</div>
			<div class="rounded-2xl border border-primary/40 bg-surface-elevated p-6">
				<p class="mb-4 text-xs font-bold uppercase tracking-wider text-primary">Skilluv</p>
				<ul class="space-y-3 text-sm">
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
	<h2 class="mb-12 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight">
		{i18n.locale === 'fr' ? 'Comment ça marche' : 'How it works'}<span class="text-accent">.</span>
	</h2>
	<ol class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
		{#each steps as s}
			{@const t = i18n.locale === 'fr' ? s.fr : s.en}
			<li class="rounded-2xl border border-border bg-surface-elevated p-6">
				<span class="font-mono text-xs text-primary">{s.n}</span>
				<h3 class="mt-2 text-base font-semibold text-text-primary">{t.t}</h3>
				<p class="mt-2 text-sm leading-relaxed text-text-muted">{t.d}</p>
			</li>
		{/each}
	</ol>
</section>

<!-- CTA final -->
<section class="py-20 sm:py-28">
	<div class="mx-auto max-w-6xl px-4">
		<div class="rounded-3xl border border-border bg-surface-elevated p-12 sm:p-16 lg:p-20 text-center">
			<h2 class="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight">
				{i18n.locale === 'fr' ? 'Prêt à recruter' : 'Ready to hire'}<br />
				<span class="text-accent">{i18n.locale === 'fr' ? 'sur la preuve ?' : 'on proof?'}</span>
			</h2>
			<p class="mx-auto mt-5 max-w-xl text-lg text-text-muted">
				{i18n.locale === 'fr'
					? "Créez votre espace entreprise gratuitement. Aucune carte bancaire requise."
					: 'Create your enterprise space for free. No credit card required.'}
			</p>
			<div class="mt-8 flex flex-wrap justify-center gap-3">
				<Button variant="accent" size="lg" href={ctaHref}>{ctaLabel}</Button>
				<Button variant="ghost" size="lg" href="/legal/terms">
					{i18n.locale === 'fr' ? 'Lire les CGU' : 'Read terms'}
				</Button>
			</div>
		</div>
	</div>
</section>

<!-- =====================================================
     HUB — Tout ce que tu peux faire côté entreprise
     ===================================================== -->
<section class="border-t border-border bg-surface-elevated/40 py-20 sm:py-24">
	<div class="mx-auto max-w-6xl px-4">
		<div class="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<p class="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">
					{i18n.locale === 'fr' ? 'Suite entreprise' : 'Enterprise suite'}
				</p>
				<h2 class="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight">
					{i18n.locale === 'fr' ? 'Tout ce dont' : 'Everything you'}<br />
					<span class="text-primary">{i18n.locale === 'fr' ? 'vous avez besoin.' : 'need.'}</span>
				</h2>
			</div>
		</div>

		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<!-- Sourcing -->
			<a href="/talent-search" class="group flex flex-col rounded-2xl border border-border bg-surface-elevated p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
				<div class="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-xl text-primary">⬢</div>
				<h3 class="mb-2 text-lg font-bold group-hover:text-primary transition-colors">
					{i18n.locale === 'fr' ? 'Recherche avancée' : 'Advanced search'}
				</h3>
				<p class="mb-4 flex-1 text-sm text-text-muted">
					{i18n.locale === 'fr'
						? '13 filtres croisés : compétence, streak, GitHub, badges, langue, pays, disponibilité.'
						: '13 cross filters: skill, streak, GitHub, badges, language, country, availability.'}
				</p>
				<span class="text-sm font-semibold text-primary group-hover:underline">
					{i18n.locale === 'fr' ? 'Chercher des talents →' : 'Search talents →'}
				</span>
			</a>

			<!-- Bounties (post) -->
			<a href="/bounties" class="group flex flex-col rounded-2xl border border-border bg-surface-elevated p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
				<div class="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-xl text-accent">⬡</div>
				<h3 class="mb-2 text-lg font-bold group-hover:text-primary transition-colors">
					{i18n.locale === 'fr' ? 'Bounties open-source' : 'Open-source bounties'}
				</h3>
				<p class="mb-4 flex-1 text-sm text-text-muted">
					{i18n.locale === 'fr'
						? 'Poste une bounty sur une issue GitHub. Le talent résout, la PR est mergée, le payout est automatique.'
						: 'Post a bounty on a GitHub issue. Talent solves, PR gets merged, payout is automatic.'}
				</p>
				<span class="text-sm font-semibold text-primary group-hover:underline">
					{i18n.locale === 'fr' ? 'Voir les bounties →' : 'See bounties →'}
				</span>
			</a>

			<!-- Pricing -->
			<a href="/pricing" class="group flex flex-col rounded-2xl border border-border bg-surface-elevated p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
				<div class="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-xl text-primary">★</div>
				<h3 class="mb-2 text-lg font-bold group-hover:text-primary transition-colors">
					{i18n.locale === 'fr' ? 'Tarifs multi-devise' : 'Multi-currency pricing'}
				</h3>
				<p class="mb-4 flex-1 text-sm text-text-muted">
					{i18n.locale === 'fr'
						? 'Pay-as-you-go en EUR, USD, NGN, XOF, MAD… Refund automatique 50% si le talent décline.'
						: 'Pay-as-you-go in EUR, USD, NGN, XOF, MAD… Automatic 50% refund if talent declines.'}
				</p>
				<span class="text-sm font-semibold text-primary group-hover:underline">
					{i18n.locale === 'fr' ? 'Voir les tarifs →' : 'See pricing →'}
				</span>
			</a>

			<!-- Certifications -->
			<a href="/certifications" class="group flex flex-col rounded-2xl border border-border bg-surface-elevated p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
				<div class="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-xl text-accent">◈</div>
				<h3 class="mb-2 text-lg font-bold group-hover:text-primary transition-colors">
					{i18n.locale === 'fr' ? 'Certifications' : 'Certifications'}
				</h3>
				<p class="mb-4 flex-1 text-sm text-text-muted">
					{i18n.locale === 'fr'
						? 'Vérifie un diplôme candidat en 1 clic sur son code court. Zéro friction.'
						: 'Verify a candidate\'s diploma in 1 click via short code. Zero friction.'}
				</p>
				<span class="text-sm font-semibold text-primary group-hover:underline">
					{i18n.locale === 'fr' ? 'Vérifier un diplôme →' : 'Verify a diploma →'}
				</span>
			</a>

			<!-- Facturation -->
			<a href="/enterprise/credits" class="group flex flex-col rounded-2xl border border-border bg-surface-elevated p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
				<div class="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-xl text-primary">◎</div>
				<h3 class="mb-2 text-lg font-bold group-hover:text-primary transition-colors">
					{i18n.locale === 'fr' ? 'Crédits & facturation' : 'Credits & billing'}
				</h3>
				<p class="mb-4 flex-1 text-sm text-text-muted">
					{i18n.locale === 'fr'
						? 'Achète des crédits, redeem des codes promo, télécharge tes factures PDF SKL-YYYY-NNNNN.'
						: 'Buy credits, redeem promo codes, download SKL-YYYY-NNNNN PDF invoices.'}
				</p>
				<span class="text-sm font-semibold text-primary group-hover:underline">
					{i18n.locale === 'fr' ? 'Mon solde →' : 'My balance →'}
				</span>
			</a>

			<!-- Abonnements Pipeline -->
			<a href="/enterprise/subscriptions" class="group flex flex-col rounded-2xl border border-border bg-surface-elevated p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
				<div class="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-xl text-accent">⧗</div>
				<h3 class="mb-2 text-lg font-bold group-hover:text-primary transition-colors">
					{i18n.locale === 'fr' ? 'Abonnements Pipeline' : 'Pipeline subscriptions'}
				</h3>
				<p class="mb-4 flex-1 text-sm text-text-muted">
					{i18n.locale === 'fr'
						? 'Starter, Growth, Scale. Crédits inclus tous les mois, annulation à tout moment.'
						: 'Starter, Growth, Scale. Credits included monthly, cancel anytime.'}
				</p>
				<span class="text-sm font-semibold text-primary group-hover:underline">
					{i18n.locale === 'fr' ? 'Voir les plans →' : 'See plans →'}
				</span>
			</a>
		</div>
	</div>
</section>
