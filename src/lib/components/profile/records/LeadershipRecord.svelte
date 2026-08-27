<script lang="ts">
	/**
	 * The leadership record: documents, cohorts led to their end, retrospectives.
	 *
	 * The hard part of this trade is that most of the work is confidential.
	 * The backend answers it by carrying two lists: artefacts a reader can
	 * open, and a **summary of the confidential work said in the abstract** —
	 * what kind, at what scale, in what industry, and never what or where.
	 * This page shows both, apart, because collapsing them would either leak
	 * or erase.
	 *
	 * A cohort carries how many joined and how many finished, so the claim is
	 * checkable. `left_for_work` is counted separately and is not a failure:
	 * somebody leaving a cohort for a job is the cohort working.
	 */
	import { onMount } from 'svelte';
	import { ExternalLink, Lock } from '@lucide/svelte';
	import { domainProfilesApi } from '$lib/api/domain_profiles';
	import { i18n } from '$lib/i18n';
	import Badge from '$components/ui/Badge.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import DomainRecord from '../DomainRecord.svelte';
	import type { LeadershipProfile } from '$types';

	interface Props {
		username: string;
	}

	let { username }: Props = $props();

	let profile = $state<LeadershipProfile | null>(null);
	let loading = $state(true);

	let isEmpty = $derived(
		!!profile &&
			profile.score.score === 0 &&
			profile.artefacts.length === 0 &&
			profile.confidential_summary.length === 0 &&
			profile.cohorts.length === 0 &&
			profile.orientations.length === 0
	);

	async function load() {
		try {
			profile = (await domainProfilesApi.leadership(username)).data;
		} catch {
			profile = null;
		} finally {
			loading = false;
		}
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
		domain="leadership"
		score={profile.score}
		orientations={profile.orientations}
		attestations={profile.attestations}
	>
		{#snippet sections()}
			<!-- A snippet is its own closure: the narrowing above does not
			     reach in here, so it is stated again. -->
			{#if profile}
			{#if profile.artefacts.length > 0}
				<div>
					<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
						{i18n.t('domainRecord.leadership.artefactsTitle')}
					</p>
					<ul class="mt-2 space-y-2" role="list">
						{#each profile.artefacts as artefact (artefact.title + artefact.subtype)}
							<li class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
								{#if artefact.url}
									<a
										href={artefact.url}
										target="_blank"
										rel="noopener noreferrer nofollow ugc"
										class="inline-flex items-center gap-1 text-text-primary hover:text-accent"
									>
										{artefact.title}
										<ExternalLink size={11} strokeWidth={2} />
									</a>
								{:else}
									<span class="text-text-primary">{artefact.title}</span>
								{/if}
								<span class="text-xs text-text-muted">{artefact.subtype}</span>
								{#if artefact.redaction_state !== 'public'}
									<span class="inline-flex items-center gap-1 text-xs text-text-muted">
										<Lock size={11} strokeWidth={2} />
										{artefact.redaction_state}
									</span>
								{/if}
								{#if artefact.adopted}
									<!-- A document nobody adopted is a document. -->
									<Badge variant="success" size="sm">
										{i18n.t('domainRecord.leadership.adopted')}
									</Badge>
								{/if}
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if profile.confidential_summary.length > 0}
				<div>
					<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
						{i18n.t('domainRecord.leadership.confidentialTitle')}
					</p>
					<p class="mt-1 text-xs text-text-muted">
						{i18n.t('domainRecord.leadership.confidentialHint')}
					</p>
					<ul class="mt-2 space-y-1.5" role="list">
						{#each profile.confidential_summary as row, i (i)}
							<li class="flex flex-wrap items-center gap-x-3 text-sm">
								<Lock size={12} strokeWidth={2} class="shrink-0 text-text-muted" />
								<span class="text-text-primary">{row.context}</span>
								<span class="text-xs text-text-muted">{row.subtype}</span>
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if profile.cohorts.length > 0}
				<div>
					<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
						{i18n.t('domainRecord.leadership.cohortsTitle')}
					</p>
					<ul class="mt-2 space-y-2" role="list">
						{#each profile.cohorts as cohort (cohort.slug)}
							<li class="rounded-xl border border-border p-4">
								<div class="flex flex-wrap items-center gap-2">
									<span class="text-sm font-medium text-text-primary">{cohort.slug}</span>
									{#if cohort.led_to_the_end}
										<Badge variant="success" size="sm">
											{i18n.t('domainRecord.leadership.ledToEnd')}
										</Badge>
									{/if}
									{#if cohort.concluded_at}
										<span class="ml-auto text-xs text-text-muted">
											{fmtDate(cohort.concluded_at)}
										</span>
									{/if}
								</div>
								<p class="mt-1.5 font-mono text-xs text-text-muted">
									{i18n.t('domainRecord.leadership.cohortFigures', {
										graduated: cohort.graduated_total,
										joined: cohort.joined_total
									})}
									{#if cohort.left_for_work > 0}
										<!-- Counted apart, because leaving for a job is the
										     cohort working, not failing. -->
										<span class="ml-2">
											{i18n.t('domainRecord.leadership.leftForWork', {
												n: cohort.left_for_work
											})}
										</span>
									{/if}
								</p>
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if profile.retrospectives.length > 0}
				<div>
					<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
						{i18n.t('domainRecord.leadership.retrosTitle')}
					</p>
					<p class="mt-1 text-xs text-text-muted">{i18n.t('domainRecord.leadership.retrosHint')}</p>
					<ul class="mt-2 space-y-1.5" role="list">
						{#each profile.retrospectives as retro (retro.held_on)}
							<li class="flex flex-wrap items-center gap-x-3 text-sm">
								<span class="text-text-primary">{fmtDate(retro.held_on)}</span>
								<span class="font-mono text-xs text-text-muted">
									{i18n.t('domainRecord.leadership.retroFigures', {
										resolved: retro.actions_resolved_in_window,
										total: retro.actions_total
									})}
								</span>
								{#if retro.followed_through}
									<Badge variant="success" size="sm">
										{i18n.t('domainRecord.leadership.followedThrough')}
									</Badge>
								{/if}
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if profile.target_domain_breakdown.length > 0}
				<div>
					<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
						{i18n.t('domainRecord.targetDomainsTitle')}
					</p>
					<div class="mt-2 flex flex-wrap gap-2">
						{#each profile.target_domain_breakdown as row (row.target_domain)}
							<span
								class="rounded-full border border-border bg-surface-overlay px-3 py-1 text-xs text-text-primary"
							>
								{row.name || row.target_domain}
								<span class="ml-1 text-text-muted">{row.artefacts}</span>
							</span>
						{/each}
					</div>
				</div>
			{/if}
			{/if}
		{/snippet}
	</DomainRecord>
{/if}
