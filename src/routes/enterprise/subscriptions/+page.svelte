<script lang="ts">
	import { onMount } from 'svelte';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import { goto } from '$app/navigation';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import { subscriptionsApi, type EnterpriseSubscription } from '$api/subscriptions';
	import { pricingApi, type PricingSubscription } from '$api/pricing';
	import { toast } from '$stores/toast.svelte';
	import { SkilluError } from '$api/client';

	let current = $state<EnterpriseSubscription | null>(null);
	let plans = $state<PricingSubscription[]>([]);
	let currency = $state('EUR');
	let loading = $state(true);
	let subscribing = $state<string | null>(null);
	let cancelling = $state(false);

	async function load() {
		loading = true;
		try {
			const [subRes, prRes] = await Promise.all([
				subscriptionsApi.current().catch(() => null),
				pricingApi.get().catch(() => null)
			]);
			if (subRes) current = subRes.data.subscription;
			if (prRes) {
				plans = prRes.data.subscriptions;
				currency = prRes.data.currency;
			}
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			loading = false;
		}
	}

	async function subscribe(slug: string) {
		subscribing = slug;
		try {
			const res = await subscriptionsApi.subscribe(slug);
			if (res.data.checkout_url) {
				window.location.href = res.data.checkout_url;
			} else if (res.data.message) {
				toast.info(res.data.message);
				subscribing = null;
			}
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
			subscribing = null;
		}
	}

	async function cancelSub() {
		if (!confirm(i18n.locale === 'fr'
			? 'Annuler à la fin de la période courante ?'
			: 'Cancel at end of current period?')) return;
		cancelling = true;
		try {
			await subscriptionsApi.cancel();
			toast.success(i18n.locale === 'fr' ? 'Résiliation programmée' : 'Cancellation scheduled');
			await load();
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			cancelling = false;
		}
	}

	function fmtPrice(cents: number, curr: string): string {
		const noDec = ['NGN', 'XOF', 'XAF', 'UGX', 'TZS', 'RWF', 'KES', 'GHS'].includes(curr);
		try {
			return new Intl.NumberFormat(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', {
				style: 'currency', currency: curr,
				minimumFractionDigits: noDec ? 0 : 2, maximumFractionDigits: noDec ? 0 : 2
			}).format(cents / 100);
		} catch {
			return `${(cents / 100).toFixed(noDec ? 0 : 2)} ${curr}`;
		}
	}

	function fmtDate(iso: string | null): string {
		if (!iso) return '—';
		return new Intl.DateTimeFormat(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', {
			day: '2-digit', month: 'long', year: 'numeric'
		}).format(new Date(iso));
	}

	function statusMeta(s: string): { label: string; variant: 'success' | 'warning' | 'error' | 'default' } {
		return s === 'active' || s === 'trialing' ? { label: s, variant: 'success' }
			: s === 'past_due' ? { label: s, variant: 'warning' }
			: s === 'canceled' || s === 'unpaid' ? { label: s, variant: 'error' }
			: { label: s, variant: 'default' };
	}

	function planLabel(slug: string): string {
		const clean = slug.replace('pipeline_', '').replace(/_/g, ' ');
		return clean.charAt(0).toUpperCase() + clean.slice(1);
	}

	onMount(() => {
		if (!auth.isAuthenticated) {
			goto('/auth/login?redirect=/enterprise/subscriptions');
			return;
		}
		void load();
	});
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Abonnements — Skilluv Enterprise' : 'Subscriptions — Skilluv Enterprise'}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-10 sm:py-14">
	<nav class="mb-6 flex items-center gap-2 text-sm text-text-muted">
		<a href="/enterprise/dashboard" class="hover:text-text-primary">
			{i18n.locale === 'fr' ? 'Espace entreprise' : 'Enterprise space'}
		</a>
		<span>›</span>
		<span class="text-text-primary">{i18n.locale === 'fr' ? 'Abonnements' : 'Subscriptions'}</span>
	</nav>

	<div class="mb-10">
		<p class="mb-2 text-xs font-bold uppercase tracking-widest text-accent">Pipeline</p>
		<h1 class="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight">
			{i18n.locale === 'fr' ? 'Abonnement mensuel.' : 'Monthly subscription.'}
		</h1>
		<p class="mt-3 max-w-xl text-sm text-text-muted">
			{i18n.locale === 'fr'
				? 'Pour les entreprises qui recrutent en continu. Crédits inclus chaque mois, tarif dégressif, annulation à tout moment.'
				: 'For companies hiring continuously. Credits included monthly, discounted rate, cancel anytime.'}
		</p>
	</div>

	{#if loading}
		<div class="animate-pulse space-y-4">
			<div class="h-32 rounded-2xl bg-surface-elevated"></div>
			<div class="grid gap-4 sm:grid-cols-3">
				{#each Array(3) as _}
					<div class="h-56 rounded-2xl bg-surface-elevated"></div>
				{/each}
			</div>
		</div>
	{:else}
		<!-- Current subscription -->
		{#if current}
			{@const s = statusMeta(current.status)}
			<div class="mb-8 rounded-2xl border border-border bg-surface-elevated p-6 sm:p-8">
					<div class="mb-4 flex items-center gap-2 flex-wrap">
					<Badge variant={s.variant} size="md">{s.label}</Badge>
					{#if current.cancel_at_period_end}
						<Badge variant="warning" size="sm">
							{i18n.locale === 'fr' ? 'Résiliation programmée' : 'Cancellation scheduled'}
						</Badge>
					{/if}
				</div>
				<h2 class="text-3xl sm:text-4xl font-black tracking-tight">
					Pipeline {planLabel(current.plan_slug)}
				</h2>
				<div class="mt-6 grid gap-6 sm:grid-cols-3">
					<div>
						<p class="text-xs font-bold uppercase tracking-wider text-text-muted">
							{i18n.locale === 'fr' ? 'Crédits inclus/mois' : 'Included credits/month'}
						</p>
						<p class="mt-1 text-3xl font-black text-primary">{current.monthly_credit_grant}</p>
					</div>
					<div>
						<p class="text-xs font-bold uppercase tracking-wider text-text-muted">
							{i18n.locale === 'fr' ? 'Période en cours' : 'Current period'}
						</p>
						<p class="mt-1 text-sm">
							{fmtDate(current.current_period_start)}
							<br />
							→ {fmtDate(current.current_period_end)}
						</p>
					</div>
					<div class="sm:text-right">
						{#if !current.cancel_at_period_end && (current.status === 'active' || current.status === 'trialing')}
							<Button variant="ghost" loading={cancelling} onclick={cancelSub}>
								{i18n.locale === 'fr' ? 'Résilier' : 'Cancel'}
							</Button>
						{/if}
					</div>
				</div>
			</div>
		{/if}

		<!-- Available plans -->
		{#if plans.length}
			<div class="mb-6 flex items-end justify-between">
				<div>
					<p class="mb-1 text-xs font-bold uppercase tracking-widest text-accent">
						{i18n.locale === 'fr' ? 'Plans' : 'Plans'}
					</p>
					<h2 class="text-3xl font-black tracking-tight">
						{current
							? (i18n.locale === 'fr' ? 'Changer de plan.' : 'Change plan.')
							: (i18n.locale === 'fr' ? 'Choisir un plan.' : 'Choose a plan.')}
					</h2>
				</div>
				<a href="/pricing" class="text-sm underline hover:text-primary">
					{i18n.locale === 'fr' ? 'Comparer avec crédits →' : 'Compare with credits →'}
				</a>
			</div>

			<div class="grid gap-5 sm:grid-cols-3">
				{#each plans as p, i}
					{@const isCurrent = current?.plan_slug === p.slug}
					{@const isBest = i === 1}
					<article class="flex flex-col rounded-2xl border {isBest ? 'border-accent' : isCurrent ? 'border-primary' : 'border-border'} bg-surface-elevated p-6 relative">
						{#if isBest && !isCurrent}
							<div class="absolute -top-3 left-6">
								<Badge variant="accent" size="md">★ {i18n.locale === 'fr' ? 'Recommandé' : 'Recommended'}</Badge>
							</div>
						{/if}
						{#if isCurrent}
							<div class="absolute -top-3 left-6">
								<Badge variant="primary" size="md">
									{i18n.locale === 'fr' ? 'Plan actuel' : 'Current plan'}
								</Badge>
							</div>
						{/if}

						<div class="mb-2 font-mono text-xs uppercase tracking-wider text-text-muted">
							Pipeline
						</div>
						<h3 class="text-xl font-black tracking-tight">{planLabel(p.slug)}</h3>

						<div class="mt-4 mb-4">
							<div class="text-3xl font-black tracking-tight">
								{fmtPrice(p.price_cents, currency)}
							</div>
							<div class="text-xs text-text-muted">/ {i18n.locale === 'fr' ? 'mois' : 'month'}</div>
						</div>

						<div class="mb-6 flex-1 rounded-xl border border-border bg-surface-overlay p-4 text-center">
							<div class="text-2xl font-black text-primary">{p.credits_included}</div>
							<div class="text-xs uppercase tracking-wider text-text-muted">
								{i18n.locale === 'fr' ? 'crédits/mois' : 'credits/month'}
							</div>
						</div>

						<Button
							variant={isBest ? 'accent' : 'primary'}
							loading={subscribing === p.slug}
							disabled={isCurrent || subscribing !== null}
							onclick={() => subscribe(p.slug)}
						>
							{isCurrent
								? (i18n.locale === 'fr' ? 'Plan actuel' : 'Current')
								: (i18n.locale === 'fr' ? 'Souscrire' : 'Subscribe')}
						</Button>
					</article>
				{/each}
			</div>
		{/if}
	{/if}
</div>
