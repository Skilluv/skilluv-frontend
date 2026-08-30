<script lang="ts">
	/**
	 * The creators marketplace (business-model 08-01, 08-06).
	 *
	 * Templates, boilerplates, kits, samples, extensions — made by people here,
	 * bought by people here. The backend served the whole thing and no page
	 * called it.
	 *
	 * Only published items are listed; the backend does the filtering, so
	 * there is no draft to hide here.
	 *
	 * The licence is on the card and not buried in the description. It is the
	 * term a buyer most often discovers after paying, and three values is few
	 * enough to say every time.
	 */
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { Download, Star } from '@lucide/svelte';
	import { marketplaceApi } from '$lib/api/marketplace';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { PUBLIC_DOMAINS, domainStyle } from '$lib/utils/domains';
	import Badge from '$components/ui/Badge.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import {
		MARKETPLACE_COMMISSION_HIGH_PERCENT,
		MARKETPLACE_COMMISSION_LOW_PERCENT,
		MARKETPLACE_COMMISSION_THRESHOLD_EUR,
		type MarketplaceItem
	} from '$types';

	let items = $state<MarketplaceItem[]>([]);
	let loading = $state(true);
	let loadError = $state('');
	let domain = $state('');

	async function load() {
		loading = true;
		loadError = '';
		try {
			const res = await marketplaceApi.browse(domain || undefined);
			items = res.data?.items ?? [];
		} catch (err) {
			loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	function selectDomain(next: string) {
		if (next === domain) return;
		domain = next;
		void load();
	}

	/** NUMERIC arrives as a decimal string; parse once, here. */
	function fmtPrice(price: string, currency: string): string {
		const amount = Number(price);
		if (!Number.isFinite(amount)) return price;
		return new Intl.NumberFormat(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', {
			style: 'currency',
			currency: currency || 'EUR',
			// Micro-transactions are a stated goal (08-06): a 2.50 item must
			// not round to 3, and a 0.99 one must not round to 1.
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(amount);
	}

	function fmtRating(avg: string | null): string | null {
		if (avg === null) return null;
		const n = Number(avg);
		return Number.isFinite(n) ? n.toFixed(1) : null;
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('marketplace.title')} — Skilluv</title>
	<meta name="description" content={i18n.t('marketplace.subtitle')} />
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-8">
	<header class="mb-6">
		<h1 class="text-3xl font-bold text-text-primary">{i18n.t('marketplace.title')}</h1>
		<p class="mt-2 max-w-2xl text-text-muted">{i18n.t('marketplace.subtitle')}</p>
	</header>

	<div class="mb-8 flex flex-wrap gap-2" data-testid="marketplace-domain-filter">
		<button
			type="button"
			onclick={() => selectDomain('')}
			aria-pressed={domain === ''}
			class="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors {domain === ''
				? 'border-accent bg-accent/10 text-accent'
				: 'border-border text-text-muted hover:text-text-primary'}"
		>
			{i18n.t('marketplace.allDomains')}
		</button>
		{#each PUBLIC_DOMAINS as candidate (candidate)}
			<button
				type="button"
				onclick={() => selectDomain(candidate)}
				aria-pressed={domain === candidate}
				class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors {domain ===
				candidate
					? 'border-accent bg-accent/10 text-accent'
					: 'border-border text-text-muted hover:text-text-primary'}"
			>
				<span class="h-1.5 w-1.5 rounded-full {domainStyle(candidate).dot}"></span>
				{i18n.t(`common.domains.${candidate}`)}
			</button>
		{/each}
	</div>

	{#if loading}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each Array(6) as _, i (i)}
				<Skeleton class="h-64 w-full" rounded="xl" />
			{/each}
		</div>
	{:else if loadError}
		<div class="rounded-2xl border border-error/40 bg-error/5 p-6 text-center" role="alert">
			<p class="text-sm text-error">{loadError}</p>
		</div>
	{:else if items.length === 0}
		<EmptyState
			variant="search"
			title={i18n.t('marketplace.empty')}
			body={i18n.t('marketplace.emptyBody')}
		/>
	{:else}
		<ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list" data-testid="marketplace-items">
			{#each items as item (item.id)}
				{@const rating = fmtRating(item.rating_avg)}
				<li>
					<a
						href={resolve(`/marketplace/${item.id}`)}
						class="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface-elevated transition-colors hover:border-accent/40"
					>
						<img
							src={item.thumbnail_url}
							alt=""
							loading="lazy"
							class="aspect-video w-full bg-surface-overlay object-cover"
						/>
						<div class="flex flex-1 flex-col p-4">
							<div class="mb-2 flex flex-wrap items-center gap-2">
								<span class="inline-flex items-center gap-1.5 text-xs text-text-muted">
									<span class="h-1.5 w-1.5 rounded-full {domainStyle(item.skill_domain).dot}"
									></span>
									{item.item_type}
								</span>
								{#if rating}
									<span class="ml-auto inline-flex items-center gap-1 text-xs text-text-muted">
										<Star size={11} strokeWidth={2} />
										{rating}
										<span>({item.rating_count})</span>
									</span>
								{/if}
							</div>

							<p class="text-sm font-semibold text-text-primary">{item.title}</p>

							<!-- The term a buyer most often discovers after paying. -->
							<p class="mt-2">
								<Badge variant="default" size="sm">
									{i18n.t(`marketplace.licenses.${item.license_type}`)}
								</Badge>
							</p>

							<div class="mt-auto flex items-center justify-between gap-2 pt-4">
								<span class="font-mono text-sm font-semibold text-text-primary">
									{fmtPrice(item.price, item.currency)}
								</span>
								<span class="inline-flex items-center gap-1 text-xs text-text-muted">
									<Download size={11} strokeWidth={2} />
									{item.downloads_count}
								</span>
							</div>
						</div>
					</a>
				</li>
			{/each}
		</ul>
	{/if}

	<!-- Said on the listing rather than only in the seller flow: somebody
	     browsing is often somebody wondering whether to sell. -->
	<p class="mt-10 border-t border-border pt-6 text-xs text-text-muted">
		{i18n.t('marketplace.commissionNotice', {
			low: MARKETPLACE_COMMISSION_LOW_PERCENT,
			high: MARKETPLACE_COMMISSION_HIGH_PERCENT,
			threshold: MARKETPLACE_COMMISSION_THRESHOLD_EUR
		})}
	</p>
</div>
