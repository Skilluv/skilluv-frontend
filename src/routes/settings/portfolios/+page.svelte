<script lang="ts">
	/**
	 * Declared portfolios, for every domain that has a platform table.
	 *
	 * `portfolioPlatforms` is seeded for code, ops, security, quality,
	 * education, communication and leadership — HackTheBox, TryHackMe, CTFtime,
	 * Intigriti and YesWeHack among them, which is what the cyber P-02 to P-05
	 * tickets asked for. Every one of those rows existed with nothing on the
	 * front calling `portfoliosApi` at all: the module was written and never
	 * mounted.
	 *
	 * One cross-domain page rather than one per domain, because the table is
	 * cross-domain and a person is rarely only one thing. The filter narrows
	 * the platform list; it does not partition the page.
	 *
	 * ## What this page refuses to blur
	 *
	 * `figures_are_declared` is the field everything here is built around. The
	 * counts are the person's own word — every row says so, and nothing they
	 * enter feeds a rank, a craft score or a search ranking. A declared
	 * portfolio is context; only a Skilluv validation is proof. That sentence
	 * sits above the form rather than under it, because it is the thing
	 * somebody should read before typing a follower count, not after.
	 *
	 * Design is deliberately absent from the platform list and that is not a
	 * bug: Behance, Dribbble and ArtStation are **external signals**, confirmed
	 * by a moderator rather than fetched, and they live at
	 * `/settings/external-signals`. Migration 0241 makes the argument — those
	 * providers withdrew their public APIs, and an "import" over them would
	 * mean the backend fetching arbitrary user-supplied URLs.
	 */
	import { onMount } from 'svelte';
	import { ExternalLink, Trash2 } from '@lucide/svelte';
	import { portfoliosApi, countLabel, profileUrlFor } from '$api/portfolios';
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
	import type { PortfolioDeclaration, PortfolioPlatform } from '$types';

	/** The domains `portfolio_platforms` is actually seeded for. */
	const DOMAINS = [
		'code',
		'security',
		'ops',
		'quality',
		'education',
		'communication',
		'leadership'
	] as const;

	let platforms = $state<PortfolioPlatform[]>([]);
	let declarations = $state<PortfolioDeclaration[]>([]);
	let loading = $state(true);
	let loadError = $state('');
	let domain = $state('');

	let formOpen = $state(false);
	let platformSlug = $state('');
	let handle = $state('');
	let profileUrl = $state('');
	let itemsCount = $state('');
	let reachCount = $state('');
	let saving = $state(false);
	let formError = $state('');

	let visiblePlatforms = $derived(
		domain === '' ? platforms : platforms.filter((p) => p.skill_domain === domain)
	);

	let selected = $derived(platforms.find((p) => p.slug === platformSlug) ?? null);

	let canSave = $derived(
		platformSlug !== '' && handle.trim() !== '' && profileUrl.trim() !== '' && !saving
	);

	let domainItems = $derived([
		{ value: '', label: i18n.t('portfolioSettings.allDomains') },
		...DOMAINS.map((d) => ({ value: d as string, label: i18n.t(`common.domains.${d}`) }))
	]);

	let platformItems = $derived([
		{ value: '', label: i18n.t('portfolioSettings.platformPlaceholder') },
		...visiblePlatforms.map((p) => ({ value: p.slug, label: p.name }))
	]);

	/** A platform's own name, or its slug when the row has gone. */
	function platformName(slug: string): string {
		return platforms.find((p) => p.slug === slug)?.name ?? slug;
	}

	/**
	 * Fill the URL from the handle, where the platform stated its shape.
	 *
	 * Only ever fills a field the person has not edited: overwriting a
	 * hand-corrected URL on every keystroke is how a form fights its user. A
	 * platform with no pattern leaves the field alone and the hint asks for the
	 * full address, because guessing a URL shape produces links that 404 on the
	 * profile of whoever trusted the form.
	 */
	function syncUrl() {
		if (!selected) return;
		const built = profileUrlFor(selected, handle);
		if (!built) return;
		const previous = profileUrlFor(selected, handle.slice(0, -1));
		if (profileUrl === '' || profileUrl === previous) profileUrl = built;
	}

	function label(platform: PortfolioPlatform | undefined, which: 'items' | 'reach'): string {
		if (!platform) return which === 'items' ? i18n.t('portfolioSettings.itemsLabel') : i18n.t('portfolioSettings.reachLabel');
		return (
			countLabel(platform, which, (k, p) => i18n.t(k, p)) ??
			(which === 'items'
				? i18n.t('portfolioSettings.itemsLabel')
				: i18n.t('portfolioSettings.reachLabel'))
		);
	}

	function openForm() {
		platformSlug = '';
		handle = '';
		profileUrl = '';
		itemsCount = '';
		reachCount = '';
		formError = '';
		formOpen = true;
	}

	/** A blank field stays blank: an optional count is not a zero. */
	function numberOrNull(value: string): number | null {
		const trimmed = value.trim();
		if (trimmed === '') return null;
		const parsed = Number(trimmed);
		return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : null;
	}

	async function load() {
		loading = true;
		loadError = '';
		const [platformsRes, mineRes] = await Promise.allSettled([
			portfoliosApi.platforms(),
			portfoliosApi.mine()
		]);
		if (platformsRes.status === 'fulfilled') platforms = platformsRes.value.data ?? [];
		if (mineRes.status === 'fulfilled') declarations = mineRes.value.data ?? [];
		else if (mineRes.reason instanceof SkilluError) loadError = mineRes.reason.message;
		loading = false;
	}

	async function save() {
		if (!canSave) return;
		saving = true;
		formError = '';
		try {
			const created = await portfoliosApi.declare({
				platform: platformSlug,
				handle: handle.trim(),
				profile_url: profileUrl.trim(),
				items_count: numberOrNull(itemsCount),
				reach_count: numberOrNull(reachCount)
			});
			if (created.data) declarations = [...declarations, created.data];
			formOpen = false;
			toast.success(i18n.t('portfolioSettings.added'));
		} catch (err) {
			formError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			saving = false;
		}
	}

	async function remove(row: PortfolioDeclaration) {
		if (!confirm(i18n.t('portfolioSettings.removeConfirm'))) return;
		try {
			await portfoliosApi.drop(row.id);
			declarations = declarations.filter((d) => d.id !== row.id);
			toast.success(i18n.t('portfolioSettings.removed'));
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		}
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('portfolioSettings.title')} · Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-3xl space-y-8 px-4 py-8" data-testid="portfolio-settings-page">
	<header class="space-y-2">
		<h1 class="text-2xl font-bold text-text">{i18n.t('portfolioSettings.title')}</h1>
		<p class="text-sm text-text-muted">{i18n.t('portfolioSettings.subtitle')}</p>
	</header>

	<!-- Above the form, not below it: this is what somebody should know before
	     they type a follower count, not after. -->
	<p
		class="rounded-xl border border-border bg-surface-elevated px-4 py-3 text-sm text-text-muted"
		data-testid="portfolio-declared-note"
	>
		{i18n.t('portfolioSettings.declaredNote')}
	</p>

	{#if loading}
		<Skeleton class="h-64 w-full" rounded="xl" />
	{:else}
		{#if loadError}
			<p class="rounded-lg border border-error/40 bg-error/5 px-4 py-3 text-sm text-error">
				{loadError}
			</p>
		{/if}

		<div class="flex flex-wrap items-end justify-between gap-3">
			<div class="min-w-48 space-y-1">
				<span class="text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.t('portfolioSettings.domainLabel')}
				</span>
				<Select items={domainItems} bind:value={domain} shape="rounded" />
			</div>
			<Button size="sm" onclick={openForm} data-testid="portfolio-add">
				{i18n.t('portfolioSettings.addCta')}
			</Button>
		</div>

		{#if declarations.length === 0}
			<EmptyState
				title={i18n.t('portfolioSettings.empty')}
				body={i18n.t('portfolioSettings.emptyHint')}
				size="sm"
			/>
		{:else}
			<ul class="space-y-3">
				{#each declarations as row (row.id)}
					{@const platform = platforms.find((p) => p.slug === row.platform)}
					<li
						class="rounded-xl border border-border bg-surface-elevated p-4"
						data-testid="portfolio-row"
					>
						<div class="flex flex-wrap items-start justify-between gap-2">
							<div class="min-w-0 space-y-1">
								<h2 class="text-sm font-bold text-text">{platformName(row.platform)}</h2>
								<a
									href={row.profile_url}
									target="_blank"
									rel="external noopener noreferrer"
									class="inline-flex items-center gap-1 text-sm text-accent hover:underline"
								>
									{row.handle}
									<ExternalLink size={13} />
								</a>
							</div>
							<div class="flex items-center gap-2">
								<!-- Declared and confirmed are different claims, and the
								     badge is the only place a reader sees which. -->
								<Badge size="sm" variant={row.verified_at ? 'success' : 'default'}>
									{row.verified_at
										? i18n.t('portfolioSettings.verifiedBadge')
										: i18n.t('portfolioSettings.declaredBadge')}
								</Badge>
								<Button
									size="sm"
									variant="ghost"
									onclick={() => remove(row)}
									aria-label={i18n.t('portfolioSettings.removeCta')}
								>
									<Trash2 size={15} />
								</Button>
							</div>
						</div>

						{#if row.items_count !== null || row.reach_count !== null}
							<div class="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-muted">
								{#if row.items_count !== null}
									<span>{row.items_count.toLocaleString()} {label(platform, 'items')}</span>
								{/if}
								{#if row.reach_count !== null}
									<span>{row.reach_count.toLocaleString()} {label(platform, 'reach')}</span>
								{/if}
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</div>

<Modal open={formOpen} onclose={() => (formOpen = false)} title={i18n.t('portfolioSettings.formTitle')}>
	<div class="space-y-4">
		{#if visiblePlatforms.length === 0}
			<p class="text-sm text-text-muted">{i18n.t('portfolioSettings.noPlatforms')}</p>
		{:else}
			<div class="space-y-1">
				<span class="text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.t('portfolioSettings.platformLabel')}
				</span>
				<Select items={platformItems} bind:value={platformSlug} shape="rounded" />
			</div>

			<Input
				label={i18n.t('portfolioSettings.handleLabel')}
				placeholder={i18n.t('portfolioSettings.handlePlaceholder')}
				bind:value={handle}
				oninput={syncUrl}
				data-testid="portfolio-handle"
			/>

			<div class="space-y-1">
				<Input
					label={i18n.t('portfolioSettings.urlLabel')}
					bind:value={profileUrl}
					data-testid="portfolio-url"
				/>
				<p class="text-xs text-text-muted">{i18n.t('portfolioSettings.urlHint')}</p>
			</div>

			<div class="grid gap-3 sm:grid-cols-2">
				<Input label={label(selected ?? undefined, 'items')} bind:value={itemsCount} />
				<Input label={label(selected ?? undefined, 'reach')} bind:value={reachCount} />
			</div>
			<p class="text-xs text-text-muted">{i18n.t('portfolioSettings.figuresOptional')}</p>

			{#if formError}
				<p class="rounded-lg border border-error/40 bg-error/5 px-3 py-2 text-sm text-error">
					{formError}
				</p>
			{/if}
		{/if}
	</div>

	{#snippet actions()}
		<Button variant="ghost" size="sm" onclick={() => (formOpen = false)}>
			{i18n.t('portfolioSettings.cancelCta')}
		</Button>
		<Button size="sm" loading={saving} disabled={!canSave} onclick={save} data-testid="portfolio-save">
			{i18n.t('portfolioSettings.saveCta')}
		</Button>
	{/snippet}
</Modal>
