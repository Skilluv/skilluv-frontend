<script lang="ts">
	/**
	 * The quality record: defects whose fix shipped, and test runs somebody
	 * checked.
	 *
	 * Two things the backend is careful about and this page keeps:
	 *
	 *   * A confirmed defect carries the **fix link** and not the reproduction.
	 *     A public list of reproductions for defects in other people's products
	 *     would be a disclosure channel nobody agreed to.
	 *   * Only **verified** test runs are listed. Anybody can point at a green
	 *     badge on a repository they control.
	 */
	import { onMount } from 'svelte';
	import { ExternalLink } from '@lucide/svelte';
	import { domainProfilesApi } from '$lib/api/domain_profiles';
	import { i18n } from '$lib/i18n';
	import Badge from '$components/ui/Badge.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import DomainRecord from '../DomainRecord.svelte';
	import type { QualityProfile } from '$types';

	interface Props {
		username: string;
	}

	let { username }: Props = $props();

	let profile = $state<QualityProfile | null>(null);
	let loading = $state(true);

	let isEmpty = $derived(
		!!profile &&
			profile.score.score === 0 &&
			profile.confirmed_bugs.length === 0 &&
			profile.verified_test_runs.length === 0 &&
			profile.orientations.length === 0
	);

	/** Severity drives the eye here: a critical defect is not a typo. */
	const severityVariant: Record<string, 'error' | 'warning' | 'default'> = {
		critical: 'error',
		high: 'error',
		medium: 'warning',
		low: 'default',
		trivial: 'default'
	};

	async function load() {
		try {
			profile = (await domainProfilesApi.quality(username)).data;
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
		domain="quality"
		score={profile.score}
		orientations={profile.orientations}
		attestations={profile.attestations}
	>
		{#snippet sections()}
			<!-- A snippet is its own closure: the narrowing above does not
			     reach in here, so it is stated again. -->
			{#if profile}
			{#if profile.confirmed_bugs.length > 0}
				<div>
					<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
						{i18n.t('domainRecord.quality.bugsTitle')}
					</p>
					<p class="mt-1 text-xs text-text-muted">{i18n.t('domainRecord.quality.bugsHint')}</p>
					<ul class="mt-3 space-y-2" role="list">
						{#each profile.confirmed_bugs as bug (bug.title + bug.fix_confirmed_at)}
							<li class="rounded-xl border border-border p-4">
								<div class="flex flex-wrap items-center gap-2">
									<Badge variant={severityVariant[bug.severity] ?? 'default'} size="sm">
										{bug.severity}
									</Badge>
									{#if !bug.severity_reviewed}
										<!-- Said out loud: a severity nobody adjusted is the
										     reporter's own reading. -->
										<span class="text-xs text-text-muted">
											{i18n.t('domainRecord.quality.severityUnreviewed')}
										</span>
									{/if}
									<span class="ml-auto text-xs text-text-muted">
										{fmtDate(bug.fix_confirmed_at)}
									</span>
								</div>
								<p class="mt-1.5 text-sm text-text-primary">{bug.title}</p>
								<div class="mt-2 flex flex-wrap items-center gap-x-3 text-xs text-text-muted">
									{#if bug.reproducibility}
										<span>{bug.reproducibility}</span>
									{/if}
									{#if bug.fix_url}
										<a
											href={bug.fix_url}
											target="_blank"
											rel="noopener noreferrer nofollow ugc"
											class="ml-auto inline-flex items-center gap-1 hover:text-text-primary"
										>
											{i18n.t('domainRecord.quality.seeTheFix')}
											<ExternalLink size={11} strokeWidth={2} />
										</a>
									{/if}
								</div>
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if profile.verified_test_runs.length > 0}
				<div>
					<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
						{i18n.t('domainRecord.quality.testRunsTitle')}
					</p>
					<p class="mt-1 text-xs text-text-muted">{i18n.t('domainRecord.quality.testRunsHint')}</p>
					<ul class="mt-3 space-y-2" role="list">
						{#each profile.verified_test_runs as run (run.source + run.imported_at)}
							<li class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
								<span class="font-medium text-text-primary">{run.source}</span>
								{#if run.tests_total !== null}
									<span class="font-mono text-xs text-text-muted">
										{i18n.t('domainRecord.quality.testCount', {
											total: run.tests_total,
											failed: run.tests_failed ?? 0
										})}
									</span>
								{/if}
								{#if run.coverage_percent !== null}
									<span class="font-mono text-xs text-text-muted">
										{run.coverage_percent}%
									</span>
								{/if}
								{#if run.report_url}
									<a
										href={run.report_url}
										target="_blank"
										rel="noopener noreferrer nofollow ugc"
										class="ml-auto text-xs text-text-muted hover:text-text-primary"
									>
										{i18n.t('domainRecord.openReport')}
									</a>
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
