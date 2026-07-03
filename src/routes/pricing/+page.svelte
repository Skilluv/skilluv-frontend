<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import { onMount } from 'svelte';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import CountrySelect from '$components/ui/CountrySelect.svelte';
	import { pricingApi, type PricingResponse } from '$api/pricing';
	import { SkilluError } from '$api/client';

	let data = $state<PricingResponse | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let selectedCountry = $state<string | null>(null);
	let currencyOverride = $state<string | null>(null);

	// Devise → symbole / formattage court
	const CURRENCY_SYMBOLS: Record<string, string> = {
		EUR: '€', USD: '$', GBP: '£', CHF: 'CHF', CAD: 'C$', AUD: 'A$',
		NGN: '₦', GHS: '₵', EGP: 'E£', ZAR: 'R', KES: 'KSh', UGX: 'USh',
		TZS: 'TSh', RWF: 'FRw', MAD: 'DH', TND: 'TND', DZD: 'DA',
		XOF: 'CFA', XAF: 'FCFA'
	};

	// Popular country → ISO2 shortcuts pour boutons rapides
	const QUICK_COUNTRIES: Array<{ iso2: string; label: string; currency: string }> = [
		{ iso2: 'FR', label: 'France', currency: 'EUR' },
		{ iso2: 'GB', label: 'United Kingdom', currency: 'GBP' },
		{ iso2: 'US', label: 'United States', currency: 'USD' },
		{ iso2: 'NG', label: 'Nigeria', currency: 'NGN' },
		{ iso2: 'SN', label: 'Sénégal', currency: 'XOF' },
		{ iso2: 'CI', label: 'Côte d\'Ivoire', currency: 'XOF' },
		{ iso2: 'CM', label: 'Cameroun', currency: 'XAF' },
		{ iso2: 'MA', label: 'Maroc', currency: 'MAD' },
		{ iso2: 'KE', label: 'Kenya', currency: 'KES' }
	];

	// ISO2 utilisé pour l'API — dérivé du sélecteur pays (ISO3 → ISO2 approximatif)
	// ou d'un quick button.
	let countryIso2 = $state<string | null>(null);

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
			const params: { country?: string; currency?: string } = {};
			if (countryIso2) params.country = countryIso2;
			if (currencyOverride) params.currency = currencyOverride;
			const res = await pricingApi.get(params);
			data = res.data;
		} catch (e) {
			error = e instanceof SkilluError ? e.message : 'Erreur inattendue';
		} finally {
			loading = false;
		}
	}

	function pickQuick(iso2: string, currency: string) {
		countryIso2 = iso2;
		currencyOverride = currency;
		selectedCountry = null;
		void load();
	}

	function resetToDefault() {
		countryIso2 = null;
		currencyOverride = null;
		selectedCountry = null;
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
		<p class="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-accent">
			{i18n.locale === 'fr' ? 'Skilluv Enterprise' : 'Skilluv Enterprise'}
		</p>
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
     SÉLECTEUR PAYS / DEVISE
     ============================================ -->
<section class="border-b border-border bg-surface-elevated/40">
	<div class="mx-auto max-w-6xl px-4 py-10">
		<div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
			<div>
				<p class="mb-2 text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.locale === 'fr' ? 'Pays de facturation' : 'Billing country'}
				</p>
				<h2 class="text-2xl sm:text-3xl font-black tracking-tight">
					{i18n.locale === 'fr' ? 'Devise adaptée à votre marché.' : 'Currency tuned to your market.'}
				</h2>
				<p class="mt-2 max-w-xl text-sm text-text-muted">
					{i18n.locale === 'fr'
						? 'Les prix sont convertis en temps réel depuis les taux de la BCE, avec une marge de 3 %.'
						: 'Prices convert live from ECB rates with a 3% margin.'}
				</p>
			</div>

			{#if data}
				<div class="flex items-center gap-2 rounded-full border border-border bg-surface-overlay px-4 py-2 text-sm">
					<span class="text-text-muted">{i18n.locale === 'fr' ? 'Devise :' : 'Currency:'}</span>
					<span class="font-mono font-bold text-primary">{data.currency}</span>
					{#if data.psp && data.psp !== 'auto'}
						<span class="text-text-muted">·</span>
						<span class="text-xs uppercase tracking-wider text-text-muted">{i18n.locale === 'fr' ? 'via' : 'via'}</span>
						<span class="font-mono text-xs font-bold text-accent">{data.psp}</span>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Quick buttons -->
		<div class="mt-6 flex flex-wrap gap-2">
			{#each QUICK_COUNTRIES as qc}
				<button
					class="inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary
					{countryIso2 === qc.iso2 ? 'border-primary bg-primary/15 text-primary' : ''}"
					onclick={() => pickQuick(qc.iso2, qc.currency)}
				>
					<span class="font-mono text-xs font-bold {countryIso2 === qc.iso2 ? 'text-primary' : 'text-text-muted'}">{qc.iso2}</span>
					{qc.label}
				</button>
			{/each}
			{#if countryIso2 || currencyOverride}
				<button
					class="rounded-full border border-border px-4 py-2 text-sm text-text-muted hover:text-text-primary"
					onclick={resetToDefault}
				>
					{i18n.locale === 'fr' ? '↺ Réinitialiser' : '↺ Reset'}
				</button>
			{/if}
		</div>
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
						<div class="absolute -top-3 left-6">
							<Badge variant="accent" size="md">
								{i18n.locale === 'fr' ? '★ Meilleur ratio' : '★ Best value'}
							</Badge>
						</div>
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
					<p class="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">Pipeline</p>
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
					<p class="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-accent">
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
		<div class="rounded-2xl border-2 border-primary bg-surface-elevated p-6">
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
     FAQ minimaliste
     ============================================ -->
<section class="border-t border-border bg-surface-elevated/40 py-20 sm:py-24">
	<div class="mx-auto max-w-4xl px-4">
		<h2 class="mb-12 text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight">
			{i18n.locale === 'fr' ? 'Questions' : 'Common'}<br />
			<span class="text-accent">{i18n.locale === 'fr' ? 'fréquentes.' : 'questions.'}</span>
		</h2>
		<div class="divide-y divide-border rounded-2xl border border-border bg-surface-elevated">
			{#each [
				{
					fr: { q: 'Le prix change selon mon pays. C\'est normal ?', a: 'Oui. Les prix sont convertis en temps réel depuis les taux de la Banque Centrale Européenne, avec une marge fixe de 3 %. C\'est plus juste pour les marchés locaux.' },
					en: { q: 'The price changes depending on my country. Is that normal?', a: 'Yes. Prices convert live from European Central Bank rates with a fixed 3% margin. It\'s fairer for local markets.' }
				},
				{
					fr: { q: 'Comment se passe le refund ?', a: 'Automatiquement, sur votre solde de crédits. Vous n\'avez rien à faire : dès que le talent décline ou que 30 jours passent sans réponse, 50 % du crédit est recrédité.' },
					en: { q: 'How does the refund work?', a: 'Automatically, on your credit balance. Nothing to do: as soon as the talent declines or 30 days pass with no reply, 50% of the credit is returned.' }
				},
				{
					fr: { q: 'Puis-je payer en franc CFA ou naira ?', a: 'Oui. Nigeria, Ghana et Égypte via Paystack. Sénégal, Côte d\'Ivoire, Cameroun, Maroc, Kenya via Flutterwave. Europe, US, UK, Canada via Stripe.' },
					en: { q: 'Can I pay in CFA franc or naira?', a: 'Yes. Nigeria, Ghana and Egypt via Paystack. Senegal, Ivory Coast, Cameroon, Morocco, Kenya via Flutterwave. Europe, US, UK, Canada via Stripe.' }
				},
				{
					fr: { q: 'Les crédits expirent-ils ?', a: 'Non. Un crédit acheté reste utilisable indéfiniment. Seuls les abonnements Pipeline offrent un renouvellement mensuel automatique.' },
					en: { q: 'Do credits expire?', a: 'No. A purchased credit is usable indefinitely. Only Pipeline subscriptions auto-renew monthly.' }
				},
				{
					fr: { q: 'Facture avec ma TVA ?', a: 'Oui. Chaque paiement génère une facture séquentielle SKL-YYYY-NNNNN téléchargeable en PDF depuis votre espace, avec les mentions légales requises.' },
					en: { q: 'Invoice with my VAT?', a: 'Yes. Every payment generates a sequential SKL-YYYY-NNNNN invoice, downloadable as PDF from your space with all legal mentions.' }
				}
			] as faq}
				{@const t = i18n.locale === 'fr' ? faq.fr : faq.en}
				<details class="group px-6 py-5">
					<summary class="flex cursor-pointer items-center justify-between gap-4 text-left font-semibold marker:hidden [&::-webkit-details-marker]:hidden">
						<span>{t.q}</span>
						<span class="text-accent transition-transform group-open:rotate-45 text-xl">+</span>
					</summary>
					<p class="mt-3 text-sm leading-relaxed text-text-muted">{t.a}</p>
				</details>
			{/each}
		</div>
	</div>
</section>

<!-- ============================================
     FINAL CTA
     ============================================ -->
<section class="mx-auto max-w-4xl px-4 py-24 text-center">
	<h2 class="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight">
		{#if i18n.locale === 'fr'}
			Prêt à recruter<br />
			<span class="text-primary">sur la preuve ?</span>
		{:else}
			Ready to hire<br />
			<span class="text-primary">on proof?</span>
		{/if}
	</h2>
	<p class="mx-auto mt-6 max-w-lg text-lg text-text-muted">
		{i18n.locale === 'fr'
			? 'Créez votre espace en 2 minutes. Aucune carte requise.'
			: 'Create your space in 2 minutes. No credit card required.'}
	</p>
	<div class="mt-8 flex justify-center gap-3">
		<Button variant="accent" size="lg" href={buyHref}>
			{auth.isAuthenticated
				? (i18n.locale === 'fr' ? 'Voir mes crédits' : 'View my credits')
				: (i18n.locale === 'fr' ? 'Créer mon espace' : 'Create my space')}
		</Button>
		<Button variant="ghost" size="lg" href="/for-companies">
			{i18n.locale === 'fr' ? 'En savoir plus' : 'Learn more'}
		</Button>
	</div>
</section>
