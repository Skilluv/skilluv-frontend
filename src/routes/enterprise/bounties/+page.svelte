<script lang="ts">
	import { onMount } from 'svelte';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import { bountiesApi, type Bounty, type BountyStatus } from '$api/bounties';
	import { toast } from '$stores/toast.svelte';
	import { SkilluError } from '$api/client';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import StatCard from '$components/ui/StatCard.svelte';
	import SegmentedControl from '$components/ui/SegmentedControl.svelte';
	import FilterBar from '$components/ui/FilterBar.svelte';

	let bounties = $state<Bounty[]>([]);
	let loading = $state(true);
	let statusFilter = $state<'all' | BountyStatus>('all');

	// MVP : le backend n'a pas encore `GET /enterprise/bounties`. On liste toutes
	// les bounties (public) et on filtre client-side par company_name du user.
	// TODO backend : `GET /enterprise/bounties` scopé sur l'enterprise du user.
	async function load() {
		loading = true;
		try {
			const params: Record<string, string> = {};
			if (statusFilter !== 'all') params.status = statusFilter;
			const res = await bountiesApi.list(params);
			const myCompany = auth.user?.enterprise_name;
			bounties = myCompany
				? res.data.bounties.filter((b) => b.company_name === myCompany)
				: res.data.bounties;
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			loading = false;
		}
	}

	async function cancel(id: string) {
		if (!confirm(i18n.locale === 'fr' ? 'Annuler cette bounty ? Les crédits séquestrés seront remboursés.' : 'Cancel this bounty? Escrowed credits will be refunded.')) return;
		try {
			await bountiesApi.cancel(id);
			toast.success(i18n.locale === 'fr' ? 'Bounty annulée' : 'Bounty cancelled');
			await load();
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		}
	}

	function fmtDate(iso: string): string {
		return new Intl.DateTimeFormat(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', {
			day: '2-digit', month: 'short', year: 'numeric'
		}).format(new Date(iso));
	}

	function statusMeta(s: BountyStatus): { label: string; variant: 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'error' } {
		const labels: Record<BountyStatus, string> = i18n.locale === 'fr'
			? { open: 'Ouverte', claimed: 'Réservée', in_review: 'En revue', paid: 'Payée', cancelled: 'Annulée', expired: 'Expirée' }
			: { open: 'Open', claimed: 'Claimed', in_review: 'In review', paid: 'Paid', cancelled: 'Cancelled', expired: 'Expired' };
		const variants: Record<BountyStatus, 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'error'> = {
			open: 'primary', claimed: 'accent', in_review: 'warning',
			paid: 'success', cancelled: 'default', expired: 'default'
		};
		return { label: labels[s], variant: variants[s] };
	}

	// Stats agrégées
	let totalCredits = $derived(bounties.reduce((sum, b) => sum + Number(b.reward_credits), 0));
	let openCount = $derived(bounties.filter((b) => b.status === 'open').length);
	let claimedCount = $derived(bounties.filter((b) => b.status === 'claimed' || b.status === 'in_review').length);
	let paidCount = $derived(bounties.filter((b) => b.status === 'paid').length);

	const statusFilters: { value: 'all' | BountyStatus; label: string }[] = $derived([
		{ value: 'all', label: i18n.locale === 'fr' ? 'Toutes' : 'All' },
		{ value: 'open', label: i18n.locale === 'fr' ? 'Ouvertes' : 'Open' },
		{ value: 'claimed', label: i18n.locale === 'fr' ? 'Réservées' : 'Claimed' },
		{ value: 'in_review', label: i18n.locale === 'fr' ? 'En revue' : 'In review' },
		{ value: 'paid', label: i18n.locale === 'fr' ? 'Payées' : 'Paid' }
	]);

	$effect(() => {
		void statusFilter;
		void load();
	});

	onMount(() => void load());
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Mes bounties — Skilluv' : 'My bounties — Skilluv'}</title>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-10 sm:py-14">
	<!-- Header -->
	<div class="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
		<div>
			<h1 class="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight mb-3">
				{i18n.locale === 'fr' ? 'Mes bounties' : 'My bounties'}<span class="text-accent">.</span>
			</h1>
			<p class="text-base sm:text-lg text-text-muted max-w-2xl">
				{i18n.locale === 'fr'
					? 'Suivi de vos issues sponsorisées. Les crédits sont séquestrés à la création et libérés au merge.'
					: 'Track your sponsored issues. Credits are escrowed on creation and released on merge.'}
			</p>
		</div>
		<Button variant="accent" href="/enterprise/bounties/new">
			+ {i18n.locale === 'fr' ? 'Poster une bounty' : 'Post a bounty'}
		</Button>
	</div>

	<!-- Stats row -->
	<div class="grid gap-3 sm:grid-cols-4 mb-8">
		<StatCard
			label={i18n.locale === 'fr' ? 'Crédits séquestrés' : 'Escrowed credits'}
			value={totalCredits.toLocaleString('fr-FR')}
		/>
		<StatCard label={i18n.locale === 'fr' ? 'Ouvertes' : 'Open'} value={openCount} color="primary" />
		<StatCard label={i18n.locale === 'fr' ? 'En cours' : 'In progress'} value={claimedCount} color="accent" />
		<StatCard label={i18n.locale === 'fr' ? 'Payées' : 'Paid'} value={paidCount} color="success" />
	</div>

	<!-- Filtres -->
	<FilterBar class="mb-6">
		<SegmentedControl items={statusFilters} bind:value={statusFilter} />
	</FilterBar>

	<!-- Liste bounties (mêmes cards que /bounties public mais avec actions entreprise) -->
	{#if loading}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each Array(6) as _}
				<div class="animate-pulse rounded-2xl border border-border bg-surface-elevated h-56"></div>
			{/each}
		</div>
	{:else if bounties.length === 0}
		<div class="rounded-2xl border border-border bg-surface-elevated p-12 text-center">
			<h3 class="text-lg font-semibold mb-2">
				{i18n.locale === 'fr' ? 'Aucune bounty pour l\'instant' : 'No bounties yet'}
			</h3>
			<p class="text-sm text-text-muted mb-6 max-w-md mx-auto">
				{i18n.locale === 'fr'
					? 'Sponsorise ta première issue GitHub. Le talent qui la résout sera payé en crédits + fragments.'
					: 'Sponsor your first GitHub issue. The talent who solves it will be paid in credits + fragments.'}
			</p>
			<Button variant="accent" href="/enterprise/bounties/new">
				+ {i18n.locale === 'fr' ? 'Poster une bounty' : 'Post a bounty'}
			</Button>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each bounties as b}
				{@const s = statusMeta(b.status)}
				<article class="group flex flex-col rounded-2xl border border-border bg-surface-elevated overflow-hidden transition-colors duration-200 hover:border-primary/40">
					<!-- Header bar : statut + repo -->
					<div class="flex items-center gap-3 border-b border-border px-5 py-3">
						<Badge variant={s.variant} size="sm">{s.label}</Badge>
						<span class="ml-auto font-mono text-xs text-text-muted truncate max-w-[160px]">
							{b.repo}
						</span>
					</div>

					<div class="p-5 flex-1 flex flex-col">
						<a href="/bounties/{b.id}" class="mb-2 text-base font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
							{b.title}
						</a>
						<p class="mb-4 text-xs text-text-muted line-clamp-2">{b.description}</p>

						<div class="mb-4 flex flex-wrap gap-1.5">
							{#each b.required_skills.slice(0, 3) as skill}
								<Badge variant="default" size="sm">{skill}</Badge>
							{/each}
						</div>

						<div class="mt-auto flex items-end justify-between border-t border-border pt-4">
							<div>
								<div class="text-xl font-black text-accent tabular-nums">
									{Number(b.reward_credits).toLocaleString('fr-FR')}
									<span class="text-xs font-normal text-text-muted">
										{i18n.locale === 'fr' ? 'crédits' : 'credits'}
									</span>
								</div>
								<div class="text-[11px] text-text-muted">
									+{b.fragments_bonus} fragments · {fmtDate(b.created_at)}
								</div>
							</div>
							{#if b.status === 'open'}
								<button
									onclick={() => cancel(b.id)}
									class="text-xs font-semibold text-error hover:underline"
								>
									{i18n.locale === 'fr' ? 'Annuler' : 'Cancel'}
								</button>
							{/if}
						</div>
					</div>
				</article>
			{/each}
		</div>
	{/if}
</div>
