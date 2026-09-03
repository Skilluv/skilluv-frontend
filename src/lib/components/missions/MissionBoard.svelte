<script lang="ts">
	/**
	 * The paid-mission board, for any domain.
	 *
	 * `/missions` is one endpoint for every domain and `skill_domain` narrows
	 * it — there is no `/design/missions` API and there is no `/ai/missions`
	 * one to write. The board was written for design (SKI-248) and everything
	 * in it except the title turned out to be domain-neutral, so it is a
	 * component now rather than a second copy: a design mission and an AI
	 * mission share a workflow, a commission and a dispute path, and a board
	 * per domain would have meant one rights badge per copy drifting apart.
	 *
	 * The rights badge is on every card rather than buried in the brief. It is
	 * the term people most often discover after signing.
	 */
	import { onMount } from 'svelte';
	import {
		missionsApi,
		STANDARD_COMMISSION_PERCENT,
		FEATURED_COMMISSION_PERCENT,
		FEATURED_COMMISSION_THRESHOLD
	} from '$lib/api/missions';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import FilterBar from '$components/ui/FilterBar.svelte';
	import Select from '$components/ui/Select.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import { MissionCard } from '$components/design';
	import {
		MISSION_IP_TERMS,
		MISSION_PAYMENT_MODELS,
		MISSION_URGENCIES,
		type Mission,
		type MissionType
	} from '$types';

	interface Props {
		/** `design`, `ai`, `audio`… what narrows the shared listing. */
		domain: string;
		/** Where a card's detail page lives, e.g. `/ai/missions`. */
		basePath: string;
		title: string;
		subtitle: string;
		/** "My missions" for this domain. Omitted hides the link. */
		minePath?: string;
		/** Sets the page's testid, so each board stays addressable in e2e. */
		testId?: string;
	}

	let { domain, basePath, title, subtitle, minePath, testId }: Props = $props();

	const PAGE_SIZE = 24;

	let missions = $state<Mission[]>([]);
	let types = $state<MissionType[]>([]);
	let typeFilter = $state('all');
	let ipFilter = $state('all');
	let paymentFilter = $state('all');
	let urgencyFilter = $state('all');
	let remoteOnly = $state(false);
	let loading = $state(true);
	let loadingMore = $state(false);
	let exhausted = $state(false);
	let loadError = $state('');

	/** Only this domain's types: the catalogue is shared across domains. */
	let domainTypes = $derived(types.filter((t) => t.skill_domain === domain));

	let typeItems = $derived([
		{ value: 'all', label: i18n.t('missions.filterAll') },
		...domainTypes.map((t) => ({ value: t.slug, label: t.name }))
	]);
	let ipItems = $derived([
		{ value: 'all', label: i18n.t('missions.filterAll') },
		...MISSION_IP_TERMS.map((t) => ({ value: t, label: i18n.t(`missions.ipTerms.${t}`) }))
	]);
	let paymentItems = $derived([
		{ value: 'all', label: i18n.t('missions.filterAll') },
		...MISSION_PAYMENT_MODELS.map((m) => ({
			value: m,
			label: i18n.t(`missions.paymentModels.${m}`)
		}))
	]);
	let urgencyItems = $derived([
		{ value: 'all', label: i18n.t('missions.filterAll') },
		...MISSION_URGENCIES.map((u) => ({ value: u, label: i18n.t(`missions.urgencies.${u}`) }))
	]);

	function params(offset: number) {
		return {
			skill_domain: domain,
			mission_type: typeFilter === 'all' ? undefined : typeFilter,
			ip_terms: ipFilter === 'all' ? undefined : ipFilter,
			payment_model: paymentFilter === 'all' ? undefined : paymentFilter,
			urgency: urgencyFilter === 'all' ? undefined : urgencyFilter,
			remote_only: remoteOnly || undefined,
			limit: PAGE_SIZE,
			offset
		};
	}

	async function load() {
		loading = true;
		loadError = '';
		try {
			const res = await missionsApi.browse(params(0));
			missions = res.data?.missions ?? [];
			exhausted = missions.length < PAGE_SIZE;
		} catch (err) {
			loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	async function loadMore() {
		loadingMore = true;
		try {
			const res = await missionsApi.browse(params(missions.length));
			const next = res.data?.missions ?? [];
			missions = [...missions, ...next];
			exhausted = next.length < PAGE_SIZE;
		} catch {
			// The rendered page stays; the button can be pressed again.
		} finally {
			loadingMore = false;
		}
	}

	onMount(async () => {
		const [typesRes] = await Promise.allSettled([missionsApi.types(), load()]);
		if (typesRes.status === 'fulfilled') types = typesRes.value.data?.mission_types ?? [];
	});
</script>

<svelte:head>
	<title>{title} | Skilluv</title>
	<meta name="description" content={subtitle} />
	<meta property="og:title" content="{title} | Skilluv" />
	<meta property="og:description" content={subtitle} />
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-8" data-testid={testId}>
	<header class="mb-8 flex flex-wrap items-end justify-between gap-4">
		<div class="max-w-2xl">
			<h1 class="text-4xl font-bold text-text-primary">{title}</h1>
			<p class="mt-3 text-lg text-text-muted">{subtitle}</p>
		</div>
		{#if auth.user && minePath}
			<Button variant="ghost" href={minePath}>
				{i18n.t('missions.mineTitle')}
			</Button>
		{/if}
	</header>

	<div class="grid gap-8 lg:grid-cols-4">
		<div class="lg:col-span-3">
			<FilterBar label={i18n.t('missions.filterType')} class="mb-6">
				<Select
					items={typeItems}
					value={typeFilter}
					onchange={(v) => {
						typeFilter = v;
						void load();
					}}
					size="sm"
					searchable
				/>
				<Select
					items={ipItems}
					value={ipFilter}
					onchange={(v) => {
						ipFilter = v;
						void load();
					}}
					size="sm"
				/>
				<Select
					items={paymentItems}
					value={paymentFilter}
					onchange={(v) => {
						paymentFilter = v;
						void load();
					}}
					size="sm"
				/>
				<Select
					items={urgencyItems}
					value={urgencyFilter}
					onchange={(v) => {
						urgencyFilter = v;
						void load();
					}}
					size="sm"
				/>
				<button
					type="button"
					onclick={() => {
						remoteOnly = !remoteOnly;
						void load();
					}}
					aria-pressed={remoteOnly}
					class="rounded-full border px-3 py-1.5 text-xs transition-colors duration-200 {remoteOnly
						? 'border-accent/40 bg-accent/10 text-accent'
						: 'border-border bg-surface-elevated text-text-muted hover:text-text-primary'}"
				>
					{i18n.t('missions.filterRemote')}
				</button>
			</FilterBar>

			{#if loading}
				<div class="grid gap-4 sm:grid-cols-2">
					{#each Array(4) as _, i (i)}
						<Skeleton class="h-56 w-full" rounded="xl" />
					{/each}
				</div>
			{:else if loadError}
				<div class="rounded-2xl border border-error/40 bg-error/5 p-6 text-center" role="alert">
					<p class="text-sm text-error">{loadError}</p>
					<Button variant="ghost" size="sm" class="mt-3" onclick={load}>
						{i18n.t('common.actions.retry')}
					</Button>
				</div>
			{:else if missions.length === 0}
				<EmptyState
					variant="search"
					title={i18n.t('missions.emptyTitle')}
					body={i18n.t('missions.emptyBody')}
				/>
			{:else}
				<div class="grid gap-4 sm:grid-cols-2">
					{#each missions as mission (mission.id)}
						<MissionCard {mission} {basePath} />
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

		<!-- How it works, for anyone who has never used a marketplace. -->
		<aside class="lg:sticky lg:top-24 lg:self-start">
			<div class="rounded-2xl border border-border bg-surface-elevated p-5">
				<h2 class="text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.t('missions.howItWorksTitle')}
				</h2>
				<p class="mt-3 text-sm text-text-muted">{i18n.t('missions.howItWorksBody')}</p>
				<p class="mt-4 border-t border-border pt-4 text-xs text-text-muted">
					{i18n.t('missions.commissionNotice', {
						standard: STANDARD_COMMISSION_PERCENT,
						featured: FEATURED_COMMISSION_PERCENT,
						threshold: FEATURED_COMMISSION_THRESHOLD
					})}
				</p>
			</div>
		</aside>
	</div>
</div>
