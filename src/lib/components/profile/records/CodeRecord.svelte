<script lang="ts">
	/**
	 * The code record: languages, published packages, missions, accounts elsewhere.
	 *
	 * The odd one of the five: its score is nested under `craft_score` rather
	 * than `score`, like design and unlike the other three. Same object either
	 * way — see `domain_profiles.ts` on why that divergence is a backend ticket.
	 *
	 * `stored_score` is what the sorted listings use, and it is shown next to
	 * the live figure so a discrepancy is visible rather than confusing. The
	 * live one is recomputed on every read; the stored one is an hourly sweep.
	 *
	 * Package figures carry the date they were read. A download count with no
	 * date is a number nobody can weigh.
	 */
	import { onMount } from 'svelte';
	import { ExternalLink, RefreshCw } from '@lucide/svelte';
	import { domainProfilesApi } from '$lib/api/domain_profiles';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import DomainRecord from '../DomainRecord.svelte';
	import type { CodeProfile } from '$types';

	interface Props {
		username: string;
		/** Shows the recompute action, which only acts on your own score. */
		isOwn?: boolean;
	}

	let { username, isOwn = false }: Props = $props();

	let profile = $state<CodeProfile | null>(null);
	let loading = $state(true);
	let recomputing = $state(false);

	let isEmpty = $derived(
		!!profile &&
			profile.craft_score.score === 0 &&
			profile.languages.length === 0 &&
			profile.published_packages.length === 0 &&
			profile.orientations.length === 0
	);

	/**
	 * Said only when the two actually differ: a gap means the listings are
	 * sorting on a figure this page has already moved past.
	 */
	let staleNote = $derived.by(() => {
		if (!profile) return undefined;
		const stored = profile.stored_score;
		if (stored === null || stored === profile.craft_score.score) return undefined;
		return i18n.t('domainRecord.code.storedDiffers', { n: stored.toLocaleString() });
	});

	async function load() {
		try {
			profile = (await domainProfilesApi.code(username)).data;
		} catch {
			profile = null;
		} finally {
			loading = false;
		}
	}

	async function recompute() {
		recomputing = true;
		try {
			await domainProfilesApi.recomputeCode();
			toast.success(i18n.t('designProfile.recomputedToast'));
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			recomputing = false;
		}
	}

	function fmtCount(n: number): string {
		return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
	}

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, { month: 'short', year: 'numeric' });
	}

	onMount(load);
</script>

{#if loading}
	<Skeleton class="h-40 w-full" rounded="xl" />
{:else if profile && !isEmpty}
	<DomainRecord
		domain="code"
		score={profile.craft_score}
		orientations={profile.orientations}
		attestations={profile.attestations}
		scoreNote={staleNote}
	>
		{#snippet action()}
			{#if isOwn}
				<Button variant="ghost" size="sm" loading={recomputing} onclick={recompute}>
					<span class="inline-flex items-center gap-1.5">
						<RefreshCw size={12} strokeWidth={2} />
						{i18n.t('designProfile.recomputeCta')}
					</span>
				</Button>
			{/if}
		{/snippet}

		{#snippet sections()}
			<!-- A snippet is its own closure: the narrowing above does not
			     reach in here, so it is stated again. -->
			{#if profile}
			{#if profile.languages.length > 0}
				<div>
					<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
						{i18n.t('domainRecord.code.languagesTitle')}
					</p>
					<div class="mt-2 flex flex-wrap gap-2">
						{#each profile.languages as language (language.language)}
							<span
								class="rounded-full border border-border bg-surface-overlay px-3 py-1 text-xs text-text-primary"
							>
								{language.language}
								<span class="ml-1 text-text-muted">{language.artefacts}</span>
							</span>
						{/each}
					</div>
				</div>
			{/if}

			{#if profile.published_packages.length > 0}
				<div>
					<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
						{i18n.t('domainRecord.code.packagesTitle')}
					</p>
					<ul class="mt-2 space-y-1.5" role="list">
						{#each profile.published_packages as pkg (pkg.registry + pkg.package_name)}
							<li class="flex flex-wrap items-center gap-x-3 text-sm">
								<span class="font-mono text-text-primary">{pkg.package_name}</span>
								<Badge variant="default" size="sm">{pkg.registry}</Badge>
								{#if pkg.latest_version}
									<span class="font-mono text-xs text-text-muted">{pkg.latest_version}</span>
								{/if}
								{#if pkg.downloads_recent !== null}
									<span class="font-mono text-xs text-text-muted">
										{fmtCount(pkg.downloads_recent)}
									</span>
								{/if}
								<!-- The date the figures were read: a count with no date is a
								     number nobody can weigh. -->
								{#if pkg.fetched_at}
									<span class="ml-auto text-xs text-text-muted">
										{i18n.t('domainRecord.code.readOn', { date: fmtDate(pkg.fetched_at) })}
									</span>
								{/if}
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if profile.missions_completed.length > 0}
				<div>
					<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
						{i18n.t('domainRecord.code.missionsTitle')}
					</p>
					<div class="mt-2 flex flex-wrap gap-2">
						{#each profile.missions_completed as mission (mission.mission_type)}
							<span
								class="rounded-full border border-border bg-surface-overlay px-3 py-1 text-xs text-text-primary"
							>
								{mission.mission_type}
								<span class="ml-1 text-text-muted">{mission.count}</span>
							</span>
						{/each}
					</div>
				</div>
			{/if}

			{#if profile.portfolios.length > 0}
				<div>
					<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
						{i18n.t('domainRecord.code.portfoliosTitle')}
					</p>
					<ul class="mt-2 space-y-1.5" role="list">
						{#each profile.portfolios as portfolio (portfolio.platform + portfolio.handle)}
							<li class="flex flex-wrap items-center gap-x-3 text-sm">
								<a
									href={portfolio.profile_url}
									target="_blank"
									rel="noopener noreferrer nofollow ugc"
									class="inline-flex items-center gap-1 text-text-primary hover:text-accent"
								>
									{portfolio.handle}
									<ExternalLink size={11} strokeWidth={2} />
								</a>
								<span class="text-xs text-text-muted">{portfolio.platform}</span>
								<!-- Proved and claimed are two different statements. -->
								<span class="ml-auto text-xs text-text-muted">
									{portfolio.verified
										? i18n.t('domainRecord.code.portfolioVerified')
										: i18n.t('domainRecord.code.portfolioDeclared')}
								</span>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
			{/if}
		{/snippet}
	</DomainRecord>
{/if}
