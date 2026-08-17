<script lang="ts">
	/**
	 * SKI-45 — manage the time you offer.
	 *
	 * `can_publish` comes from the server and reflects the Artisan rank floor.
	 * When it is false the form is not merely disabled: the page says what the
	 * floor is and why, so the answer is a reason rather than a greyed button.
	 */
	import { onMount } from 'svelte';
	import { Trash2 } from '@lucide/svelte';
	import { talentOffersApi, MAX_OFFERS_PER_USER } from '$lib/api/talent_offers';
	import { skillsApi, type SkillCatalogEntry } from '$lib/api/skills';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Input from '$components/ui/Input.svelte';
	import Modal from '$components/ui/Modal.svelte';
	import Select from '$components/ui/Select.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import { TALENT_OFFER_TYPES, type TalentOffer, type TalentOfferType } from '$types';

	let offers = $state<TalentOffer[]>([]);
	let canPublish = $state(false);
	let skills = $state<SkillCatalogEntry[]>([]);
	let loading = $state(true);
	let loadError = $state('');

	let formOpen = $state(false);
	let offerType = $state<TalentOfferType>('pair_programming');
	let skillId = $state('');
	let hours = $state('2');
	let isFree = $state(true);
	let priceEuros = $state('30');
	let description = $state('');
	let submitting = $state(false);

	let liveCount = $derived(offers.filter((o) => o.active).length);
	let atCap = $derived(liveCount >= MAX_OFFERS_PER_USER);

	let typeItems = $derived(
		TALENT_OFFER_TYPES.map((t) => ({ value: t, label: i18n.t(`talentOffers.types.${t}`) }))
	);
	let skillItems = $derived([
		{ value: '', label: i18n.t('talentOffers.formSkillNone') },
		...skills.map((s) => ({ value: s.id, label: s.display_name }))
	]);

	async function load() {
		loading = true;
		loadError = '';
		try {
			const res = await talentOffersApi.listMine();
			offers = res.data?.offers ?? [];
			canPublish = res.data?.can_publish ?? false;
		} catch (err) {
			loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	async function submit() {
		submitting = true;
		try {
			const res = await talentOffersApi.create({
				offer_type: offerType,
				skill_id: skillId || undefined,
				availability_hours: Number(hours),
				// Explicit null is what marks an offer free; undefined would
				// leave the backend to its own default.
				price_cents_per_hour: isFree ? null : Math.round(Number(priceEuros) * 100),
				description: description.trim() || undefined
			});
			offers = [res.data.offer, ...offers];
			toast.success(i18n.t('talentOffers.createdToast'));
			formOpen = false;
			description = '';
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			submitting = false;
		}
	}

	async function toggleActive(offer: TalentOffer) {
		try {
			const res = await talentOffersApi.update(offer.id, { active: !offer.active });
			offers = offers.map((o) => (o.id === offer.id ? res.data.offer : o));
			toast.success(i18n.t('talentOffers.updatedToast'));
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		}
	}

	async function remove(offer: TalentOffer) {
		if (!confirm(i18n.t('talentOffers.deleteConfirm'))) return;
		try {
			await talentOffersApi.remove(offer.id);
			offers = offers.filter((o) => o.id !== offer.id);
			toast.success(i18n.t('talentOffers.deletedToast'));
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
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

	onMount(async () => {
		await load();
		try {
			skills = (await skillsApi.list()).data?.skills ?? [];
		} catch {
			// An offer without a skill is legal; the picker just stays empty.
		}
	});
</script>

<svelte:head>
	<title>{i18n.t('talentOffers.mineTitle')} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-8" data-testid="my-talent-offers-page">
	<header class="mb-8 flex flex-wrap items-end justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold text-text-primary">{i18n.t('talentOffers.mineTitle')}</h1>
			<p class="mt-2 text-text-muted">{i18n.t('talentOffers.mineSubtitle')}</p>
		</div>
		<div class="flex items-center gap-2">
			<Button variant="ghost" href="/talent-offers">{i18n.t('talentOffers.title')}</Button>
			{#if canPublish}
				<Button variant="accent" disabled={atCap} onclick={() => (formOpen = true)}>
					{i18n.t('talentOffers.mineNewCta')}
				</Button>
			{/if}
		</div>
	</header>

	{#if loading}
		<div class="space-y-3">
			{#each Array(2) as _, i (i)}
				<Skeleton class="h-28 w-full" rounded="xl" />
			{/each}
		</div>
	{:else if loadError}
		<div class="rounded-2xl border border-error/40 bg-error/5 p-6 text-center" role="alert">
			<p class="text-sm text-error">{loadError}</p>
			<Button variant="ghost" size="sm" class="mt-3" onclick={load}>
				{i18n.t('common.actions.retry')}
			</Button>
		</div>
	{:else if !canPublish}
		<EmptyState
			variant="lantern"
			title={i18n.t('talentOffers.cannotPublish')}
			body={i18n.t('talentOffers.cannotPublishHint')}
		>
			{#snippet action()}
				<Button variant="accent" href="/challenges">{i18n.t('common.nav.challenges')}</Button>
			{/snippet}
		</EmptyState>
	{:else}
		{#if atCap}
			<p class="mb-4 text-sm text-warning" role="status">{i18n.t('talentOffers.maxReached')}</p>
		{/if}

		{#if offers.length === 0}
			<EmptyState variant="scroll" title={i18n.t('talentOffers.mineEmpty')}>
				{#snippet action()}
					<Button variant="accent" onclick={() => (formOpen = true)}>
						{i18n.t('talentOffers.mineNewCta')}
					</Button>
				{/snippet}
			</EmptyState>
		{:else}
			<ul class="space-y-3" role="list">
				{#each offers as offer (offer.id)}
					<li class="rounded-2xl border border-border bg-surface-elevated p-5">
						<div class="flex flex-wrap items-start justify-between gap-3">
							<div class="min-w-0 flex-1">
								<p class="flex flex-wrap items-center gap-2">
									<span class="text-base font-bold text-text-primary">
										{i18n.t(`talentOffers.types.${offer.offer_type}`)}
									</span>
									<Badge variant={offer.active ? 'success' : 'default'} size="sm">
										{offer.active
											? i18n.t('talentOffers.activeLabel')
											: i18n.t('talentOffers.pausedLabel')}
									</Badge>
								</p>
								{#if offer.description}
									<p class="mt-2 text-sm text-text-muted">{offer.description}</p>
								{/if}
								<p class="mt-2 text-xs text-text-muted">
									{i18n.t('talentOffers.hoursPerWeek', { n: offer.availability_hours })}
									<span class="mx-1.5">·</span>
									{offer.price_cents_per_hour
										? i18n.t('talentOffers.pricePerHour', {
												amount: fmtPrice(offer.price_cents_per_hour)
											})
										: i18n.t('talentOffers.free')}
								</p>
							</div>
							<div class="flex items-center gap-2">
								<Button variant="ghost" size="sm" onclick={() => toggleActive(offer)}>
									{offer.active ? i18n.t('talentOffers.pause') : i18n.t('talentOffers.resume')}
								</Button>
								<button
									type="button"
									onclick={() => remove(offer)}
									aria-label={i18n.t('talentOffers.deleteCta')}
									title={i18n.t('talentOffers.deleteCta')}
									class="rounded-full border border-border p-2 text-text-muted transition-colors duration-200 hover:border-error hover:text-error"
								>
									<Trash2 size={14} strokeWidth={2} />
								</button>
							</div>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</div>

<Modal
	open={formOpen}
	title={i18n.t('talentOffers.mineNewCta')}
	onclose={() => (formOpen = false)}
	size="md"
>
	<div class="space-y-4">
		<div>
			<span class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
				{i18n.t('talentOffers.formType')}
			</span>
			<Select items={typeItems} value={offerType} onchange={(v) => (offerType = v)} shape="rounded" />
		</div>

		<div>
			<span class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
				{i18n.t('talentOffers.formSkill')}
			</span>
			<Select
				items={skillItems}
				value={skillId}
				onchange={(v) => (skillId = v)}
				shape="rounded"
				searchable
			/>
		</div>

		<Input
			label={i18n.t('talentOffers.formHours')}
			type="number"
			min="1"
			max="20"
			bind:value={hours}
		/>

		<label class="flex items-center gap-3">
			<input
				type="checkbox"
				bind:checked={isFree}
				class="h-4 w-4 rounded border-border accent-accent"
			/>
			<span class="text-sm text-text-primary">{i18n.t('talentOffers.formPriceFree')}</span>
		</label>

		{#if !isFree}
			<Input
				label={i18n.t('talentOffers.formPrice')}
				type="number"
				min="1"
				hint={i18n.t('talentOffers.formPriceHint')}
				bind:value={priceEuros}
			/>
		{/if}

		<div>
			<label
				for="offer-description"
				class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted"
			>
				{i18n.t('talentOffers.formDescription')}
			</label>
			<textarea
				id="offer-description"
				bind:value={description}
				rows="4"
				maxlength={2000}
				class="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
			></textarea>
		</div>
	</div>

	{#snippet actions()}
		<Button variant="ghost" onclick={() => (formOpen = false)}>
			{i18n.t('common.actions.cancel')}
		</Button>
		<Button variant="accent" loading={submitting} onclick={submit}>
			{i18n.t('talentOffers.formSubmit')}
		</Button>
	{/snippet}
</Modal>
