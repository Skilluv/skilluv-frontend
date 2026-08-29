<script lang="ts">
	/**
	 * One marketplace item: what it is, what you may do with it, what it costs.
	 *
	 * The page shows three things the backend is deliberate about:
	 *
	 *   * **The licence in full.** `list_item` refuses a summary under twenty
	 *     characters, because a licence nobody can read is a licence nobody
	 *     follows. So it is printed, not linked to.
	 *   * **The sale split.** Served on this endpoint so a creator can work out
	 *     their take before listing rather than after selling.
	 *   * **What a purchase actually is** — a token with forty-eight hours and
	 *     ten redemptions, not a file to keep.
	 *
	 * Downloading does not work yet and the page says so rather than offering
	 * a dead button: `redeem_download` answers storage keys, not URLs. That is
	 * SKI-330.
	 */
	import { page } from '$app/stores';
	import { ArrowLeft, Download, Star } from '@lucide/svelte';
	import { marketplaceApi } from '$lib/api/marketplace';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import Markdown from '$components/ui/Markdown.svelte';
	import Modal from '$components/ui/Modal.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import { domainStyle } from '$lib/utils/domains';
	import {
		MARKETPLACE_RATING_MAX,
		MARKETPLACE_RATING_MIN,
		type MarketplaceItemDetail,
		type MarketplacePurchase
	} from '$types';

	let itemId = $derived($page.params.id ?? '');

	let detail = $state<MarketplaceItemDetail | null>(null);
	let loading = $state(true);
	let loadError = $state('');

	let buying = $state(false);
	let purchase = $state<MarketplacePurchase | null>(null);
	let fileNames = $state<string[] | null>(null);
	let redeeming = $state(false);

	let publishing = $state(false);

	let rateOpen = $state(false);
	let rating = $state(MARKETPLACE_RATING_MAX);
	let review = $state('');
	let rated = $state(false);
	let submittingRating = $state(false);

	let item = $derived(detail?.item ?? null);
	let isMine = $derived(!!auth.user && item?.creator_user_id === auth.user.id);
	/** Buying your own item is refused server-side; not offering it is kinder. */
	let canBuy = $derived(!!auth.user && !isMine && item?.status === 'published' && !purchase);
	let isDraft = $derived(item?.status !== 'published');

	$effect(() => {
		if (itemId) void load(itemId);
	});

	async function load(id: string) {
		loading = true;
		loadError = '';
		detail = null;
		try {
			detail = (await marketplaceApi.get(id)).data;
		} catch (err) {
			loadError =
				err instanceof SkilluError && err.code === 'RESOURCE_NOT_FOUND'
					? i18n.t('marketplace.notFound')
					: err instanceof SkilluError
						? err.message
						: i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	async function buy() {
		if (!item) return;
		buying = true;
		try {
			purchase = (await marketplaceApi.purchase(item.id)).data;
			toast.success(i18n.t('marketplace.boughtToast'));
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			buying = false;
		}
	}

	async function redeem() {
		if (!purchase) return;
		redeeming = true;
		try {
			fileNames = (await marketplaceApi.download(purchase.download_url)).data.files;
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			redeeming = false;
		}
	}

	async function publish() {
		if (!item) return;
		publishing = true;
		try {
			await marketplaceApi.publish(item.id);
			toast.success(i18n.t('marketplace.publishedToast'));
			await load(item.id);
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			publishing = false;
		}
	}

	async function submitRating() {
		if (!purchase) return;
		submittingRating = true;
		try {
			await marketplaceApi.rate(purchase.purchase_id, {
				rating,
				review: review.trim() || undefined
			});
			rated = true;
			rateOpen = false;
			toast.success(i18n.t('marketplace.ratedToast'));
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			submittingRating = false;
		}
	}

	function fmtPrice(price: string, currency: string): string {
		const amount = Number(price);
		if (!Number.isFinite(amount)) return price;
		return new Intl.NumberFormat(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', {
			style: 'currency',
			currency: currency || 'EUR',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(amount);
	}

	function fmtRating(avg: string | null): string | null {
		if (avg === null) return null;
		const n = Number(avg);
		return Number.isFinite(n) ? n.toFixed(1) : null;
	}
</script>

<svelte:head>
	<title>{item ? `${item.title} — Skilluv` : `${i18n.t('marketplace.title')} — Skilluv`}</title>
	{#if item}
		<meta name="description" content={item.license_summary} />
	{/if}
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-8">
	<a
		href="/marketplace"
		class="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"
	>
		<ArrowLeft size={14} strokeWidth={2} />
		{i18n.t('marketplace.backToList')}
	</a>

	{#if loading}
		<div class="mt-6 space-y-3">
			<Skeleton class="h-10 w-2/3" rounded="lg" />
			<Skeleton class="h-64 w-full" rounded="xl" />
		</div>
	{:else if loadError}
		<div class="mt-6 rounded-2xl border border-error/40 bg-error/5 p-6 text-center" role="alert">
			<p class="text-sm text-error">{loadError}</p>
		</div>
	{:else if item && detail}
		{@const stars = fmtRating(item.rating_avg)}
		<article class="mt-6 grid gap-8 lg:grid-cols-3" data-testid="marketplace-item">
			<div class="lg:col-span-2">
				<div class="mb-3 flex flex-wrap items-center gap-2">
					<span class="inline-flex items-center gap-1.5 text-xs text-text-muted">
						<span class="h-1.5 w-1.5 rounded-full {domainStyle(item.skill_domain).dot}"></span>
						{i18n.t(`common.domains.${item.skill_domain}`)}
					</span>
					<Badge variant="default" size="sm">{item.item_type}</Badge>
					{#if isDraft}
						<Badge variant="warning" size="sm">{i18n.t('marketplace.draft')}</Badge>
					{/if}
					{#if stars}
						<span class="ml-auto inline-flex items-center gap-1 text-xs text-text-muted">
							<Star size={12} strokeWidth={2} />
							{stars} ({item.rating_count})
						</span>
					{/if}
				</div>

				<h1 class="text-3xl font-bold text-text-primary">{item.title}</h1>

				<img
					src={item.thumbnail_url}
					alt=""
					class="mt-5 w-full rounded-xl border border-border bg-surface-overlay object-cover"
				/>

				{#if item.preview_urls.length > 0}
					<div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
						{#each item.preview_urls as preview (preview)}
							<img
								src={preview}
								alt=""
								loading="lazy"
								class="aspect-video w-full rounded-lg border border-border bg-surface-overlay object-cover"
							/>
						{/each}
					</div>
				{/if}

				<div class="mt-6 border-t border-border pt-6">
					<Markdown source={item.description_md} />
				</div>
			</div>

			<aside class="lg:sticky lg:top-24 lg:self-start">
				<div class="rounded-2xl border border-border bg-surface-elevated p-5">
					<p class="font-mono text-2xl font-black text-text-primary">
						{fmtPrice(item.price, item.currency)}
					</p>
					<p class="mt-1 inline-flex items-center gap-1 text-xs text-text-muted">
						<Download size={11} strokeWidth={2} />
						{i18n.t('marketplace.downloadsCount', { n: item.downloads_count })}
					</p>

					<!-- The licence, printed. The backend refuses a summary shorter
					     than a sentence for exactly this reason. -->
					<div class="mt-4 border-t border-border pt-4">
						<Badge variant="accent" size="sm">
							{i18n.t(`marketplace.licenses.${item.license_type}`)}
						</Badge>
						<p class="mt-2 text-sm text-text-muted">{item.license_summary}</p>
					</div>

					{#if canBuy}
						<Button variant="accent" class="mt-5 w-full" loading={buying} onclick={buy}>
							{i18n.t('marketplace.buyCta')}
						</Button>
					{:else if !auth.user}
						<Button variant="accent" class="mt-5 w-full" href="/auth/login?redirect=/marketplace/{item.id}">
							{i18n.t('marketplace.signInToBuy')}
						</Button>
					{/if}

					{#if isMine}
						<p class="mt-5 text-xs text-text-muted">{i18n.t('marketplace.yourItem')}</p>
						{#if isDraft}
							<Button
								variant="secondary"
								class="mt-2 w-full"
								loading={publishing}
								onclick={publish}
							>
								{i18n.t('marketplace.publishCta')}
							</Button>
						{/if}
					{/if}

					<!-- Shown to everyone, not only to sellers: somebody looking at
					     a price is often somebody wondering what they would keep. -->
					<div class="mt-5 border-t border-border pt-4 text-xs text-text-muted">
						<p>
							{i18n.t('marketplace.creatorReceives', {
								amount: fmtPrice(detail.creator_receives, item.currency)
							})}
						</p>
						<p class="mt-0.5">
							{i18n.t('marketplace.platformKeeps', {
								amount: fmtPrice(detail.platform_commission, item.currency)
							})}
						</p>
					</div>
				</div>

				{#if purchase}
					<div class="mt-4 rounded-2xl border border-success/40 bg-success/5 p-5">
						<p class="text-sm font-semibold text-text-primary">
							{i18n.t('marketplace.purchasedTitle')}
						</p>
						<!-- A token with a life, not a file to keep. Both figures come
						     from the response rather than from a constant here. -->
						<p class="mt-1 text-xs text-text-muted">
							{i18n.t('marketplace.tokenTerms', {
								hours: purchase.valid_for_hours,
								n: purchase.downloads_allowed
							})}
						</p>

						{#if fileNames}
							<ul class="mt-3 space-y-1" role="list">
								{#each fileNames as name (name)}
									<li class="font-mono text-xs text-text-primary">{name}</li>
								{/each}
							</ul>
							<!-- Storage keys, not links. Saying so beats a dead button. -->
							<p class="mt-2 text-xs text-warning">{i18n.t('marketplace.notFetchableYet')}</p>
						{:else}
							<Button
								variant="secondary"
								size="sm"
								class="mt-3 w-full"
								loading={redeeming}
								onclick={redeem}
							>
								{i18n.t('marketplace.redeemCta')}
							</Button>
						{/if}

						{#if !rated}
							<Button
								variant="ghost"
								size="sm"
								class="mt-2 w-full"
								onclick={() => (rateOpen = true)}
							>
								{i18n.t('marketplace.rateCta')}
							</Button>
						{/if}
					</div>
				{/if}
			</aside>
		</article>
	{/if}
</div>

<Modal
	open={rateOpen}
	title={i18n.t('marketplace.rateTitle')}
	onclose={() => (rateOpen = false)}
	size="sm"
>
	<div class="space-y-4">
		<p class="text-sm text-text-muted">{i18n.t('marketplace.rateHint')}</p>

		<div class="flex gap-2" role="radiogroup" aria-label={i18n.t('marketplace.rateTitle')}>
			{#each [1, 2, 3, 4, 5] as value (value)}
				<button
					type="button"
					role="radio"
					aria-checked={rating === value}
					aria-label={String(value)}
					onclick={() => (rating = value)}
					class="rounded-lg border px-3 py-2 text-sm transition-colors {rating >= value
						? 'border-accent bg-accent/10 text-accent'
						: 'border-border text-text-muted hover:text-text-primary'}"
				>
					<Star size={14} strokeWidth={2} />
				</button>
			{/each}
		</div>

		<div>
			<label
				for="marketplace-review"
				class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted"
			>
				{i18n.t('marketplace.reviewLabel')}
			</label>
			<textarea
				id="marketplace-review"
				bind:value={review}
				rows="4"
				placeholder={i18n.t('marketplace.reviewPlaceholder')}
				class="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
			></textarea>
		</div>
	</div>

	{#snippet actions()}
		<Button variant="ghost" onclick={() => (rateOpen = false)}>
			{i18n.t('common.actions.cancel')}
		</Button>
		<Button
			variant="accent"
			loading={submittingRating}
			disabled={rating < MARKETPLACE_RATING_MIN || rating > MARKETPLACE_RATING_MAX}
			onclick={submitRating}
		>
			{i18n.t('marketplace.rateSubmit')}
		</Button>
	{/snippet}
</Modal>
