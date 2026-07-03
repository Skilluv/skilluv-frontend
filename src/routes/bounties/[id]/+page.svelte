<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Modal from '$components/ui/Modal.svelte';
	import { bountiesApi, type Bounty } from '$api/bounties';
	import { toast } from '$stores/toast.svelte';
	import { SkilluError } from '$api/client';

	let bountyId = $derived(page.params.id ?? '');
	let bounty = $state<Bounty | null>(null);
	let loading = $state(true);
	let claiming = $state(false);
	let showPrModal = $state(false);
	let prUrl = $state('');
	let prNumber = $state<number | ''>('');
	let submittingPr = $state(false);

	async function load() {
		loading = true;
		try {
			const res = await bountiesApi.get(bountyId);
			bounty = res.data;
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			loading = false;
		}
	}

	async function claim() {
		if (!auth.isAuthenticated) {
			window.location.href = `/auth/login?redirect=/bounties/${bountyId}`;
			return;
		}
		claiming = true;
		try {
			await bountiesApi.claim(bountyId);
			toast.success(
				i18n.locale === 'fr'
					? 'Bounty revendiquée ! Tu as 7 jours pour ouvrir une PR.'
					: 'Bounty claimed! You have 7 days to open a PR.'
			);
			await load();
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			claiming = false;
		}
	}

	async function submitPr() {
		const num = typeof prNumber === 'number' ? prNumber : parseInt(String(prNumber), 10);
		if (!prUrl.trim() || !num) return;
		submittingPr = true;
		try {
			await bountiesApi.submitPr(bountyId, prUrl.trim(), num);
			toast.success(
				i18n.locale === 'fr'
					? 'PR attachée. On te crédite dès qu\'elle est mergée.'
					: 'PR attached. You\'ll be credited as soon as it\'s merged.'
			);
			showPrModal = false;
			prUrl = '';
			prNumber = '';
			await load();
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			submittingPr = false;
		}
	}

	function statusVariant(status: string): 'success' | 'accent' | 'default' | 'warning' | 'error' {
		return status === 'open' ? 'success'
			: status === 'claimed' ? 'accent'
			: status === 'in_review' ? 'warning'
			: status === 'paid' ? 'primary' as any
			: status === 'cancelled' || status === 'expired' ? 'error'
			: 'default';
	}

	function statusLabel(status: string): string {
		const labels: Record<string, { fr: string; en: string }> = {
			open: { fr: 'Ouverte', en: 'Open' },
			claimed: { fr: 'Revendiquée', en: 'Claimed' },
			in_review: { fr: 'En review PR', en: 'PR under review' },
			paid: { fr: 'Payée', en: 'Paid' },
			cancelled: { fr: 'Annulée', en: 'Cancelled' },
			expired: { fr: 'Expirée', en: 'Expired' }
		};
		return (labels[status]?.[i18n.locale as 'fr' | 'en']) ?? status;
	}

	onMount(() => void load());
</script>

<svelte:head>
	<title>{bounty?.title ?? 'Bounty'} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-10 sm:py-14">
	<!-- Breadcrumb -->
	<nav class="mb-6 flex items-center gap-2 text-sm text-text-muted">
		<a href="/bounties" class="hover:text-text-primary">
			{i18n.locale === 'fr' ? 'Bounties' : 'Bounties'}
		</a>
		<span>›</span>
		<span class="text-text-primary truncate">{bounty?.title ?? '...'}</span>
	</nav>

	{#if loading}
		<div class="animate-pulse space-y-4">
			<div class="h-16 rounded bg-surface-elevated"></div>
			<div class="h-40 rounded bg-surface-elevated"></div>
			<div class="h-24 rounded bg-surface-elevated"></div>
		</div>
	{:else if bounty}
		<!-- Header -->
		<header class="mb-8">
			<div class="mb-4 flex flex-wrap items-center gap-2">
				<Badge variant={statusVariant(bounty.status)} size="md">{statusLabel(bounty.status)}</Badge>
				<span class="font-mono text-xs text-text-muted">{bounty.repo}#{bounty.issue_number}</span>
			</div>
			<h1 class="text-3xl sm:text-4xl lg:text-5xl font-black leading-[1.1] tracking-tight">
				{bounty.title}
			</h1>
			<p class="mt-3 text-sm text-text-muted">
				{i18n.locale === 'fr' ? 'Proposée par' : 'By'}
				<span class="font-semibold text-text-primary">{bounty.company_name}</span>
			</p>
		</header>

		<!-- Reward highlight -->
		<div class="mb-8 rounded-2xl border border-accent/30 bg-gradient-to-br from-surface-elevated to-accent/5 p-8 relative overflow-hidden">
			<div aria-hidden="true" class="pointer-events-none absolute -right-4 -top-4 h-32 w-32 rounded-full bg-accent/10 blur-2xl"></div>
			<div class="flex flex-wrap items-end justify-between gap-6">
				<div>
					<p class="mb-1 text-xs font-bold uppercase tracking-wider text-text-muted">
						{i18n.locale === 'fr' ? 'Récompense' : 'Reward'}
					</p>
					<div class="flex items-baseline gap-3">
						<span class="text-5xl sm:text-6xl font-black tracking-tight text-accent">{bounty.reward_credits}</span>
						<span class="text-lg text-text-muted">{i18n.locale === 'fr' ? 'crédits' : 'credits'}</span>
					</div>
					<p class="mt-2 text-sm text-text-muted">
						+ <span class="font-bold text-primary">{bounty.fragments_bonus}</span>
						{i18n.locale === 'fr' ? 'fragments bonus' : 'bonus fragments'}
					</p>
				</div>
				{#if bounty.status === 'open'}
					<div class="flex flex-col gap-2">
						<Button variant="accent" size="lg" loading={claiming} onclick={claim}>
							{i18n.locale === 'fr' ? 'Revendiquer cette bounty' : 'Claim this bounty'}
						</Button>
						<p class="text-xs text-text-muted">
							{i18n.locale === 'fr' ? '7 jours pour ouvrir la PR' : '7 days to open the PR'}
						</p>
					</div>
				{:else if bounty.status === 'claimed' || bounty.status === 'in_review'}
					<Button variant="primary" size="lg" onclick={() => (showPrModal = true)}>
						{bounty.status === 'in_review'
							? (i18n.locale === 'fr' ? 'Mettre à jour la PR' : 'Update PR')
							: (i18n.locale === 'fr' ? 'Attacher ma PR' : 'Attach my PR')}
					</Button>
				{/if}
			</div>
		</div>

		<!-- Description -->
		<section class="mb-8 rounded-2xl border border-border bg-surface-elevated p-6">
			<h2 class="mb-3 text-xs font-bold uppercase tracking-wider text-accent">
				{i18n.locale === 'fr' ? 'Description' : 'Description'}
			</h2>
			<p class="whitespace-pre-wrap text-sm leading-relaxed">{bounty.description}</p>
		</section>

		<!-- Skills / Tags -->
		<div class="mb-8 grid gap-4 sm:grid-cols-2">
			<div class="rounded-2xl border border-border bg-surface-elevated p-5">
				<p class="mb-3 text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.locale === 'fr' ? 'Compétences requises' : 'Required skills'}
				</p>
				<div class="flex flex-wrap gap-1.5">
					{#each bounty.required_skills as s}
						<Badge variant="primary" size="sm">{s}</Badge>
					{:else}
						<span class="text-sm text-text-muted">
							{i18n.locale === 'fr' ? 'Aucune spécifique' : 'None specific'}
						</span>
					{/each}
				</div>
			</div>
			<div class="rounded-2xl border border-border bg-surface-elevated p-5">
				<p class="mb-3 text-xs font-bold uppercase tracking-wider text-text-muted">Tags</p>
				<div class="flex flex-wrap gap-1.5">
					{#each bounty.tags as t}
						<Badge variant="default" size="sm">{t}</Badge>
					{:else}
						<span class="text-sm text-text-muted">—</span>
					{/each}
				</div>
			</div>
		</div>

		<!-- GitHub link -->
		<a
			href={bounty.issue_url}
			target="_blank"
			rel="noopener noreferrer"
			class="mb-8 flex items-center gap-3 rounded-2xl border border-border bg-surface-elevated p-5 hover:border-primary hover:text-primary transition-colors"
		>
			<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
				<svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
					<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
				</svg>
			</div>
			<div class="flex-1">
				<p class="text-xs font-bold uppercase tracking-wider text-text-muted">GitHub issue</p>
				<p class="font-mono text-sm truncate">{bounty.issue_url}</p>
			</div>
			<span class="text-sm">→</span>
		</a>
	{/if}
</div>

<!-- PR modal -->
<Modal
	open={showPrModal}
	title={i18n.locale === 'fr' ? 'Attacher ma Pull Request' : 'Attach my Pull Request'}
	onclose={() => (showPrModal = false)}
>
	<form onsubmit={(e) => { e.preventDefault(); void submitPr(); }} class="space-y-4">
		<div>
			<label for="pr-url" class="mb-1 block text-xs font-bold uppercase tracking-wider text-text-muted">
				{i18n.locale === 'fr' ? 'URL de la PR' : 'PR URL'}
			</label>
			<input
				id="pr-url"
				type="url"
				bind:value={prUrl}
				required
				placeholder="https://github.com/org/repo/pull/123"
				class="w-full rounded-full border border-border bg-surface-overlay px-4 py-2 text-sm placeholder:text-text-muted focus:border-primary focus:outline-none"
			/>
		</div>
		<div>
			<label for="pr-num" class="mb-1 block text-xs font-bold uppercase tracking-wider text-text-muted">
				{i18n.locale === 'fr' ? 'Numéro' : 'Number'}
			</label>
			<input
				id="pr-num"
				type="number"
				bind:value={prNumber}
				required
				min="1"
				placeholder="123"
				class="w-full rounded-full border border-border bg-surface-overlay px-4 py-2 text-sm placeholder:text-text-muted focus:border-primary focus:outline-none"
			/>
		</div>
		<div class="flex justify-end gap-2">
			<Button variant="ghost" onclick={() => (showPrModal = false)}>
				{i18n.locale === 'fr' ? 'Annuler' : 'Cancel'}
			</Button>
			<Button loading={submittingPr}>
				{i18n.locale === 'fr' ? 'Attacher' : 'Attach'}
			</Button>
		</div>
	</form>
</Modal>
