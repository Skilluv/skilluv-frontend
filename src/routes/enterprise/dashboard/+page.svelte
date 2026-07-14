<script lang="ts">
	import { enterpriseApi } from '$api/enterprise';
	import { creditsApi, type CreditBalance } from '$api/credits';
	import { subscriptionsApi, type EnterpriseSubscription } from '$api/subscriptions';
	import { kycApi, type KycStatusResponse } from '$api/kyc';
	import { notificationsApi } from '$api/notifications';
	import { auth } from '$stores/auth.svelte';
	import { SkilluError } from '$api/client';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import { i18n } from '$lib/i18n';
	import type { Notification } from '$lib/types';
	import {
		Wallet,
		ShieldCheck,
		ShieldAlert,
		Repeat,
		Bell,
		Users as UsersIcon,
		Bookmark,
		List,
		Mail,
		MessageSquare,
		AlertTriangle,
		ArrowRight,
		BadgeCheck,
		Building2
	} from '@lucide/svelte';

	let platformStats = $state<{
		total_talents: number;
		by_domain: Record<string, number>;
		by_title: Record<string, number>;
		avg_fragments: number;
		active_last_30d: number;
	} | null>(null);

	let myStats = $state<{
		bookmarks: number;
		talent_lists: number;
		interest_requests: { total: number; pending: number; accepted: number; declined: number };
		active_conversations: number;
		team_size: number;
	} | null>(null);

	// New widgets state — each has its own guard because a stale KYC / no
	// subscription is a valid empty state and shouldn't crash the whole
	// dashboard load.
	let creditBalance = $state<CreditBalance | null>(null);
	let subscription = $state<EnterpriseSubscription | null>(null);
	let kyc = $state<KycStatusResponse | null>(null);
	let recentNotifs = $state<Notification[]>([]);

	let loading = $state(true);
	let error = $state('');

	// Owner-only widgets — recruiters don't have visibility on KYC or
	// subscription management.
	let isOwner = $derived(auth.user?.role === 'enterprise');

	$effect(() => {
		loadDashboard();
	});

	async function loadDashboard() {
		loading = true;
		error = '';
		// Chaque call est catch séparément : si l'endpoint credits renvoie
		// une erreur (compte trop récent, KYC absent…), on continue de
		// rendre le reste du dashboard plutôt que de tout casser.
		const [pRes, mRes, cRes, sRes, kRes, nRes] = await Promise.all([
			enterpriseApi.platformStats().catch(() => null),
			enterpriseApi.myStats().catch(() => null),
			creditsApi.getBalance().catch(() => null),
			subscriptionsApi.current().catch(() => null),
			isOwner ? kycApi.getStatus().catch(() => null) : Promise.resolve(null),
			notificationsApi.list({ read: false, per_page: 3 }).catch(() => null)
		]);

		if (pRes) platformStats = pRes.data;
		if (mRes) myStats = mRes.data;
		if (cRes) creditBalance = cRes.data;
		if (sRes) subscription = sRes.data.subscription;
		if (kRes) kyc = kRes.data;
		if (nRes) recentNotifs = nRes.data.slice(0, 3);

		if (!pRes && !mRes) {
			error = i18n.t('errors.generic');
		}
		loading = false;
	}

	// Petits helpers d'affichage.
	function parseBalance(b: string | undefined): number {
		if (!b) return 0;
		const n = parseFloat(b);
		return Number.isFinite(n) ? n : 0;
	}

	function fmtDate(iso: string | null): string {
		if (!iso) return '—';
		return new Intl.DateTimeFormat(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		}).format(new Date(iso));
	}

	function relativeTime(iso: string): string {
		const diff = Date.now() - new Date(iso).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return i18n.locale === 'fr' ? "à l'instant" : 'just now';
		if (mins < 60) return `${mins} min`;
		const hrs = Math.floor(mins / 60);
		if (hrs < 24) return `${hrs} h`;
		const days = Math.floor(hrs / 24);
		return `${days} j`;
	}

	// Seuil arbitraire : sous 5 crédits on affiche une alerte "solde faible".
	// À ajuster si le pricing des interest requests change.
	const LOW_CREDIT_THRESHOLD = 5;
	let balanceValue = $derived(parseBalance(creditBalance?.balance));
	let lowCredits = $derived(creditBalance !== null && balanceValue < LOW_CREDIT_THRESHOLD);

	let kycNeedsAttention = $derived(
		kyc !== null && (kyc.status === 'pending' || kyc.status === 'rejected')
	);

	let subscriptionCanceled = $derived(subscription?.cancel_at_period_end === true);
	let subscriptionPastDue = $derived(subscription?.status === 'past_due');
</script>

<svelte:head>
	<title>{i18n.t('enterprise.dashboard.title')} — Skilluv</title>
</svelte:head>

<div class="p-6 lg:p-8">
	<h1 class="mb-2 text-2xl font-bold">{i18n.t('enterprise.dashboard.title')}</h1>
	<p class="mb-8 text-text-muted">{i18n.t('enterprise.dashboard.subtitle')}</p>

	{#if loading}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{#each Array(8) as _}
				<Skeleton class="h-24 w-full" rounded="xl" />
			{/each}
		</div>
	{:else if error && !myStats && !platformStats}
		<p class="text-text-muted">{error}</p>
	{:else}
		<!-- ═══════════ Bannières d'alerte (si nécessaire) ═══════════ -->
		{#if kycNeedsAttention || lowCredits || subscriptionPastDue}
			<div class="mb-8 flex flex-col gap-3">
				{#if kycNeedsAttention && kyc}
					<a
						href="/enterprise/kyc"
						class="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm transition-colors hover:bg-warning/15"
					>
						<AlertTriangle size={20} strokeWidth={2} class="mt-0.5 shrink-0 text-warning" />
						<div class="flex-1">
							<p class="font-semibold text-warning">
								{kyc.status === 'rejected'
									? (i18n.locale === 'fr' ? 'KYC refusé' : 'KYC rejected')
									: (i18n.locale === 'fr' ? 'KYC en cours de vérification' : 'KYC under review')}
							</p>
							<p class="text-text-muted">
								{kyc.status === 'rejected'
									? (i18n.locale === 'fr'
										? 'Consultez le motif et reprenez la procédure.'
										: 'Check the rejection reason and re-submit.')
									: (i18n.locale === 'fr'
										? 'Certaines actions restent bloquées tant que la validation n\'est pas terminée.'
										: 'Some actions stay locked until the review is complete.')}
							</p>
						</div>
						<ArrowRight size={16} strokeWidth={2} class="mt-0.5 shrink-0 text-warning" />
					</a>
				{/if}

				{#if lowCredits}
					<a
						href="/enterprise/credits"
						class="flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm transition-colors hover:bg-accent/15"
					>
						<Wallet size={20} strokeWidth={2} class="mt-0.5 shrink-0 text-accent" />
						<div class="flex-1">
							<p class="font-semibold text-accent">
								{i18n.locale === 'fr' ? 'Solde de crédits faible' : 'Low credit balance'}
							</p>
							<p class="text-text-muted">
								{i18n.locale === 'fr'
									? `Il vous reste ${balanceValue.toFixed(1)} crédit(s). Rechargez pour continuer à contacter des talents.`
									: `You have ${balanceValue.toFixed(1)} credit(s) left. Top up to keep reaching out to talents.`}
							</p>
						</div>
						<ArrowRight size={16} strokeWidth={2} class="mt-0.5 shrink-0 text-accent" />
					</a>
				{/if}

				{#if subscriptionPastDue}
					<a
						href="/enterprise/subscriptions"
						class="flex items-start gap-3 rounded-xl border border-error/30 bg-error/10 p-4 text-sm transition-colors hover:bg-error/15"
					>
						<AlertTriangle size={20} strokeWidth={2} class="mt-0.5 shrink-0 text-error" />
						<div class="flex-1">
							<p class="font-semibold text-error">
								{i18n.locale === 'fr' ? 'Paiement en retard' : 'Payment past due'}
							</p>
							<p class="text-text-muted">
								{i18n.locale === 'fr'
									? "Régularisez votre moyen de paiement pour éviter la suspension de l'abonnement."
									: 'Update your payment method to avoid subscription suspension.'}
							</p>
						</div>
						<ArrowRight size={16} strokeWidth={2} class="mt-0.5 shrink-0 text-error" />
					</a>
				{/if}
			</div>
		{/if}

		<!-- ═══════════ Solde & abonnement ═══════════ -->
		<h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-text-muted">
			{i18n.locale === 'fr' ? 'Compte & solde' : 'Account & balance'}
		</h2>
		<div class="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<!-- Credits balance -->
			<a
				href="/enterprise/credits"
				class="group flex flex-col justify-between rounded-xl border border-border bg-surface-elevated p-5 transition-colors hover:border-primary/40"
			>
				<div class="mb-3 flex items-center justify-between">
					<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
						<Wallet size={18} strokeWidth={2} />
					</div>
					<ArrowRight size={16} strokeWidth={2} class="text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
				</div>
				<p class="text-xs text-text-muted">
					{i18n.locale === 'fr' ? 'Solde de crédits' : 'Credit balance'}
				</p>
				<p class="mt-1 text-2xl font-bold {lowCredits ? 'text-accent' : ''}">
					{creditBalance ? balanceValue.toFixed(1) : '—'}
				</p>
				{#if creditBalance}
					<p class="mt-1 text-xs text-text-muted">
						{i18n.locale === 'fr' ? 'Utilisés' : 'Used'}: {parseBalance(creditBalance.total_used).toFixed(0)}
					</p>
				{/if}
			</a>

			<!-- Subscription -->
			<a
				href="/enterprise/subscriptions"
				class="group flex flex-col justify-between rounded-xl border border-border bg-surface-elevated p-5 transition-colors hover:border-primary/40"
			>
				<div class="mb-3 flex items-center justify-between">
					<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
						<Repeat size={18} strokeWidth={2} />
					</div>
					<ArrowRight size={16} strokeWidth={2} class="text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
				</div>
				<p class="text-xs text-text-muted">
					{i18n.locale === 'fr' ? 'Abonnement' : 'Subscription'}
				</p>
				{#if subscription}
					<p class="mt-1 text-2xl font-bold capitalize">
						{subscription.plan_slug.replace(/[-_]/g, ' ')}
					</p>
					<div class="mt-1 flex items-center gap-2 text-xs text-text-muted">
						<Badge
							variant={subscription.status === 'active'
								? 'success'
								: subscription.status === 'past_due'
									? 'error'
									: 'default'}
							size="sm"
						>
							{subscription.status}
						</Badge>
						{#if subscriptionCanceled && subscription.current_period_end}
							<span>{i18n.locale === 'fr' ? 'jusqu\'au' : 'until'} {fmtDate(subscription.current_period_end)}</span>
						{/if}
					</div>
				{:else}
					<p class="mt-1 text-lg font-medium text-text-muted">
						{i18n.locale === 'fr' ? 'Aucun abonnement' : 'No subscription'}
					</p>
					<p class="mt-1 text-xs text-text-muted">
						{i18n.locale === 'fr' ? 'Pay-as-you-go' : 'Pay-as-you-go'}
					</p>
				{/if}
			</a>

			<!-- KYC status (owner only) or Team size fallback -->
			{#if isOwner && kyc}
				<a
					href="/enterprise/kyc"
					class="group flex flex-col justify-between rounded-xl border border-border bg-surface-elevated p-5 transition-colors hover:border-primary/40"
				>
					<div class="mb-3 flex items-center justify-between">
						<div class="flex h-9 w-9 items-center justify-center rounded-lg {kyc.status === 'approved' ? 'bg-success/10 text-success' : kyc.status === 'rejected' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'}">
							{#if kyc.status === 'approved'}
								<ShieldCheck size={18} strokeWidth={2} />
							{:else}
								<ShieldAlert size={18} strokeWidth={2} />
							{/if}
						</div>
						<ArrowRight size={16} strokeWidth={2} class="text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
					</div>
					<p class="text-xs text-text-muted">KYC</p>
					<p class="mt-1 text-2xl font-bold">
						{#if kyc.status === 'approved'}
							{i18n.locale === 'fr' ? 'Validé' : 'Approved'}
						{:else if kyc.status === 'pending'}
							{i18n.locale === 'fr' ? 'En attente' : 'Pending'}
						{:else if kyc.status === 'rejected'}
							{i18n.locale === 'fr' ? 'Refusé' : 'Rejected'}
						{:else}
							{i18n.locale === 'fr' ? 'À faire' : 'To do'}
						{/if}
					</p>
					<p class="mt-1 text-xs text-text-muted capitalize">
						{i18n.locale === 'fr' ? 'Niveau' : 'Level'}: {kyc.level}
					</p>
				</a>
			{:else if myStats}
				<a
					href="/enterprise/members"
					class="group flex flex-col justify-between rounded-xl border border-border bg-surface-elevated p-5 transition-colors hover:border-primary/40"
				>
					<div class="mb-3 flex items-center justify-between">
						<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
							<Building2 size={18} strokeWidth={2} />
						</div>
						<ArrowRight size={16} strokeWidth={2} class="text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
					</div>
					<p class="text-xs text-text-muted">
						{i18n.locale === 'fr' ? 'Équipe' : 'Team'}
					</p>
					<p class="mt-1 text-2xl font-bold">{myStats.team_size}</p>
					<p class="mt-1 text-xs text-text-muted">
						{i18n.locale === 'fr' ? 'membre(s) actif(s)' : 'active member(s)'}
					</p>
				</a>
			{/if}
		</div>

		<!-- ═══════════ Mon activité ═══════════ -->
		{#if myStats}
			<h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-text-muted">{i18n.t('enterprise.dashboard.myActivity')}</h2>
			<div class="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<a href="/enterprise/bookmarks" class="group rounded-xl border border-border bg-surface-elevated p-4 transition-colors hover:border-primary/40">
					<div class="mb-2 flex items-center gap-2 text-text-muted">
						<Bookmark size={14} strokeWidth={2} />
						<p class="text-xs">{i18n.t('enterprise.dashboard.bookmarks')}</p>
					</div>
					<p class="text-2xl font-bold">{myStats.bookmarks}</p>
				</a>
				<a href="/enterprise/lists" class="group rounded-xl border border-border bg-surface-elevated p-4 transition-colors hover:border-primary/40">
					<div class="mb-2 flex items-center gap-2 text-text-muted">
						<List size={14} strokeWidth={2} />
						<p class="text-xs">{i18n.t('enterprise.dashboard.lists')}</p>
					</div>
					<p class="text-2xl font-bold">{myStats.talent_lists}</p>
				</a>
				<div class="rounded-xl border border-border bg-surface-elevated p-4">
					<div class="mb-2 flex items-center gap-2 text-text-muted">
						<Mail size={14} strokeWidth={2} />
						<p class="text-xs">{i18n.t('enterprise.dashboard.interests')}</p>
					</div>
					<p class="text-2xl font-bold">{myStats.interest_requests.total}</p>
					<div class="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-text-muted">
						<span class="text-warning">{myStats.interest_requests.pending} {i18n.t('enterprise.dashboard.pending')}</span>
						<span class="text-success">{myStats.interest_requests.accepted} {i18n.t('enterprise.dashboard.accepted')}</span>
						<span class="text-error">{myStats.interest_requests.declined} {i18n.locale === 'fr' ? 'déclinées' : 'declined'}</span>
					</div>
				</div>
				<a href="/enterprise/messages" class="group rounded-xl border border-border bg-surface-elevated p-4 transition-colors hover:border-primary/40">
					<div class="mb-2 flex items-center gap-2 text-text-muted">
						<MessageSquare size={14} strokeWidth={2} />
						<p class="text-xs">{i18n.t('enterprise.dashboard.conversations')}</p>
					</div>
					<p class="text-2xl font-bold">{myStats.active_conversations}</p>
				</a>
			</div>
		{/if}

		<!-- ═══════════ Notifications récentes ═══════════ -->
		{#if recentNotifs.length > 0}
			<div class="mb-8">
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-sm font-semibold uppercase tracking-wider text-text-muted">
						{i18n.locale === 'fr' ? 'Notifications récentes' : 'Recent notifications'}
					</h2>
					<a href="/notifications" class="inline-flex items-center gap-1 text-sm underline hover:text-primary">
						{i18n.locale === 'fr' ? 'Tout voir' : 'View all'}
						<ArrowRight size={14} strokeWidth={2} />
					</a>
				</div>
				<div class="rounded-xl border border-border bg-surface-elevated divide-y divide-border">
					{#each recentNotifs as n}
						<a
							href="/notifications"
							class="flex items-start gap-3 p-4 transition-colors hover:bg-surface-overlay"
						>
							<div class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
								<Bell size={14} strokeWidth={2} />
							</div>
							<div class="min-w-0 flex-1">
								<p class="text-sm font-medium truncate">{n.title}</p>
								{#if n.body}
									<p class="text-xs text-text-muted line-clamp-1">{n.body}</p>
								{/if}
							</div>
							<span class="shrink-0 text-xs text-text-muted">{relativeTime(n.created_at)}</span>
						</a>
					{/each}
				</div>
			</div>
		{/if}

		<!-- ═══════════ Plateforme ═══════════ -->
		{#if platformStats}
			{@const totalByTitle = Object.values(platformStats.by_title).reduce((a, b) => a + b, 0)}
			{@const totalByDomain = Object.values(platformStats.by_domain).reduce((a, b) => a + b, 0)}
			<h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-text-muted">{i18n.t('enterprise.dashboard.platform')}</h2>

			<!-- 3 stats simples -->
			<div class="mb-4 grid gap-4 sm:grid-cols-3">
				<div class="rounded-xl border border-border bg-surface-elevated p-4">
					<div class="mb-2 flex items-center gap-2 text-text-muted">
						<UsersIcon size={14} strokeWidth={2} />
						<p class="text-xs">{i18n.t('enterprise.dashboard.totalTalents')}</p>
					</div>
					<p class="text-2xl font-bold">{platformStats.total_talents.toLocaleString()}</p>
				</div>
				<div class="rounded-xl border border-border bg-surface-elevated p-4">
					<div class="mb-2 flex items-center gap-2 text-text-muted">
						<BadgeCheck size={14} strokeWidth={2} />
						<p class="text-xs">{i18n.t('enterprise.dashboard.active30d')}</p>
					</div>
					<p class="text-2xl font-bold">{platformStats.active_last_30d.toLocaleString()}</p>
				</div>
				<div class="rounded-xl border border-border bg-surface-elevated p-4">
					<p class="text-xs text-text-muted">{i18n.t('enterprise.dashboard.avgFragments')}</p>
					<p class="mt-1 text-2xl font-bold">{Math.round(platformStats.avg_fragments)}</p>
				</div>
			</div>

			<!-- 2 breakdowns richer : par domaine et par niveau -->
			<div class="mb-8 grid gap-4 sm:grid-cols-2">
				<!-- By domain — barres proportionnelles -->
				<div class="rounded-xl border border-border bg-surface-elevated p-5">
					<p class="mb-3 text-xs font-bold uppercase tracking-wider text-text-muted">
						{i18n.t('enterprise.dashboard.byDomain')}
					</p>
					<div class="space-y-2.5">
						{#each Object.entries(platformStats.by_domain) as [domain, count]}
							{@const pct = totalByDomain > 0 ? Math.round((count / totalByDomain) * 100) : 0}
							<div>
								<div class="mb-1 flex items-center justify-between text-xs">
									<span class="font-medium">{i18n.t(`common.domains.${domain}`)}</span>
									<span class="text-text-muted tabular-nums">{count.toLocaleString()} · {pct}%</span>
								</div>
								<div class="h-1.5 w-full overflow-hidden rounded-full bg-surface-overlay">
									<div class="h-full bg-primary" style="width: {pct}%"></div>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- By title — même vis, palette accent pour distinguer -->
				<div class="rounded-xl border border-border bg-surface-elevated p-5">
					<p class="mb-3 text-xs font-bold uppercase tracking-wider text-text-muted">
						{i18n.locale === 'fr' ? 'Par niveau' : 'By level'}
					</p>
					<div class="space-y-2.5">
						{#each ['apprenti', 'artisan', 'maitre', 'legende'] as title}
							{@const count = platformStats.by_title[title] ?? 0}
							{@const pct = totalByTitle > 0 ? Math.round((count / totalByTitle) * 100) : 0}
							<div>
								<div class="mb-1 flex items-center justify-between text-xs">
									<span class="font-medium">{i18n.t(`common.titles.${title}`)}</span>
									<span class="text-text-muted tabular-nums">{count.toLocaleString()} · {pct}%</span>
								</div>
								<div class="h-1.5 w-full overflow-hidden rounded-full bg-surface-overlay">
									<div class="h-full bg-accent" style="width: {pct}%"></div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}

		<!-- ═══════════ Actions rapides ═══════════ -->
		<h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-text-muted">
			{i18n.locale === 'fr' ? 'Actions rapides' : 'Quick actions'}
		</h2>
		<div class="flex flex-wrap gap-3">
			<Button variant="accent" href="/enterprise/talents">{i18n.t('enterprise.dashboard.searchTalents')}</Button>
			<Button variant="secondary" href="/enterprise/bookmarks">{i18n.t('enterprise.dashboard.viewBookmarks')}</Button>
			<Button variant="secondary" href="/enterprise/bounties/new">
				{i18n.locale === 'fr' ? 'Poster une bounty' : 'Post a bounty'}
			</Button>
			{#if isOwner}
				<Button variant="secondary" href="/enterprise/members">
					{i18n.locale === 'fr' ? 'Inviter un recruteur' : 'Invite a recruiter'}
				</Button>
			{/if}
			<Button variant="secondary" href="/enterprise/credits">
				{i18n.locale === 'fr' ? 'Crédits & facturation' : 'Credits & billing'}
			</Button>
		</div>
	{/if}
</div>
