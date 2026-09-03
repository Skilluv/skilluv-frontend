<script lang="ts">
	/**
	 * SKI-45 — the reverse marketplace.
	 *
	 * The usual direction is an enterprise looking for a talent. Here an
	 * Artisan or above opens hours of their week and says what for. Lighter
	 * than a mentoring booking, and the copy says so, since the two would
	 * otherwise read as the same product.
	 */
	import { onMount } from 'svelte';
	import { Clock } from '@lucide/svelte';
	import { talentOffersApi } from '$lib/api/talent_offers';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import FilterBar from '$components/ui/FilterBar.svelte';
	import Input from '$components/ui/Input.svelte';
	import Select from '$components/ui/Select.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import { TALENT_OFFER_TYPES, type TalentOfferListing, type TalentOfferType } from '$types';

	const PAGE_SIZE = 24;

	let offers = $state<TalentOfferListing[]>([]);
	let typeFilter = $state<TalentOfferType | 'all'>('all');
	let skillFilter = $state('');
	let freeOnly = $state(false);
	let loading = $state(true);
	let loadingMore = $state(false);
	let exhausted = $state(false);
	let loadError = $state('');

	let typeItems = $derived([
		{ value: 'all' as const, label: i18n.t('talentOffers.filterAll') },
		...TALENT_OFFER_TYPES.map((t) => ({ value: t, label: i18n.t(`talentOffers.types.${t}`) }))
	]);

	function params(offset: number) {
		return {
			offer_type: typeFilter === 'all' ? undefined : typeFilter,
			skill: skillFilter.trim() || undefined,
			free_only: freeOnly || undefined,
			limit: PAGE_SIZE,
			offset
		};
	}

	async function load() {
		loading = true;
		loadError = '';
		try {
			const res = await talentOffersApi.browse(params(0));
			offers = res.data?.offers ?? [];
			exhausted = offers.length < PAGE_SIZE;
		} catch (err) {
			loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	async function loadMore() {
		loadingMore = true;
		try {
			const res = await talentOffersApi.browse(params(offers.length));
			const next = res.data?.offers ?? [];
			offers = [...offers, ...next];
			exhausted = next.length < PAGE_SIZE;
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			loadingMore = false;
		}
	}

	function fmtPrice(cents: number): string {
		return new Intl.NumberFormat(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', {
			style: 'currency',
			currency: 'EUR',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(cents / 100);
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('talentOffers.title')} | Skilluv</title>
	<meta name="description" content={i18n.t('talentOffers.subtitle')} />
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-8" data-testid="talent-offers-page">
	<header class="mb-8 flex flex-wrap items-end justify-between gap-4">
		<div class="max-w-2xl">
			<h1 class="text-3xl font-bold text-text-primary">{i18n.t('talentOffers.title')}</h1>
			<p class="mt-2 text-text-muted">{i18n.t('talentOffers.subtitle')}</p>
			<p class="mt-1 text-sm text-text-muted">{i18n.t('talentOffers.vsMentorship')}</p>
		</div>
		{#if auth.user}
			<Button variant="accent" href="/dashboard/talent-offers">
				{i18n.t('talentOffers.mineNewCta')}
			</Button>
		{/if}
	</header>

	<FilterBar label={i18n.t('talentOffers.filterType')} class="mb-6">
		<Select
			items={typeItems}
			value={typeFilter}
			onchange={(v) => {
				typeFilter = v;
				void load();
			}}
			size="sm"
		/>
		<Input
			placeholder={i18n.t('talentOffers.filterSkill')}
			aria-label={i18n.t('talentOffers.filterSkill')}
			bind:value={skillFilter}
			onchange={load}
		/>
		<button
			type="button"
			onclick={() => {
				freeOnly = !freeOnly;
				void load();
			}}
			aria-pressed={freeOnly}
			class="rounded-full border px-3 py-1.5 text-xs transition-colors duration-200 {freeOnly
				? 'border-accent/40 bg-accent/10 text-accent'
				: 'border-border bg-surface-elevated text-text-muted hover:text-text-primary'}"
		>
			{i18n.t('talentOffers.filterFree')}
		</button>
	</FilterBar>

	{#if loading}
		<div class="grid gap-4 sm:grid-cols-2">
			{#each Array(4) as _, i (i)}
				<Skeleton class="h-40 w-full" rounded="xl" />
			{/each}
		</div>
	{:else if loadError}
		<div class="rounded-2xl border border-error/40 bg-error/5 p-6 text-center" role="alert">
			<p class="text-sm text-error">{loadError}</p>
			<Button variant="ghost" size="sm" class="mt-3" onclick={load}>
				{i18n.t('common.actions.retry')}
			</Button>
		</div>
	{:else if offers.length === 0}
		<EmptyState
			variant="search"
			title={i18n.t('talentOffers.emptyTitle')}
			body={i18n.t('talentOffers.emptyBody')}
		/>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2">
			{#each offers as offer (offer.id)}
				<article class="flex flex-col rounded-2xl border border-border bg-surface-elevated p-5">
					<div class="flex flex-wrap items-start justify-between gap-2">
						<div class="min-w-0">
							<a
								href="/profile/{offer.username}"
								class="text-base font-bold text-text-primary underline-offset-4 hover:underline"
							>
								{offer.display_name}
							</a>
							<p class="mt-0.5">
								<Badge size="sm">{i18n.t(`common.titles.${offer.rank}`)}</Badge>
							</p>
						</div>
						<Badge variant="accent" size="sm">
							{i18n.t(`talentOffers.types.${offer.offer_type}`)}
						</Badge>
					</div>

					{#if offer.description}
						<p class="mt-3 line-clamp-4 flex-1 text-sm text-text-muted">{offer.description}</p>
					{/if}

					<div
						class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-xs"
					>
						<span class="inline-flex items-center gap-1.5 text-text-muted">
							<Clock size={12} strokeWidth={2} />
							{i18n.t('talentOffers.hoursPerWeek', { n: offer.availability_hours })}
							{#if offer.skill_slug}
								<span class="ml-1.5 rounded-full bg-surface-overlay px-2 py-0.5">
									{offer.skill_slug}
								</span>
							{/if}
						</span>
						<span class="font-semibold {offer.price_cents_per_hour ? 'text-text-primary' : 'text-success'}">
							{offer.price_cents_per_hour
								? i18n.t('talentOffers.pricePerHour', {
										amount: fmtPrice(offer.price_cents_per_hour)
									})
								: i18n.t('talentOffers.free')}
						</span>
					</div>

					<!-- The profile is where contact happens; /messages has no
					     "start a thread with X" entry point to deep-link into. -->
					<div class="mt-3">
						<Button variant="ghost" size="sm" href="/profile/{offer.username}">
							{i18n.t('talentOffers.contactCta')}
						</Button>
					</div>
				</article>
			{/each}
		</div>

		{#if !exhausted}
			<div class="mt-6 text-center">
				<Button variant="ghost" loading={loadingMore} onclick={loadMore}>
					{i18n.t('common.actions.loadMore')}
				</Button>
			</div>
		{/if}
	{/if}
</div>
