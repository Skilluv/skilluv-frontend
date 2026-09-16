<script lang="ts">
	/**
	 * The craft record of one domain, on a public profile.
	 *
	 * One component for `ai` and `audio` because the backend returns one
	 * shape: `services::craft_score` is per domain but not per formula, and
	 * says so — the six fields are identical "so somebody can compare their
	 * own two profiles". A component per domain would have been three copies
	 * of the same progress bar drifting apart.
	 *
	 * Addressed by username like the design record, so it needs no UUID and
	 * renders on anyone's profile.
	 *
	 * Audio adds highlights. Playing one is deliberately not offered here:
	 * every listen costs a signed, short-lived URL scoped to a slice, and a
	 * profile section is the wrong place to start handing those out.
	 */
	import { onMount } from 'svelte';
	import { ExternalLink, Music } from '@lucide/svelte';
	import { craftApi } from '$lib/api/craft';
	import { i18n } from '$lib/i18n';
	import Badge from '$components/ui/Badge.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import type {
		AudioCraftProfile,
		CommunicationCraftProfile,
		CommunicationHighlight,
		CraftDomain,
		CraftProfile,
		EducationCraftProfile,
		EducationHighlight
	} from '$types';

	interface Props {
		domain: CraftDomain;
		username: string;
	}

	let { domain, username }: Props = $props();

	let profile = $state<
		CraftProfile | AudioCraftProfile | CommunicationCraftProfile | EducationCraftProfile | null
	>(null);
	let loading = $state(true);
	let breakdownOpen = $state(false);

	let highlights = $derived(
		profile && 'highlights' in profile ? (profile as AudioCraftProfile).highlights : []
	);

	/**
	 * The two domains whose record carries a second list beyond its highlights.
	 *
	 * Communication counts the languages somebody has been credited with
	 * translating *into*. That is not the list at
	 * `/communication/review-languages`, where somebody says what they can
	 * review in: one is counted, the other is declared, and putting them in the
	 * same place would blur exactly the distinction the two endpoints exist to
	 * keep.
	 */
	let languages = $derived(
		profile && 'languages' in profile ? (profile as CommunicationCraftProfile).languages : []
	);
	let cohorts = $derived(
		profile && 'cohorts' in profile ? (profile as EducationCraftProfile).cohorts : []
	);

	let commHighlights = $derived(
		domain === 'communication' ? (highlights as unknown as CommunicationHighlight[]) : []
	);
	let eduHighlights = $derived(
		domain === 'education' ? (highlights as unknown as EducationHighlight[]) : []
	);

	/** Nothing to show at all: no score, no trade, nothing published. */
	let isEmpty = $derived(
		!!profile &&
			profile.craft_score === 0 &&
			profile.orientations.length === 0 &&
			highlights.length === 0 &&
			languages.length === 0 &&
			cohorts.length === 0
	);

	/** A cohort's start, as a month and a year. */
	function fmtCohortDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, { month: 'short', year: 'numeric' });
	}

	/** Terms that actually contributed, biggest first. */
	let contributingTerms = $derived(
		(profile?.breakdown ?? []).filter((t) => t.points > 0).sort((a, b) => b.points - a.points)
	);

	let scorePct = $derived.by(() => {
		if (!profile) return 0;
		const next = profile.next_tier_at;
		if (!next || next <= 0) return 100;
		return Math.min(100, Math.round((profile.craft_score / next) * 100));
	});

	async function load() {
		loading = true;
		try {
			const res =
				domain === 'audio' ? await craftApi.audioProfile(username) : await craftApi.profile(domain, username);
			profile = res.data;
		} catch {
			// A profile with no record in this domain answers 404, and so does
			// a hidden one. Either way the section simply does not render.
			profile = null;
		} finally {
			loading = false;
		}
	}

	/** `measured` is a whole number for counting terms, a raw figure otherwise. */
	function fmtMeasured(value: number): string {
		return Number.isInteger(value) ? String(value) : value.toFixed(1);
	}

	/** Seconds to `m:ss`, which is how anyone reads a track length. */
	function fmtDuration(seconds: number): string {
		const m = Math.floor(seconds / 60);
		const s = Math.floor(seconds % 60);
		return `${m}:${String(s).padStart(2, '0')}`;
	}

	onMount(load);
</script>

{#if loading}
	<Skeleton class="h-40 w-full" rounded="xl" />
{:else if profile && !isEmpty}
	<section
		class="rounded-xl border border-border bg-surface-elevated overflow-hidden"
		data-testid="profile-craft-section-{domain}"
	>
		<div class="border-b border-border px-5 py-3">
			<span class="text-xs font-bold uppercase tracking-wider text-text-muted">
				{i18n.t(`craftProfile.titles.${domain}`)}
			</span>
		</div>

		<div class="space-y-8 p-5">
			<div>
				<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
					{i18n.t('craftProfile.craftScoreTitle')}
				</p>
				<div class="mt-2 flex flex-wrap items-baseline gap-3">
					<span class="font-mono text-4xl font-black text-text-primary">
						{profile.craft_score.toLocaleString()}
					</span>
					<Badge variant="accent" size="sm">
						{i18n.t('craftProfile.tierLabel', { name: profile.tier_name })}
					</Badge>
					{#if profile.capped}
						<span class="text-xs text-text-muted">{i18n.t('craftProfile.cappedNotice')}</span>
					{/if}
				</div>
				<p class="mt-1 text-sm text-text-muted">{profile.tier_description}</p>

				{#if profile.next_tier_at}
					<div class="mt-3">
						<div
							class="h-2 w-full overflow-hidden rounded-full bg-surface-overlay"
							role="progressbar"
							aria-valuenow={scorePct}
							aria-valuemin={0}
							aria-valuemax={100}
							aria-label={i18n.t('craftProfile.craftScoreTitle')}
						>
							<div class="h-full rounded-full bg-accent" style="width: {scorePct}%"></div>
						</div>
						<p class="mt-1.5 text-xs text-text-muted">
							{i18n.t('craftProfile.nextTierAt', { n: profile.next_tier_at.toLocaleString() })}
						</p>
					</div>
				{/if}

				{#if contributingTerms.length > 0}
					<button
						type="button"
						onclick={() => (breakdownOpen = !breakdownOpen)}
						aria-expanded={breakdownOpen}
						class="mt-3 text-xs text-text-muted underline-offset-4 hover:text-text-primary hover:underline"
					>
						{i18n.t('craftProfile.breakdownTitle')}
					</button>
					{#if breakdownOpen}
						<ul class="mt-2 space-y-1.5" role="list">
							{#each contributingTerms as term (term.term)}
								<li class="flex items-baseline justify-between gap-3 text-xs">
									<span class="text-text-primary">{term.explanation}</span>
									<span class="shrink-0 font-mono text-text-muted">
										{fmtMeasured(term.measured)} → +{term.points}
									</span>
								</li>
							{/each}
						</ul>
					{/if}
				{/if}
			</div>

			{#if profile.orientations.length > 0}
				<div>
					<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
						{i18n.t('craftProfile.tradesTitle')}
					</p>
					<div class="mt-2 flex flex-wrap gap-2">
						{#each profile.orientations as slug (slug)}
							<span
								class="rounded-full border border-border bg-surface-overlay px-3 py-1 text-xs text-text-primary"
							>
								{slug}
							</span>
						{/each}
					</div>
				</div>
			{/if}

			{#if domain === 'audio' && highlights.length > 0}
				<div>
					<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
						{i18n.t('craftProfile.highlightsTitle')}
					</p>
					<p class="mt-1 text-xs text-text-muted">{i18n.t('craftProfile.highlightsHint')}</p>
					<ul class="mt-3 space-y-2" role="list">
						{#each highlights as work (work.slice_id)}
							<li class="rounded-xl border border-border p-4">
								<p class="flex items-center gap-2 text-sm font-semibold text-text-primary">
									<Music size={13} strokeWidth={2} class="shrink-0 text-text-muted" />
									{work.title}
								</p>
								<p class="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-text-muted">
									<span>{work.subtype}</span>
									{#if work.destination}
										<span>·</span><span>{work.destination}</span>
									{/if}
									{#if work.duration_seconds}
										<span>·</span><span class="font-mono">
											{fmtDuration(work.duration_seconds)}
										</span>
									{/if}
								</p>
								{#if work.external_url}
									<a
										href={work.external_url}
										target="_blank"
										rel="noopener noreferrer nofollow ugc"
										class="mt-2 inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-primary"
									>
										{i18n.t('craftProfile.openWork')}
										<ExternalLink size={11} strokeWidth={2} />
									</a>
								{/if}
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if languages.length > 0}
				<div>
					<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
						{i18n.t('craftProfile.languagesTitle')}
					</p>
					<!-- Counted from validated translations, not declared. That
					     difference is the whole reason the field exists. -->
					<p class="mt-1 text-xs text-text-muted">{i18n.t('craftProfile.languagesHint')}</p>
					<div class="mt-2 flex flex-wrap gap-2">
						{#each languages as row (row.language)}
							<span
								class="rounded-full border border-border bg-surface-overlay px-3 py-1 text-xs text-text-primary"
							>
								{row.language}
								<span class="ml-1 text-text-muted">{row.validated}</span>
							</span>
						{/each}
					</div>
				</div>
			{/if}

			{#if commHighlights.length > 0}
				<div>
					<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
						{i18n.t('craftProfile.readFirstTitle')}
					</p>
					<ul class="mt-3 space-y-2" role="list">
						{#each commHighlights as work (work.slice_id)}
							<li class="rounded-xl border border-border p-4">
								<p class="text-sm font-semibold text-text-primary">{work.title}</p>
								<p class="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-text-muted">
									<span>{work.subtype}</span>
									{#if work.target_languages.length > 0}
										<span>&middot;</span><span>{work.target_languages.join(', ')}</span>
									{/if}
									<!-- Only where the platform publishes the figure. A missing
									     count is not zero, and printing 0 would say nobody read
									     it. -->
									{#if work.views !== null}
										<span>&middot;</span><span class="font-mono">
											{i18n.t('craftProfile.views', { n: work.views.toLocaleString() })}
										</span>
									{/if}
									{#if work.engagement !== null}
										<span>&middot;</span><span class="font-mono">
											{i18n.t('craftProfile.engagement', {
												n: work.engagement.toLocaleString()
											})}
										</span>
									{/if}
								</p>
								{#if work.url}
									<a
										href={work.url}
										target="_blank"
										rel="noopener noreferrer nofollow ugc"
										class="mt-2 inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-primary"
									>
										{i18n.t('craftProfile.openWork')}
										<ExternalLink size={11} strokeWidth={2} />
									</a>
								{/if}
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if cohorts.length > 0}
				<div>
					<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
						{i18n.t('craftProfile.cohortsTitle')}
					</p>
					<ul class="mt-3 space-y-2" role="list">
						{#each cohorts as cohort (cohort.cohort_id)}
							<li class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
								<span class="font-medium text-text-primary">{cohort.name}</span>
								<span class="text-xs text-text-muted">
									{i18n.t('craftProfile.learners', { n: cohort.learners })}
								</span>
								<!-- Only where an outcome was actually recorded. A completion
								     rate computed over nobody reads as a result and is not
								     one. -->
								{#if cohort.completed !== null && cohort.outcomes_recorded > 0}
									<span class="text-xs text-text-muted">
										{i18n.t('craftProfile.completed', {
											n: cohort.completed,
											of: cohort.outcomes_recorded
										})}
									</span>
								{:else}
									<span class="text-xs text-text-muted">
										{i18n.t('craftProfile.noOutcomes')}
									</span>
								{/if}
								<span class="ml-auto text-xs text-text-muted">{fmtCohortDate(cohort.starts_at)}</span>
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if eduHighlights.length > 0}
				<div>
					<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
						{i18n.t('craftProfile.taughtTitle')}
					</p>
					<ul class="mt-3 space-y-2" role="list">
						{#each eduHighlights as work (work.slice_id)}
							<li class="rounded-xl border border-border p-4">
								<p class="text-sm font-semibold text-text-primary">{work.title}</p>
								<p class="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-text-muted">
									<span>{work.subtype}</span>
									{#if work.target_audience}
										<span>&middot;</span><span>{work.target_audience}</span>
									{/if}
									{#if work.adoptions > 0}
										<span>&middot;</span><span>
											{i18n.t('craftProfile.adoptions', { n: work.adoptions })}
										</span>
									{/if}
								</p>
								{#if work.url}
									<a
										href={work.url}
										target="_blank"
										rel="noopener noreferrer nofollow ugc"
										class="mt-2 inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-primary"
									>
										{i18n.t('craftProfile.openWork')}
										<ExternalLink size={11} strokeWidth={2} />
									</a>
								{/if}
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			<p class="border-t border-border pt-4 text-xs text-text-muted">
				{i18n.t('craftProfile.notAClaim')}
			</p>
		</div>
	</section>
{/if}
