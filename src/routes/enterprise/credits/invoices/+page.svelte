<script lang="ts">
	import { onMount } from 'svelte';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import { goto } from '$app/navigation';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import SegmentedControl from '$components/ui/SegmentedControl.svelte';
	import FilterBar from '$components/ui/FilterBar.svelte';
	import { invoicesApi, type Invoice } from '$api/invoices';
	import { toast } from '$stores/toast.svelte';
	import { SkilluError } from '$api/client';

	let invoices = $state<Invoice[]>([]);
	let loading = $state(true);
	let selectedYear = $state<number | 'all'>('all');

	// Devise → symbole court
	const CURRENCY_SYMBOLS: Record<string, string> = {
		EUR: '€', USD: '$', GBP: '£', NGN: '₦', GHS: '₵', EGP: 'E£',
		ZAR: 'R', KES: 'KSh', MAD: 'DH', XOF: 'CFA', XAF: 'FCFA'
	};

	function fmtAmount(cents: number, currency: string): string {
		const amount = cents / 100;
		const sym = CURRENCY_SYMBOLS[currency] ?? currency;
		try {
			return new Intl.NumberFormat(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', {
				style: 'currency',
				currency,
				minimumFractionDigits: 2
			}).format(amount);
		} catch {
			return `${amount.toFixed(2)} ${sym}`;
		}
	}

	function fmtDate(iso: string): string {
		const d = new Date(iso);
		return new Intl.DateTimeFormat(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		}).format(d);
	}

	async function load() {
		loading = true;
		try {
			const params: { per_page: number; year?: number } = { per_page: 100 };
			if (selectedYear !== 'all') params.year = selectedYear;
			const res = await invoicesApi.list(params);
			invoices = res.data.invoices;
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			loading = false;
		}
	}

	async function downloadPdf(inv: Invoice) {
		// Le backend renvoie un PDF via /enterprise/invoices/{id}/pdf.
		// On ouvre dans une nouvelle fenêtre pour laisser le navigateur gérer le download.
		const url = invoicesApi.pdfUrl(inv.id);
		window.open(url, '_blank', 'noopener,noreferrer');
	}

	// Regroupement par année, tri décroissant
	let byYear = $derived.by(() => {
		const map = new Map<number, Invoice[]>();
		for (const inv of invoices) {
			const y = new Date(inv.issued_at).getFullYear();
			if (!map.has(y)) map.set(y, []);
			map.get(y)!.push(inv);
		}
		return [...map.entries()].sort((a, b) => b[0] - a[0]);
	});

	let availableYears = $derived.by(() => {
		const s = new Set<number>();
		for (const inv of invoices) s.add(new Date(inv.issued_at).getFullYear());
		return [...s].sort((a, b) => b - a);
	});

	let totalTTC = $derived.by(() => {
		if (!invoices.length) return { amount: 0, currency: 'EUR' };
		const currency = invoices[0].currency ?? 'EUR';
		let sum = 0;
		for (const inv of invoices) sum += inv.amount_ttc_cents;
		return { amount: sum, currency };
	});

	onMount(() => {
		if (!auth.isAuthenticated) {
			goto('/auth/login?redirect=/enterprise/credits/invoices');
			return;
		}
		void load();
	});
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Factures — Skilluv Enterprise' : 'Invoices — Skilluv Enterprise'}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-10 sm:py-14">
	<!-- Breadcrumb -->
	<nav class="mb-6 flex items-center gap-2 text-sm text-text-muted">
		<a href="/enterprise/dashboard" class="hover:text-text-primary">
			{i18n.locale === 'fr' ? 'Espace entreprise' : 'Enterprise space'}
		</a>
		<span>›</span>
		<a href="/enterprise/credits" class="hover:text-text-primary">
			{i18n.locale === 'fr' ? 'Crédits' : 'Credits'}
		</a>
		<span>›</span>
		<span class="text-text-primary">{i18n.locale === 'fr' ? 'Factures' : 'Invoices'}</span>
	</nav>

	<!-- Header -->
	<div class="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
		<div>
			<p class="mb-2 text-xs font-bold uppercase tracking-widest text-accent">
				{i18n.locale === 'fr' ? 'Documents' : 'Documents'}
			</p>
			<h1 class="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight">
				{i18n.locale === 'fr' ? 'Vos factures.' : 'Your invoices.'}
			</h1>
			<p class="mt-3 max-w-xl text-sm text-text-muted">
				{i18n.locale === 'fr'
					? 'Numérotation séquentielle SKL-YYYY-NNNNN conforme aux mentions légales françaises. PDF téléchargeables 10 ans.'
					: 'Sequential SKL-YYYY-NNNNN numbering compliant with French legal mentions. PDFs downloadable for 10 years.'}
			</p>
		</div>
		{#if !loading && invoices.length}
			<div class="rounded-2xl border border-border bg-surface-elevated px-5 py-3">
				<p class="text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.locale === 'fr' ? 'Total TTC' : 'Total incl. VAT'}
				</p>
				<p class="text-2xl font-black text-primary">{fmtAmount(totalTTC.amount, totalTTC.currency)}</p>
			</div>
		{/if}
	</div>

	<!-- Year filter -->
	{#if availableYears.length > 1}
		<FilterBar class="mb-6">
			<SegmentedControl
				size="sm"
				items={[
					{ value: 'all', label: i18n.locale === 'fr' ? 'Toutes' : 'All' },
					...availableYears.map((y) => ({ value: y, label: String(y) }))
				]}
				bind:value={selectedYear}
				onchange={() => void load()}
			/>
		</FilterBar>
	{/if}

	{#if loading}
		<div class="space-y-2">
			{#each Array(5) as _}
				<div class="animate-pulse rounded-xl border border-border bg-surface-elevated p-4 h-20"></div>
			{/each}
		</div>
	{:else if invoices.length === 0}
		<div class="rounded-2xl border border-border bg-surface-elevated p-12 text-center">
			<div class="mb-4 text-5xl text-text-muted">◈</div>
			<p class="mb-2 text-lg font-semibold">
				{i18n.locale === 'fr' ? 'Aucune facture pour l\'instant' : 'No invoices yet'}
			</p>
			<p class="mb-6 text-sm text-text-muted">
				{i18n.locale === 'fr'
					? 'Elles apparaîtront ici automatiquement après chaque achat de crédits.'
					: 'They will appear here automatically after each credit purchase.'}
			</p>
			<Button variant="accent" href="/enterprise/credits">
				{i18n.locale === 'fr' ? 'Acheter des crédits' : 'Buy credits'}
			</Button>
		</div>
	{:else}
		<div class="space-y-10">
			{#each byYear as [year, list]}
				<section>
					<div class="mb-4 flex items-baseline justify-between border-b border-border pb-2">
						<h2 class="text-2xl font-black tracking-tight">{year}</h2>
						<span class="text-xs font-mono text-text-muted">
							{list.length} {list.length > 1 ? (i18n.locale === 'fr' ? 'factures' : 'invoices') : (i18n.locale === 'fr' ? 'facture' : 'invoice')}
						</span>
					</div>
					<div class="divide-y divide-border rounded-2xl border border-border bg-surface-elevated overflow-hidden">
						{#each list as inv}
							<div class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
								<!-- Invoice number -->
								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-2">
										<span class="font-mono text-sm font-bold text-primary">{inv.invoice_number}</span>
										<Badge variant="success" size="sm">
											{i18n.locale === 'fr' ? 'Réglée' : 'Paid'}
										</Badge>
									</div>
									<p class="mt-1 truncate text-sm text-text-muted">
										{inv.description ?? (i18n.locale === 'fr' ? 'Achat de crédits' : 'Credit purchase')}
									</p>
									<p class="mt-0.5 text-xs font-mono text-text-muted">{fmtDate(inv.issued_at)}</p>
								</div>

								<!-- Amounts -->
								<div class="text-right shrink-0 pr-4">
									<div class="text-xs text-text-muted">
										{i18n.locale === 'fr' ? 'HT' : 'Net'} {fmtAmount(inv.amount_ht_cents, inv.currency)}
										{#if inv.amount_tva_cents > 0}
											· TVA {inv.tva_rate_pct.toFixed(1)}%
										{/if}
									</div>
									<div class="font-mono font-black text-lg">
										{fmtAmount(inv.amount_ttc_cents, inv.currency)}
									</div>
								</div>

								<!-- Actions -->
								<div class="flex gap-2 shrink-0">
									<button
										onclick={() => downloadPdf(inv)}
										class="inline-flex h-9 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium hover:border-primary hover:text-primary transition-colors"
										title={i18n.locale === 'fr' ? 'Télécharger PDF' : 'Download PDF'}
									>
										<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
											<path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
										</svg>
										PDF
									</button>
								</div>
							</div>
						{/each}
					</div>
				</section>
			{/each}
		</div>
	{/if}

	<!-- Legal footer -->
	<div class="mt-14 rounded-2xl border border-border bg-surface-elevated/40 p-6">
		<div class="grid gap-6 sm:grid-cols-3">
			<div>
				<p class="mb-2 text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.locale === 'fr' ? 'Numérotation' : 'Numbering'}
				</p>
				<p class="text-sm">
					<span class="font-mono font-bold">SKL-YYYY-NNNNN</span>
					<br />
					<span class="text-text-muted">
						{i18n.locale === 'fr' ? 'Séquentielle, sans trou' : 'Sequential, no gap'}
					</span>
				</p>
			</div>
			<div>
				<p class="mb-2 text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.locale === 'fr' ? 'Conservation' : 'Retention'}
				</p>
				<p class="text-sm">
					<span class="font-bold">10 {i18n.locale === 'fr' ? 'ans' : 'years'}</span>
					<br />
					<span class="text-text-muted">
						{i18n.locale === 'fr' ? 'Conforme obligation légale' : 'Legal compliance'}
					</span>
				</p>
			</div>
			<div>
				<p class="mb-2 text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.locale === 'fr' ? 'Support' : 'Support'}
				</p>
				<a href="mailto:billing@skilluv.com" class="text-sm underline hover:text-primary">
					billing@skilluv.com
				</a>
			</div>
		</div>
	</div>
</div>
