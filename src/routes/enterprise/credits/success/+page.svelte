<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import Button from '$components/ui/Button.svelte';
	import { creditsApi, type CreditBalance } from '$api/credits';
	import ParticleBurst from '$components/ui/ParticleBurst.svelte';

	let sessionId = $derived(page.url.searchParams.get('session_id') ?? null);
	let balance = $state<CreditBalance | null>(null);
	let loading = $state(true);
	let burst = $state(false);

	async function pollBalance(maxAttempts = 8) {
		// Le webhook Stripe met parfois quelques secondes à créditer le solde.
		// On poll doucement pour laisser au backend le temps de traiter.
		for (let i = 0; i < maxAttempts; i++) {
			try {
				const res = await creditsApi.getBalance();
				balance = res.data;
				// Si le solde a bougé (recent purchase visible), on stoppe.
				if (i === 0 || parseFloat(res.data.balance) > 0) {
					if (i > 0) burst = true;
					break;
				}
			} catch {
				// silencieux
			}
			await new Promise((r) => setTimeout(r, 1500));
		}
		loading = false;
		// Déclenche le burst d'animation de confetti/particules
		if (!burst) burst = true;
	}

	onMount(() => {
		if (!auth.isAuthenticated) return;
		void pollBalance();
	});
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Merci ! — Skilluv' : 'Thank you! — Skilluv'}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="relative mx-auto flex min-h-[80vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
	{#if burst}
		<div class="pointer-events-none absolute inset-0 flex items-center justify-center">
			<ParticleBurst trigger={burst} count={40} />
		</div>
	{/if}

	<!-- Big check icon -->
	<div class="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-success/15 text-5xl text-success animate-[fragment-burst_600ms_ease-out]">
		✓
	</div>

	<p class="mb-4 text-xs font-bold uppercase tracking-widest text-accent">
		{i18n.locale === 'fr' ? 'Paiement confirmé' : 'Payment confirmed'}
	</p>

	<h1 class="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight">
		{#if i18n.locale === 'fr'}
			Merci.<br />
			<span class="text-primary">Vos crédits sont là.</span>
		{:else}
			Thank you.<br />
			<span class="text-primary">Your credits are here.</span>
		{/if}
	</h1>

	<p class="mt-8 max-w-xl text-lg text-text-muted">
		{i18n.locale === 'fr'
			? 'Votre facture SKL-YYYY-NNNNN est en cours de génération. Vous pouvez déjà consulter votre solde et démarrer votre sourcing.'
			: 'Your SKL-YYYY-NNNNN invoice is being generated. You can already check your balance and start sourcing.'}
	</p>

	<!-- Balance après paiement -->
	<div class="mt-10 rounded-2xl border border-border bg-surface-elevated px-10 py-8 shadow-lg">
		<p class="mb-2 text-xs font-bold uppercase tracking-wider text-text-muted">
			{i18n.locale === 'fr' ? 'Solde actuel' : 'Current balance'}
		</p>
		{#if loading}
			<div class="h-16 w-32 animate-pulse rounded bg-surface-overlay"></div>
		{:else if balance}
			<div class="flex items-baseline justify-center gap-2">
				<span class="text-6xl font-black text-primary">{balance.balance}</span>
				<span class="text-lg text-text-muted">{i18n.locale === 'fr' ? 'crédits' : 'credits'}</span>
			</div>
		{/if}
	</div>

	<div class="mt-10 flex flex-wrap justify-center gap-3">
		<Button variant="accent" size="lg" href="/enterprise/talents">
			{i18n.locale === 'fr' ? 'Rechercher des talents' : 'Search talents'}
		</Button>
		<Button variant="secondary" size="lg" href="/enterprise/credits">
			{i18n.locale === 'fr' ? 'Voir mes crédits' : 'View my credits'}
		</Button>
		<Button variant="ghost" size="lg" href="/enterprise/credits/invoices">
			{i18n.locale === 'fr' ? 'Mes factures' : 'My invoices'}
		</Button>
	</div>

	{#if sessionId}
		<p class="mt-8 font-mono text-xs text-text-muted">
			{i18n.locale === 'fr' ? 'Référence Stripe :' : 'Stripe reference:'} {sessionId.slice(0, 24)}…
		</p>
	{/if}
</div>
