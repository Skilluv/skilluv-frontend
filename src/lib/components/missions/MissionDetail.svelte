<script lang="ts">
	/**
	 * One mission: the brief, what counts as done, and the terms.
	 *
	 * Written for design (SKI-248) and domain-neutral in everything but its
	 * links, so it is a component: `/missions/{slug}` is one endpoint for
	 * every domain, and a rights block reads the same whoever is signing.
	 *
	 * The rights and the payment model get their own block rather than a line
	 * in the brief. NDA is a flag and nothing more server-side — there is no
	 * signing endpoint — so the page says the company will send it rather than
	 * offering a signature it cannot take.
	 */
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { CalendarClock, Clock, Globe, Lock } from '@lucide/svelte';
	import { missionsApi } from '$lib/api/missions';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import { IpTermsBadge, MissionCard } from '$components/design';
	import type { Mission } from '$types';

	interface Props {
		/** `design`, `ai`… narrows the shared listing where it is queried. */
		domain: string;
		/** Where this domain's board lives, e.g. `/ai/missions`. */
		basePath: string;
		/** The board's name, for the back-links. */
		boardTitle: string;
	}

	let { domain, basePath, boardTitle }: Props = $props();

	let slug = $derived($page.params.slug ?? '');

	let mission = $state<Mission | null>(null);
	let similar = $state<Mission[]>([]);
	let loading = $state(true);
	let loadError = $state('');

	let isOpen = $derived(mission?.status === 'published');
	let closesPassed = $derived(
		mission?.applications_close_at
			? new Date(mission.applications_close_at).getTime() < Date.now()
			: false
	);
	let canApply = $derived(!!auth.user && isOpen && !closesPassed);

	let priceLabel = $derived.by(() => {
		if (!mission) return '';
		if (mission.payment_model === 'per_hour' && mission.hourly_rate_eur) {
			return `${fmtEur(mission.hourly_rate_eur)} / h`;
		}
		if (mission.payment_model === 'revenue_share' && mission.revenue_share_percent) {
			return `${mission.revenue_share_percent}%`;
		}
		if (mission.budget_eur) return fmtEur(mission.budget_eur);
		return i18n.t('missions.budgetUnset');
	});

	function fmtEur(value: string): string {
		const amount = Number(value);
		if (!Number.isFinite(amount)) return value;
		return new Intl.NumberFormat(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', {
			style: 'currency',
			currency: 'EUR',
			maximumFractionDigits: 0
		}).format(amount);
	}

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}

	function label(group: string, value: string): string {
		const key = `missions.${group}.${value}`;
		const translated = i18n.t(key);
		return translated === key ? value : translated;
	}

	async function load() {
		loading = true;
		loadError = '';
		try {
			const res = await missionsApi.get(slug);
			mission = res.data.mission;

			// Same type, still open. Best-effort: a failure here costs a sidebar.
			try {
				const others = await missionsApi.browse({
					skill_domain: domain,
					mission_type: mission.mission_type_slug,
					limit: 4
				});
				similar = (others.data?.missions ?? []).filter((m) => m.slug !== slug).slice(0, 3);
			} catch {
				similar = [];
			}
		} catch (err) {
			loadError =
				err instanceof SkilluError && err.code === 'RESOURCE_NOT_FOUND'
					? i18n.t('errors.notFound')
					: err instanceof SkilluError
						? err.message
						: i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	onMount(load);
</script>

<svelte:head>
	<title>{mission ? `${mission.title} — Skilluv` : `${boardTitle} — Skilluv`}</title>
	{#if mission}
		<meta name="description" content={mission.description.slice(0, 200)} />
		<meta property="og:title" content="{mission.title} — Skilluv" />
		<meta property="og:description" content={mission.description.slice(0, 200)} />
	{/if}
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-8" data-testid="design-mission-detail">
	{#if loading}
		<Skeleton class="h-40 w-full" rounded="xl" />
		<Skeleton class="mt-6 h-64 w-full" rounded="xl" />
	{:else if loadError}
		<div class="rounded-2xl border border-error/40 bg-error/5 p-6 text-center" role="alert">
			<p class="text-sm text-error">{loadError}</p>
			<Button variant="ghost" size="sm" class="mt-3" href={basePath}>
				{i18n.t('missions.backToList')}
			</Button>
		</div>
	{:else if mission}
		<a
			href={basePath}
			class="text-sm text-text-muted underline-offset-4 hover:text-text-primary hover:underline"
		>
			{i18n.t('missions.backToList')}
		</a>

		<header class="mt-3">
			<div class="flex flex-wrap items-center gap-2">
				<Badge variant={isOpen ? 'success' : 'default'} size="sm">
					{label('statuses', mission.status)}
				</Badge>
				<Badge variant={mission.urgency === 'critical' ? 'error' : 'default'} size="sm">
					{label('urgencies', mission.urgency)}
				</Badge>
			</div>
			<h1 class="mt-3 text-3xl font-bold text-text-primary sm:text-4xl">{mission.title}</h1>
			<p class="mt-2 text-xs uppercase tracking-wide text-text-muted">
				{mission.mission_type_slug}
				{#if mission.orientation_slug}
					<span class="mx-1.5">·</span>{mission.orientation_slug}
				{/if}
			</p>
		</header>

		<div class="mt-6 grid gap-6 lg:grid-cols-3">
			<div class="space-y-6 lg:col-span-2">
				<section class="rounded-2xl border border-border bg-surface-elevated p-6">
					<h2 class="text-xs font-bold uppercase tracking-wider text-text-muted">
						{i18n.t('missions.descriptionTitle')}
					</h2>
					<p class="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-text-primary">
						{mission.description}
					</p>
				</section>

				<section class="rounded-2xl border border-border bg-surface-elevated p-6">
					<h2 class="text-xs font-bold uppercase tracking-wider text-text-muted">
						{i18n.t('missions.acceptanceTitle')}
					</h2>
					<p class="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-text-primary">
						{mission.acceptance_criteria}
					</p>
				</section>

				{#if mission.nda_required}
					<p
						class="flex items-start gap-2 rounded-2xl border border-border bg-surface-overlay p-4 text-sm text-text-muted"
						role="note"
					>
						<Lock size={15} strokeWidth={2} class="mt-0.5 shrink-0" />
						{i18n.t('missions.ndaNotice')}
					</p>
				{/if}
			</div>

			<div class="space-y-6">
				<section class="rounded-2xl border border-border bg-surface-elevated p-6">
					<p class="text-3xl font-black text-text-primary">{priceLabel}</p>
					<p class="mt-1 text-xs text-text-muted">
						{label('paymentModels', mission.payment_model)}
					</p>

					<dl class="mt-5 space-y-3 border-t border-border pt-4 text-sm">
						<div>
							<dt class="text-xs uppercase tracking-wide text-text-muted">
								{i18n.t('missions.filterIpTerms')}
							</dt>
							<dd class="mt-1.5"><IpTermsBadge terms={mission.ip_terms} withHint /></dd>
						</div>
						<div class="flex items-center justify-between gap-2">
							<dt class="text-text-muted">{i18n.t('missions.deliverableFormats.github_pr')}</dt>
							<dd class="text-text-primary">
								{label('deliverableFormats', mission.deliverable_format)}
							</dd>
						</div>
						{#if mission.estimated_days}
							<div class="flex items-center justify-between gap-2">
								<dt class="inline-flex items-center gap-1.5 text-text-muted">
									<Clock size={12} strokeWidth={2} />
									{i18n.t('missions.estimatedDays', { n: mission.estimated_days })}
								</dt>
								<dd></dd>
							</div>
						{/if}
						{#if mission.remote_only}
							<div class="inline-flex items-center gap-1.5 text-text-muted">
								<Globe size={12} strokeWidth={2} />
								{i18n.t('missions.remoteOnly')}
							</div>
						{/if}
						{#if mission.applications_close_at}
							<div class="inline-flex items-center gap-1.5 text-text-muted">
								<CalendarClock size={12} strokeWidth={2} />
								{i18n.t('missions.closesAt', {
									date: fmtDate(mission.applications_close_at)
								})}
							</div>
						{/if}
					</dl>

					<div class="mt-5 border-t border-border pt-4">
						{#if canApply}
							<Button variant="accent" href="{basePath}/{mission.slug}/apply" class="w-full">
								{i18n.t('missions.applyCta')}
							</Button>
						{:else if !auth.user}
							<Button
								variant="accent"
								href="/auth/login?redirect={basePath}/{mission.slug}"
								class="w-full"
							>
								{i18n.t('common.nav.login')}
							</Button>
						{:else}
							<p class="text-sm text-text-muted">{i18n.t('missions.applyClosed')}</p>
						{/if}
					</div>
				</section>

				{#if similar.length > 0}
					<section>
						<h2 class="mb-3 text-xs font-bold uppercase tracking-wider text-text-muted">
							{boardTitle}
						</h2>
						<div class="space-y-3">
							{#each similar as other (other.id)}
								<MissionCard mission={other} />
							{/each}
						</div>
					</section>
				{/if}
			</div>
		</div>
	{/if}
</div>
