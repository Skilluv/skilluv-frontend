<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import { onMount } from 'svelte';
	import Button from '$components/ui/Button.svelte';
	import CtaSection from '$components/landing/CtaSection.svelte';
	import FaqSection from '$components/landing/FaqSection.svelte';
	import Select from '$components/ui/Select.svelte';
	import { pricingApi, type PricingResponse } from '$api/pricing';
	import { SkilluError } from '$api/client';

	let data = $state<PricingResponse | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let currencyOverride = $state<string>('EUR');

	// Devise → symbole / formattage court
	const CURRENCY_SYMBOLS: Record<string, string> = {
		EUR: '€', USD: '$', GBP: '£', CHF: 'CHF', CAD: 'C$', AUD: 'A$',
		NGN: '₦', GHS: '₵', EGP: 'E£', ZAR: 'R', KES: 'KSh', UGX: 'USh',
		TZS: 'TSh', RWF: 'FRw', MAD: 'DH', TND: 'TND', DZD: 'DA',
		XOF: 'CFA', XAF: 'FCFA'
	};

	// Devises proposées dans le select
	const CURRENCY_OPTIONS: Array<{ value: string; label: string }> = [
		{ value: 'EUR', label: 'EUR — Euro (€)' },
		{ value: 'USD', label: 'USD — US Dollar ($)' },
		{ value: 'GBP', label: 'GBP — British Pound (£)' },
		{ value: 'CHF', label: 'CHF — Swiss Franc' },
		{ value: 'CAD', label: 'CAD — Canadian Dollar (C$)' },
		{ value: 'XOF', label: 'XOF — Franc CFA BCEAO' },
		{ value: 'XAF', label: 'XAF — Franc CFA BEAC' },
		{ value: 'NGN', label: 'NGN — Nigerian Naira (₦)' },
		{ value: 'GHS', label: 'GHS — Ghanaian Cedi (₵)' },
		{ value: 'MAD', label: 'MAD — Moroccan Dirham' },
		{ value: 'KES', label: 'KES — Kenyan Shilling' },
		{ value: 'ZAR', label: 'ZAR — South African Rand' }
	];

	function fmt(amount: number, currency: string): string {
		const sym = CURRENCY_SYMBOLS[currency] ?? currency;
		// Devises "grosses" (NGN, XOF, XAF, UGX...) sans décimales
		const zeroDecimal = ['NGN', 'XOF', 'XAF', 'UGX', 'TZS', 'RWF', 'KES', 'GHS'];
		const noDec = zeroDecimal.includes(currency);
		try {
			return new Intl.NumberFormat(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', {
				style: 'currency',
				currency,
				minimumFractionDigits: noDec ? 0 : 2,
				maximumFractionDigits: noDec ? 0 : 2
			}).format(amount);
		} catch {
			return `${amount.toFixed(noDec ? 0 : 2)} ${sym}`;
		}
	}

	async function load() {
		loading = true;
		error = null;
		try {
			const res = await pricingApi.get({ currency: currencyOverride });
			data = res.data;
		} catch (e) {
			error = e instanceof SkilluError ? e.message : 'Erreur inattendue';
		} finally {
			loading = false;
		}
	}

	function onCurrencyChange(v: string) {
		currencyOverride = v;
		void load();
	}

	onMount(() => {
		void load();
	});

	let buyHref = $derived(auth.isAuthenticated ? '/enterprise/credits' : '/enterprise/register');

	function ctaLabel(slug: string, credits: number) {
		if (i18n.locale === 'fr') return `Acheter ${credits} crédit${credits > 1 ? 's' : ''}`;
		return `Buy ${credits} credit${credits > 1 ? 's' : ''}`;
	}

	// Meilleur pack (per_credit le plus bas) = "recommandé"
	let bestPack = $derived.by(() => {
		if (!data?.packs.length) return null;
		return [...data.packs].sort((a, b) => a.per_credit - b.per_credit)[0].slug;
	});
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Tarifs — Skilluv' : 'Pricing — Skilluv'}</title>
	<meta
		name="description"
		content={i18n.locale === 'fr'
			? 'Tarifs Skilluv Enterprise. Crédits pour contacter les talents. Prix en euros, dollars, XOF, NGN, MAD et plus.'
			: 'Skilluv Enterprise pricing. Credits to reach talents. Prices in euros, dollars, XOF, NGN, MAD and more.'}
	/>
</svelte:head>

<!-- ============================================
     HERO — Grand titre éditorial
     ============================================ -->
<section class="relative overflow-hidden border-b border-border">
	<div
		aria-hidden="true"
		class="pointer-events-none absolute inset-x-0 -top-20 h-[100vh] opacity-[0.04]"
		style="background-image: linear-gradient(var(--sk-text) 1px, transparent 1px), linear-gradient(90deg, var(--sk-text) 1px, transparent 1px); background-size: 60px 60px; mask-image: linear-gradient(to bottom, black 70%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, black 70%, transparent 100%);"
	></div>
	<div class="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
		<h1 class="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black leading-[1.05] tracking-tight">
			{#if i18n.locale === 'fr'}
				Un crédit.<br />
				<span class="text-primary">Un talent contacté.</span>
			{:else}
				One credit.<br />
				<span class="text-primary">One talent reached.</span>
			{/if}
		</h1>
		<p class="mt-8 max-w-2xl text-lg text-text-muted">
			{i18n.locale === 'fr'
				? "Payez à l'usage. Aucun abonnement caché. Refund automatique de 50 % si le talent décline ou ne répond pas. Prix ajustés à votre pays."
				: 'Pay-as-you-go. No hidden subscription. Automatic 50% refund if the talent declines or doesn\'t reply. Prices adjusted to your country.'}
		</p>
	</div>
</section>

<!-- ============================================
     SÉLECTEUR DEVISE
     ============================================ -->
<section class="border-b border-border bg-surface-elevated/40">
	<div class="mx-auto max-w-6xl px-4 py-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<p class="mb-1 text-xs font-bold uppercase tracking-wider text-text-muted">
				{i18n.locale === 'fr' ? 'Devise' : 'Currency'}
			</p>
			<h2 class="text-xl sm:text-2xl font-black tracking-tight">
				{i18n.locale === 'fr' ? 'Affichez les prix dans votre devise.' : 'Show prices in your currency.'}
			</h2>
		</div>
		<Select
			items={CURRENCY_OPTIONS}
			bind:value={currencyOverride}
			onchange={onCurrencyChange}
			class="w-full sm:w-auto sm:min-w-[240px]"
		/>
	</div>
</section>

<!-- ============================================
     GRILLE DES PACKS
     ============================================ -->
<section class="mx-auto max-w-6xl px-4 py-20 sm:py-24">
	<h2 class="mb-12 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight">
		{i18n.locale === 'fr' ? 'Choisissez votre' : 'Choose your'}<br />
		<span class="text-accent">{i18n.locale === 'fr' ? 'pack de crédits.' : 'credit pack.'}</span>
	</h2>

	{#if loading}
		<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
			{#each Array(4) as _}
				<div class="animate-pulse rounded-2xl border border-border bg-surface-elevated p-6">
					<div class="mb-4 h-8 w-16 rounded bg-surface-overlay"></div>
					<div class="mb-2 h-12 w-32 rounded bg-surface-overlay"></div>
					<div class="mb-6 h-4 w-20 rounded bg-surface-overlay"></div>
					<div class="h-10 rounded-full bg-surface-overlay"></div>
				</div>
			{/each}
		</div>
	{:else if error}
		<div class="rounded-2xl border border-error/30 bg-error/10 p-6 text-center">
			<p class="text-error">{error}</p>
			<button class="mt-4 text-sm underline" onclick={load}>
				{i18n.locale === 'fr' ? 'Réessayer' : 'Retry'}
			</button>
		</div>
	{:else if data && data.packs.length}
		<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
			{#each data.packs as pack}
				{@const isBest = pack.slug === bestPack && data.packs.length > 1}
				<article
					class="group relative rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl
					{isBest ? 'border-accent bg-surface-elevated' : 'border-border bg-surface-elevated hover:border-primary/40'}"
				>
					{#if isBest}
						<span class="absolute -top-3 left-6 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-fg shadow-sm ring-4 ring-surface">
							<span aria-hidden="true">★</span>
							{i18n.locale === 'fr' ? 'Meilleur ratio' : 'Best value'}
						</span>
					{/if}

					<div class="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-lg text-primary">
						{pack.credits === 1 ? '◎' : pack.credits <= 5 ? '◈' : pack.credits <= 20 ? '⬢' : '★'}
					</div>

					<div class="mb-1 font-mono text-xs uppercase tracking-wider text-text-muted">
						{i18n.locale === 'fr' ? `${pack.credits} crédit${pack.credits > 1 ? 's' : ''}` : `${pack.credits} credit${pack.credits > 1 ? 's' : ''}`}
					</div>

					<div class="mb-1 text-3xl font-black tracking-tight">
						{fmt(pack.price, data.currency)}
					</div>

					<div class="mb-6 text-xs text-text-muted">
						{fmt(pack.per_credit, data.currency)} / {i18n.locale === 'fr' ? 'crédit' : 'credit'}
					</div>

					<Button variant={isBest ? 'accent' : 'primary'} href={buyHref}>
						{ctaLabel(pack.slug, pack.credits)}
					</Button>
				</article>
			{/each}
		</div>

		<!-- Subscriptions row (Pipeline Starter/Growth/Scale) -->
		{#if data.subscriptions.length}
			<div class="mt-16">
				<div class="mb-8">
					<p class="mb-2 text-xs font-bold uppercase tracking-widest text-accent">Pipeline</p>
					<h3 class="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
						{i18n.locale === 'fr' ? 'Abonnements récurrents.' : 'Recurring subscriptions.'}
					</h3>
					<p class="mt-3 max-w-xl text-sm text-text-muted">
						{i18n.locale === 'fr'
							? 'Pour les entreprises qui recrutent en continu. Crédits inclus chaque mois, tarif dégressif.'
							: 'For companies hiring continuously. Credits included each month, discounted rate.'}
					</p>
				</div>
				<div class="grid gap-5 sm:grid-cols-3">
					{#each data.subscriptions as sub}
						<article class="rounded-2xl border border-border bg-surface-elevated p-6">
							<div class="mb-1 font-mono text-xs uppercase tracking-wider text-text-muted">
								{sub.slug.replace(/_/g, ' ').replace('pipeline', '').trim()}
							</div>
							<div class="mb-1 text-2xl font-black tracking-tight">
								{fmt(sub.price, data.currency)}
								<span class="text-xs font-normal text-text-muted">/ {i18n.locale === 'fr' ? 'mois' : 'month'}</span>
							</div>
							<div class="mb-4 text-xs text-text-muted">
								{sub.credits_included} {i18n.locale === 'fr' ? 'crédits inclus' : 'credits included'}
							</div>
							<Button variant="secondary" href={buyHref}>
								{i18n.locale === 'fr' ? 'S\'abonner' : 'Subscribe'}
							</Button>
						</article>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</section>

<!-- ============================================
     REFUND POLICY — bloc éditorial
     ============================================ -->
{#if data}
	<section class="border-y border-border bg-surface-elevated/40 py-20 sm:py-24">
		<div class="mx-auto max-w-6xl px-4">
			<div class="grid gap-12 lg:grid-cols-2 lg:items-center">
				<div>
					<p class="mb-4 text-xs font-bold uppercase tracking-widest text-accent">
						{i18n.locale === 'fr' ? 'Politique de refund' : 'Refund policy'}
					</p>
					<h2 class="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight">
						{i18n.locale === 'fr' ? 'Vous ne payez que' : 'You only pay for'}<br />
						<span class="text-primary">{i18n.locale === 'fr' ? 'les vraies rencontres.' : 'real matches.'}</span>
					</h2>
					<p class="mt-6 max-w-xl text-base text-text-muted">
						{i18n.locale === 'fr'
							? "Un talent décline ou ne répond pas dans les 30 jours ? On vous rembourse automatiquement 50 % du crédit dépensé. Vous n'avez rien à demander."
							: "Talent declines or doesn't reply within 30 days? We automatically refund 50% of the spent credit. No action required."}
					</p>
				</div>
				<div class="space-y-3">
					<div class="flex items-start gap-4 rounded-2xl border border-border bg-surface-elevated p-5">
						<div class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">◎</div>
						<div>
							<p class="text-xs font-bold uppercase tracking-wider text-text-muted">
								{i18n.locale === 'fr' ? 'Talent décline' : 'Talent declines'}
							</p>
							<p class="mt-1 text-base">
								<span class="text-2xl font-black text-primary">{Math.round(data.refund_policy.refused * 100)} %</span>
								<span class="text-text-muted">{i18n.locale === 'fr' ? ' remboursé immédiatement' : ' refunded immediately'}</span>
							</p>
						</div>
					</div>
					<div class="flex items-start gap-4 rounded-2xl border border-border bg-surface-elevated p-5">
						<div class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">⧗</div>
						<div>
							<p class="text-xs font-bold uppercase tracking-wider text-text-muted">
								{i18n.locale === 'fr'
									? `Pas de réponse après ${data.refund_policy.timeout_days} jours`
									: `No reply after ${data.refund_policy.timeout_days} days`}
							</p>
							<p class="mt-1 text-base">
								<span class="text-2xl font-black text-accent">{Math.round(data.refund_policy.timeout_refund * 100)} %</span>
								<span class="text-text-muted">{i18n.locale === 'fr' ? ' remboursé automatiquement' : ' refunded automatically'}</span>
							</p>
						</div>
					</div>
					<div class="flex items-start gap-4 rounded-2xl border border-border bg-surface-elevated p-5">
						<div class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">✓</div>
						<div>
							<p class="text-xs font-bold uppercase tracking-wider text-text-muted">
								{i18n.locale === 'fr' ? 'Le talent accepte' : 'Talent accepts'}
							</p>
							<p class="mt-1 text-sm text-text-muted">
								{i18n.locale === 'fr'
									? 'Le crédit est consommé, la conversation s\'ouvre.'
									: 'Credit is consumed, the conversation opens.'}
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
{/if}

<!-- ============================================
     COMPARAISON — Skilluv vs Classique
     ============================================ -->
<section class="mx-auto max-w-6xl px-4 py-20 sm:py-24">
	<h2 class="mb-12 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight">
		{i18n.locale === 'fr' ? 'Classique' : 'Classic'}<br />
		<span class="text-accent">{i18n.locale === 'fr' ? 'vs Skilluv.' : 'vs Skilluv.'}</span>
	</h2>
	<div class="grid gap-4 sm:grid-cols-2">
		<div class="rounded-2xl border border-border bg-surface-elevated p-6">
			<p class="mb-4 text-xs font-bold uppercase tracking-wider text-text-muted line-through decoration-error/50">
				{i18n.locale === 'fr' ? 'Sites de recrutement classiques' : 'Classic recruiting platforms'}
			</p>
			<ul class="space-y-3 text-sm">
				<li class="flex gap-2"><span class="text-error">✗</span> {i18n.locale === 'fr' ? 'Abonnement mensuel obligatoire (500€+/mois)' : 'Mandatory monthly subscription (€500+/month)'}</li>
				<li class="flex gap-2"><span class="text-error">✗</span> {i18n.locale === 'fr' ? 'Payer même sans candidat contacté' : 'Pay even without contacting anyone'}</li>
				<li class="flex gap-2"><span class="text-error">✗</span> {i18n.locale === 'fr' ? 'Aucun refund si le candidat ignore' : 'No refund if candidate ignores you'}</li>
				<li class="flex gap-2"><span class="text-error">✗</span> {i18n.locale === 'fr' ? 'CVs autodéclarés, non prouvés' : 'Self-declared, unproven resumes'}</li>
				<li class="flex gap-2"><span class="text-error">✗</span> {i18n.locale === 'fr' ? 'Prix en euros uniquement' : 'Euros-only pricing'}</li>
			</ul>
		</div>
		<div class="rounded-2xl border border-border bg-surface-elevated p-6">
			<p class="mb-4 text-xs font-bold uppercase tracking-wider text-primary">Skilluv</p>
			<ul class="space-y-3 text-sm">
				<li class="flex gap-2"><span class="text-success">✓</span> {i18n.locale === 'fr' ? 'Pay-as-you-go. Aucun abonnement caché.' : 'Pay-as-you-go. No hidden subscription.'}</li>
				<li class="flex gap-2"><span class="text-success">✓</span> {i18n.locale === 'fr' ? 'Vous ne payez que les tentatives réelles' : 'You only pay for real attempts'}</li>
				<li class="flex gap-2"><span class="text-success">✓</span> {i18n.locale === 'fr' ? 'Refund automatique 50 % si décline ou timeout' : 'Automatic 50% refund on decline or timeout'}</li>
				<li class="flex gap-2"><span class="text-success">✓</span> {i18n.locale === 'fr' ? 'Profils alimentés par des soumissions évaluées' : 'Profiles fed by graded submissions'}</li>
				<li class="flex gap-2"><span class="text-success">✓</span> {i18n.locale === 'fr' ? 'Prix locaux : EUR, USD, NGN, XOF, MAD…' : 'Local prices: EUR, USD, NGN, XOF, MAD…'}</li>
			</ul>
		</div>
	</div>
</section>

<!-- ============================================
     FAQ — FaqSection réutilisé
     ============================================ -->
<FaqSection
	items={i18n.locale === 'fr'
		? [
			{ q: 'Comment se passe le refund ?', a: 'Automatiquement, sur votre solde de crédits. Vous n\'avez rien à faire : dès que le talent décline ou que 30 jours passent sans réponse, 50 % du crédit est recrédité.' },
			{ q: 'Puis-je payer en franc CFA ou naira ?', a: 'Oui. Nous acceptons les paiements en EUR, USD, GBP, XOF, XAF, NGN, GHS, MAD, KES et d\'autres devises locales. Sélectionnez la vôtre en haut de la page pour afficher les prix correspondants.' },
			{ q: 'Les crédits expirent-ils ?', a: 'Non. Un crédit acheté reste utilisable indéfiniment. Seuls les abonnements Pipeline offrent un renouvellement mensuel automatique.' },
			{ q: 'Facture avec ma TVA ?', a: 'Oui. Chaque paiement génère une facture séquentielle SKL-YYYY-NNNNN téléchargeable en PDF depuis votre espace, avec les mentions légales requises.' }
		]
		: [
			{ q: 'How does the refund work?', a: 'Automatically, on your credit balance. Nothing to do: as soon as the talent declines or 30 days pass with no reply, 50% of the credit is returned.' },
			{ q: 'Can I pay in CFA franc or naira?', a: 'Yes. We accept payments in EUR, USD, GBP, XOF, XAF, NGN, GHS, MAD, KES and other local currencies. Pick yours at the top of the page to see matching prices.' },
			{ q: 'Do credits expire?', a: 'No. A purchased credit is usable indefinitely. Only Pipeline subscriptions auto-renew monthly.' },
			{ q: 'Invoice with my VAT?', a: 'Yes. Every payment generates a sequential SKL-YYYY-NNNNN invoice, downloadable as PDF from your space with all legal mentions.' }
		]}
/>

<!-- ============================================
     FINAL CTA — CtaSection réutilisé (comme /for-companies)
     ============================================ -->
<CtaSection
	title={i18n.locale === 'fr' ? 'Prêt à recruter' : 'Ready to hire'}
	accent={i18n.locale === 'fr' ? 'sur la preuve ?' : 'on proof?'}
	description={i18n.locale === 'fr'
		? 'Créez votre espace entreprise gratuitement. Aucune carte bancaire requise.'
		: 'Create your enterprise space for free. No credit card required.'}
	ctaHref={buyHref}
	ctaLabel={auth.isAuthenticated
		? (i18n.locale === 'fr' ? 'Voir mes crédits' : 'View my credits')
		: (i18n.locale === 'fr' ? 'Créer mon espace entreprise' : 'Create my enterprise space')}
>
	{#snippet secondary()}
		<Button
			variant="ghost"
			size="lg"
			href="/for-companies"
			onclick={() => requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' }))}
		>
			{i18n.locale === 'fr' ? 'En savoir plus' : 'Learn more'}
		</Button>
	{/snippet}
</CtaSection>
