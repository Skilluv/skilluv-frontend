<script lang="ts">
	import { onMount } from 'svelte';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import { goto } from '$app/navigation';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import { creditsApi, type CreditBalance, type CreditTransaction } from '$api/credits';
	import { pricingApi, type PricingResponse } from '$api/pricing';
	import { toast } from '$stores/toast.svelte';
	import { SkilluError } from '$api/client';

	let balance = $state<CreditBalance | null>(null);
	let transactions = $state<CreditTransaction[]>([]);
	let pricing = $state<PricingResponse | null>(null);
	let loading = $state(true);
	let purchasing = $state<string | null>(null);
	let promoCode = $state('');
	let promoBusy = $state(false);

	// Reason → label + icône + variant Badge
	const REASON_META: Record<string, { icon: string; variant: 'success' | 'error' | 'accent' | 'primary' | 'default'; fr: string; en: string }> = {
		purchase: { icon: '↑', variant: 'success', fr: 'Achat', en: 'Purchase' },
		spend_interest_request: { icon: '↓', variant: 'default', fr: 'Contact talent', en: 'Talent contact' },
		refund_refused: { icon: '↺', variant: 'accent', fr: 'Refund (décliné)', en: 'Refund (declined)' },
		refund_timeout: { icon: '↺', variant: 'accent', fr: 'Refund (timeout)', en: 'Refund (timeout)' },
		refund_admin: { icon: '↺', variant: 'accent', fr: 'Refund admin', en: 'Admin refund' },
		admin_grant: { icon: '★', variant: 'primary', fr: 'Bonus admin', en: 'Admin grant' },
		signup_bonus: { icon: '★', variant: 'primary', fr: 'Bonus inscription', en: 'Signup bonus' },
		promo_code: { icon: '★', variant: 'primary', fr: 'Code promo', en: 'Promo code' },
		subscription_grant: { icon: '↑', variant: 'success', fr: 'Abonnement mensuel', en: 'Monthly subscription' },
		spend_bounty_escrow: { icon: '⬢', variant: 'default', fr: 'Bounty séquestre', en: 'Bounty escrow' },
		spend_bounty_payout: { icon: '⬢', variant: 'default', fr: 'Bounty payée', en: 'Bounty payout' },
		refund_bounty_cancelled: { icon: '↺', variant: 'accent', fr: 'Bounty annulée', en: 'Bounty cancelled' }
	};

	async function loadAll() {
		loading = true;
		try {
			const [balRes, txRes, prRes] = await Promise.all([
				creditsApi.getBalance().catch(() => null),
				creditsApi.getTransactions({ per_page: 20 }).catch(() => null),
				pricingApi.get().catch(() => null)
			]);
			if (balRes) balance = balRes.data;
			if (txRes) transactions = txRes.data.transactions;
			if (prRes) pricing = prRes.data;
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur de chargement');
		} finally {
			loading = false;
		}
	}

	async function buyPack(slug: string) {
		purchasing = slug;
		try {
			const res = await creditsApi.createCheckout(slug);
			// Redirect vers Stripe Checkout
			window.location.href = res.data.checkout_url;
		} catch (e) {
			purchasing = null;
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		}
	}

	async function submitPromo(e: SubmitEvent) {
		e.preventDefault();
		const code = promoCode.trim();
		if (!code || promoBusy) return;
		promoBusy = true;
		try {
			const res = await creditsApi.redeemPromo(code);
			toast.success(
				i18n.locale === 'fr'
					? `+${res.data.credits_added} crédits ajoutés !`
					: `+${res.data.credits_added} credits added!`
			);
			promoCode = '';
			await loadAll();
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			promoBusy = false;
		}
	}

	async function openPortal() {
		try {
			const res = await creditsApi.openBillingPortal();
			window.location.href = res.data.portal_url;
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		}
	}

	function fmtDate(iso: string): string {
		const d = new Date(iso);
		return new Intl.DateTimeFormat(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(d);
	}

	function reasonMeta(reason: string) {
		return (
			REASON_META[reason] ?? {
				icon: '·',
				variant: 'default' as const,
				fr: reason,
				en: reason
			}
		);
	}

	function fmtDelta(delta: string): string {
		const n = parseFloat(delta);
		const sign = n >= 0 ? '+' : '';
		return `${sign}${n}`;
	}

	onMount(() => {
		if (!auth.isAuthenticated) {
			goto('/auth/login?redirect=/enterprise/credits');
			return;
		}
		void loadAll();
	});
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Crédits — Skilluv Enterprise' : 'Credits — Skilluv Enterprise'}</title>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-10 sm:py-14">
	<!-- Breadcrumb -->
	<nav class="mb-6 flex items-center gap-2 text-sm text-text-muted">
		<a href="/enterprise/dashboard" class="hover:text-text-primary">
			{i18n.locale === 'fr' ? 'Espace entreprise' : 'Enterprise space'}
		</a>
		<span>›</span>
		<span class="text-text-primary">{i18n.locale === 'fr' ? 'Crédits' : 'Credits'}</span>
	</nav>

	<!-- Header -->
	<div class="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
		<div>
			<p class="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">Skilluv Enterprise</p>
			<h1 class="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight">
				{i18n.locale === 'fr' ? 'Vos crédits.' : 'Your credits.'}
			</h1>
			<p class="mt-3 max-w-xl text-sm text-text-muted">
				{i18n.locale === 'fr'
					? 'Chaque crédit = un talent contacté. Refund automatique 50 % si décliné ou sans réponse à 30 jours.'
					: 'Each credit = one talent reached. Automatic 50% refund if declined or no reply after 30 days.'}
			</p>
		</div>
		<a href="/enterprise/credits/invoices" class="text-sm underline hover:text-primary">
			{i18n.locale === 'fr' ? 'Factures →' : 'Invoices →'}
		</a>
	</div>

	<!-- Big balance display -->
	{#if loading && !balance}
		<div class="mb-10 h-40 animate-pulse rounded-2xl border border-border bg-surface-elevated"></div>
	{:else if balance}
		<div class="mb-10 grid gap-4 sm:grid-cols-3">
			<div class="sm:col-span-2 rounded-2xl border border-border bg-gradient-to-br from-surface-elevated via-surface-elevated to-primary/5 p-8 relative overflow-hidden">
				<div
					aria-hidden="true"
					class="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-primary/10 blur-3xl"
				></div>
				<p class="mb-2 text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.locale === 'fr' ? 'Solde disponible' : 'Available balance'}
				</p>
				<div class="flex items-baseline gap-3">
					<span class="text-6xl sm:text-7xl font-black tracking-tight text-primary">{balance.balance}</span>
					<span class="text-lg text-text-muted">
						{i18n.locale === 'fr' ? 'crédits' : 'credits'}
					</span>
				</div>
				<p class="mt-4 text-xs font-mono text-text-muted">
					{i18n.locale === 'fr' ? 'Mise à jour :' : 'Updated:'} {fmtDate(balance.updated_at)}
				</p>
			</div>

			<div class="rounded-2xl border border-border bg-surface-elevated p-6">
				<div class="mb-4">
					<p class="text-xs font-bold uppercase tracking-wider text-text-muted">
						{i18n.locale === 'fr' ? 'Total acheté' : 'Total purchased'}
					</p>
					<p class="text-2xl font-black">{balance.total_purchased}</p>
				</div>
				<div class="mb-4">
					<p class="text-xs font-bold uppercase tracking-wider text-text-muted">
						{i18n.locale === 'fr' ? 'Total dépensé' : 'Total spent'}
					</p>
					<p class="text-2xl font-black">{balance.total_used}</p>
				</div>
				<div>
					<p class="text-xs font-bold uppercase tracking-wider text-text-muted">
						{i18n.locale === 'fr' ? 'Total remboursé' : 'Total refunded'}
					</p>
					<p class="text-2xl font-black text-accent">{balance.total_refunded}</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Quick buy packs -->
	{#if pricing && pricing.packs.length}
		<section class="mb-14">
			<div class="mb-6 flex items-end justify-between">
				<div>
					<p class="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-accent">
						{i18n.locale === 'fr' ? 'Recharger' : 'Top up'}
					</p>
					<h2 class="text-3xl sm:text-4xl font-black tracking-tight">
						{i18n.locale === 'fr' ? 'Ajoutez des crédits.' : 'Add credits.'}
					</h2>
				</div>
				<a href="/pricing" class="text-sm underline hover:text-primary">
					{i18n.locale === 'fr' ? 'Voir tous les tarifs →' : 'See all pricing →'}
				</a>
			</div>

			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{#each pricing.packs as pack}
					<article
						class="rounded-2xl border border-border bg-surface-elevated p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
					>
						<div class="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-lg text-primary">
							{pack.credits === 1 ? '◎' : pack.credits <= 5 ? '◈' : pack.credits <= 20 ? '⬢' : '★'}
						</div>
						<div class="mb-1 font-mono text-xs uppercase tracking-wider text-text-muted">
							{pack.credits} {i18n.locale === 'fr' ? 'crédit' : 'credit'}{pack.credits > 1 ? 's' : ''}
						</div>
						<div class="mb-4 text-2xl font-black tracking-tight">
							{pack.price.toFixed(pricing.currency === 'EUR' || pricing.currency === 'USD' ? 2 : 0)}
							<span class="text-sm text-text-muted">{pricing.currency}</span>
						</div>
						<Button
							variant="primary"
							size="sm"
							loading={purchasing === pack.slug}
							disabled={purchasing !== null}
							onclick={() => buyPack(pack.slug)}
						>
							{i18n.locale === 'fr' ? 'Acheter' : 'Buy'}
						</Button>
					</article>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Promo code + Billing portal side by side -->
	<div class="mb-14 grid gap-6 lg:grid-cols-2">
		<div class="rounded-2xl border border-border bg-surface-elevated p-6">
			<div class="mb-4 flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-lg text-accent">★</div>
				<div>
					<p class="text-xs font-bold uppercase tracking-wider text-text-muted">
						{i18n.locale === 'fr' ? 'Code promo' : 'Promo code'}
					</p>
					<h3 class="text-base font-semibold">
						{i18n.locale === 'fr' ? 'Un cadeau ?' : 'A gift?'}
					</h3>
				</div>
			</div>
			<form onsubmit={submitPromo} class="flex gap-2">
				<input
					type="text"
					bind:value={promoCode}
					placeholder={i18n.locale === 'fr' ? 'SKILLUV-2026' : 'SKILLUV-2026'}
					class="flex-1 rounded-full border border-border bg-surface-overlay px-4 py-2 text-sm font-mono uppercase placeholder:text-text-muted focus:border-primary focus:outline-none"
					disabled={promoBusy}
				/>
				<Button loading={promoBusy} disabled={!promoCode.trim()}>
					{i18n.locale === 'fr' ? 'Valider' : 'Redeem'}
				</Button>
			</form>
		</div>

		<div class="rounded-2xl border border-border bg-surface-elevated p-6">
			<div class="mb-4 flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-lg text-primary">◈</div>
				<div>
					<p class="text-xs font-bold uppercase tracking-wider text-text-muted">
						{i18n.locale === 'fr' ? 'Facturation' : 'Billing'}
					</p>
					<h3 class="text-base font-semibold">
						{i18n.locale === 'fr' ? 'Gérer paiement & abo' : 'Manage payment & sub'}
					</h3>
				</div>
			</div>
			<p class="mb-4 text-sm text-text-muted">
				{i18n.locale === 'fr'
					? 'Mettre à jour votre carte, télécharger vos reçus Stripe, résilier votre abonnement.'
					: 'Update card, download Stripe receipts, cancel your subscription.'}
			</p>
			<Button variant="secondary" onclick={openPortal}>
				{i18n.locale === 'fr' ? 'Ouvrir le portail Stripe' : 'Open Stripe portal'}
			</Button>
		</div>
	</div>

	<!-- Transactions -->
	<section>
		<div class="mb-6 flex items-end justify-between">
			<div>
				<p class="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-accent">
					{i18n.locale === 'fr' ? 'Historique' : 'History'}
				</p>
				<h2 class="text-3xl sm:text-4xl font-black tracking-tight">
					{i18n.locale === 'fr' ? 'Vos mouvements.' : 'Your movements.'}
				</h2>
			</div>
			<a href="/enterprise/credits/invoices" class="text-sm underline hover:text-primary">
				{i18n.locale === 'fr' ? 'Voir les factures →' : 'See invoices →'}
			</a>
		</div>

		{#if loading}
			<div class="space-y-2">
				{#each Array(6) as _}
					<div class="animate-pulse rounded-xl border border-border bg-surface-elevated p-4 h-16"></div>
				{/each}
			</div>
		{:else if transactions.length === 0}
			<div class="rounded-2xl border border-border bg-surface-elevated p-12 text-center">
				<div class="mb-3 text-4xl text-text-muted">◎</div>
				<p class="text-text-muted">
					{i18n.locale === 'fr' ? 'Aucun mouvement pour l\'instant.' : 'No movements yet.'}
				</p>
			</div>
		{:else}
			<div class="divide-y divide-border rounded-2xl border border-border bg-surface-elevated overflow-hidden">
				{#each transactions as tx}
					{@const meta = reasonMeta(tx.reason)}
					{@const delta = parseFloat(tx.delta)}
					<div class="flex items-center gap-4 p-4">
						<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-overlay text-lg">
							{meta.icon}
						</div>
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2">
								<span class="font-medium truncate">
									{i18n.locale === 'fr' ? meta.fr : meta.en}
								</span>
								<Badge variant={meta.variant} size="sm">
									{tx.reason.replace(/_/g, ' ')}
								</Badge>
							</div>
							{#if tx.notes}
								<p class="mt-0.5 truncate text-xs text-text-muted">{tx.notes}</p>
							{/if}
							<p class="mt-0.5 text-xs font-mono text-text-muted">{fmtDate(tx.created_at)}</p>
						</div>
						<div class="text-right">
							<div class="font-mono font-black text-lg {delta >= 0 ? 'text-success' : 'text-text-primary'}">
								{fmtDelta(tx.delta)}
							</div>
							<div class="text-xs text-text-muted">
								{i18n.locale === 'fr' ? 'solde' : 'balance'} {tx.balance_after}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</section>
</div>
