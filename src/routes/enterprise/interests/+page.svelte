<script lang="ts">
	import { onMount } from 'svelte';
	import { i18n } from '$lib/i18n';
	import { contactApi } from '$api/contact';
	import { SkilluError } from '$api/client';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import SegmentedControl from '$components/ui/SegmentedControl.svelte';
	import Pagination from '$components/ui/Pagination.svelte';
	import type { InterestRequest, InterestStatus } from '$lib/types';
	import { Mail, Clock, Check, X, Inbox, ArrowRight } from '@lucide/svelte';

	// Filtre local — l'API renvoie tous les statuts, on filtre côté client
	// pour éviter un round-trip supplémentaire à chaque changement d'onglet.
	type Filter = 'all' | InterestStatus;

	let requests = $state<InterestRequest[]>([]);
	let filter = $state<Filter>('all');
	let page = $state(1);
	let totalPages = $state(1);
	let total = $state(0);
	const perPage = 20;

	let loading = $state(true);
	let error = $state('');

	onMount(() => void load());

	async function load() {
		loading = true;
		error = '';
		try {
			const res = await contactApi.sentInterests(page, perPage);
			requests = res.data;
			totalPages = res.pagination.total_pages ?? 1;
			total = res.pagination.total ?? res.data.length;
		} catch (e) {
			error = e instanceof SkilluError ? e.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	// Compte par statut — utilisé dans les labels du SegmentedControl. Ces
	// compteurs sont sur la page courante, pas globaux. Pour un chiffre
	// vraiment global il faudrait un endpoint dédié — dashboard.my_stats
	// donne déjà les totaux si l'user veut la vue d'ensemble.
	let counts = $derived({
		all: requests.length,
		pending: requests.filter((r) => r.status === 'pending').length,
		accepted: requests.filter((r) => r.status === 'accepted').length,
		declined: requests.filter((r) => r.status === 'declined').length
	});

	let visible = $derived(
		filter === 'all' ? requests : requests.filter((r) => r.status === filter)
	);

	let filterItems = $derived([
		{ value: 'all' as Filter, label: `${i18n.locale === 'fr' ? 'Tout' : 'All'} (${counts.all})` },
		{ value: 'pending' as Filter, label: `${i18n.locale === 'fr' ? 'En attente' : 'Pending'} (${counts.pending})` },
		{ value: 'accepted' as Filter, label: `${i18n.locale === 'fr' ? 'Acceptées' : 'Accepted'} (${counts.accepted})` },
		{ value: 'declined' as Filter, label: `${i18n.locale === 'fr' ? 'Déclinées' : 'Declined'} (${counts.declined})` }
	]);

	function statusMeta(s: InterestStatus): {
		icon: typeof Check;
		variant: 'warning' | 'success' | 'error';
		label: string;
	} {
		const fr: Record<InterestStatus, string> = {
			pending: 'En attente',
			accepted: 'Acceptée',
			declined: 'Déclinée'
		};
		const en: Record<InterestStatus, string> = {
			pending: 'Pending',
			accepted: 'Accepted',
			declined: 'Declined'
		};
		const label = (i18n.locale === 'fr' ? fr : en)[s];
		if (s === 'accepted') return { icon: Check, variant: 'success', label };
		if (s === 'declined') return { icon: X, variant: 'error', label };
		return { icon: Clock, variant: 'warning', label };
	}

	function fmtRelative(iso: string): string {
		const diff = Date.now() - new Date(iso).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return i18n.locale === 'fr' ? "à l'instant" : 'just now';
		if (mins < 60) return `${mins} min`;
		const hrs = Math.floor(mins / 60);
		if (hrs < 24) return `${hrs} h`;
		const days = Math.floor(hrs / 24);
		if (days < 30) return `${days} j`;
		return new Intl.DateTimeFormat(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		}).format(new Date(iso));
	}

	// Backend applique un cooldown 30 jours après un decline avant qu'on
	// puisse re-contacter le même talent. Petite aide pour l'user.
	function cooldownRemaining(iso: string): number {
		const declined = new Date(iso).getTime();
		const now = Date.now();
		const daysSince = Math.floor((now - declined) / (1000 * 60 * 60 * 24));
		return Math.max(0, 30 - daysSince);
	}
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Demandes envoyées' : 'Sent requests'} — Skilluv</title>
</svelte:head>

<div class="p-6 lg:p-8">
	<!-- Header -->
	<div class="mb-6">
		<h1 class="text-2xl font-bold">
			{i18n.locale === 'fr' ? 'Demandes envoyées' : 'Sent requests'}
		</h1>
		<p class="text-sm text-text-muted">
			{i18n.locale === 'fr'
				? 'Suivi de toutes les demandes de contact que vous avez envoyées aux talents.'
				: 'Track every contact request you\'ve sent to talents.'}
		</p>
	</div>

	<!-- Filter -->
	<div class="mb-6 flex flex-wrap items-center justify-between gap-3">
		<SegmentedControl items={filterItems} bind:value={filter} />
		{#if total > 0}
			<p class="text-xs text-text-muted">
				{i18n.locale === 'fr' ? 'Total' : 'Total'}: <span class="font-semibold text-text-primary tabular-nums">{total}</span>
			</p>
		{/if}
	</div>

	{#if loading}
		<div class="flex flex-col gap-3">
			{#each Array(4) as _}
				<Skeleton class="h-24 w-full" rounded="xl" />
			{/each}
		</div>
	{:else if error}
		<div class="rounded-2xl border border-error/30 bg-error/10 p-6 text-center text-sm text-error">
			{error}
			<div class="mt-3">
				<Button variant="ghost" onclick={load}>
					{i18n.locale === 'fr' ? 'Réessayer' : 'Retry'}
				</Button>
			</div>
		</div>
	{:else if visible.length === 0}
		<div class="rounded-2xl border border-border bg-surface-elevated p-10 text-center">
			<div class="mb-3 inline-flex justify-center text-text-muted">
				<Inbox size={40} strokeWidth={1.5} />
			</div>
			<p class="mb-4 text-text-muted">
				{filter === 'all'
					? (i18n.locale === 'fr' ? "Aucune demande envoyée pour l'instant." : 'No sent requests yet.')
					: (i18n.locale === 'fr' ? 'Aucune demande dans cette catégorie.' : 'No requests in this category.')}
			</p>
			{#if filter === 'all'}
				<Button variant="accent" href="/enterprise/talents">
					{i18n.locale === 'fr' ? 'Rechercher des talents' : 'Search talents'}
				</Button>
			{/if}
		</div>
	{:else}
		<div class="flex flex-col gap-3">
			{#each visible as req (req.id)}
				{@const meta = statusMeta(req.status)}
				{@const cooldown = req.status === 'declined' ? cooldownRemaining(req.created_at) : 0}
				<article class="rounded-2xl border border-border bg-surface-elevated p-4 transition-colors hover:border-primary/30">
					<div class="flex items-start gap-3">
						<!-- Avatar -->
						<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
							{(req.talent_display_name ?? req.talent_username ?? '?').charAt(0).toUpperCase()}
						</div>

						<!-- Content -->
						<div class="min-w-0 flex-1">
							<div class="mb-1 flex flex-wrap items-center gap-2">
								{#if req.talent_username}
									<a
										href={`/profile/${req.talent_username}`}
										class="font-semibold hover:text-primary"
									>
										{req.talent_display_name ?? req.talent_username}
									</a>
								{:else}
									<span class="font-semibold text-text-muted">
										{i18n.locale === 'fr' ? 'Talent supprimé' : 'Deleted talent'}
									</span>
								{/if}
								{#if req.talent_username}
									<span class="font-mono text-xs text-text-muted">@{req.talent_username}</span>
								{/if}
								<Badge variant={meta.variant} size="sm">
									<meta.icon size={12} strokeWidth={2.5} />
									{meta.label}
								</Badge>
							</div>

							<!-- Message envoyé -->
							<p class="mt-2 rounded-lg bg-surface-overlay/50 px-3 py-2 text-xs text-text-muted line-clamp-3">
								<span class="font-semibold text-text-primary">
									{i18n.locale === 'fr' ? 'Votre message' : 'Your message'}:
								</span>
								{req.initial_message}
							</p>

							<!-- Footer : date + action contextuelle -->
							<div class="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-text-muted">
								<span class="flex items-center gap-1.5">
									<Mail size={12} strokeWidth={2} />
									{i18n.locale === 'fr' ? 'Envoyée' : 'Sent'} {fmtRelative(req.created_at)}
								</span>

								{#if req.status === 'accepted'}
									<a href="/enterprise/messages" class="inline-flex items-center gap-1 text-accent hover:underline">
										{i18n.locale === 'fr' ? 'Ouvrir la conversation' : 'Open conversation'}
										<ArrowRight size={12} strokeWidth={2} />
									</a>
								{:else if req.status === 'declined' && cooldown > 0}
									<span class="text-error">
										{i18n.locale === 'fr'
											? `Cooldown : ${cooldown}j avant de pouvoir recontacter`
											: `Cooldown: ${cooldown}d before you can retry`}
									</span>
								{:else if req.status === 'declined'}
									<span class="text-text-muted">
										{i18n.locale === 'fr' ? 'Cooldown terminé — vous pouvez recontacter' : 'Cooldown over — you can retry'}
									</span>
								{/if}
							</div>
						</div>
					</div>
				</article>
			{/each}
		</div>

		{#if totalPages > 1}
			<div class="mt-6">
				<Pagination
					current={page}
					total={totalPages}
					onchange={(p) => {
						page = p;
						void load();
					}}
				/>
			</div>
		{/if}
	{/if}
</div>
