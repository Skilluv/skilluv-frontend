<script lang="ts">
	/**
	 * The ops record: objectives held, incidents handled, money taken out.
	 *
	 * Every objective carries the figure **and where it came from**, so a
	 * reader can go and check rather than take the tier's word for it. Cost
	 * work carries whether the service still met its objective afterwards —
	 * halving a bill by breaking the thing is not a saving.
	 *
	 * Certifications sit after the attestations and are never mixed into them:
	 * one is a thing Skilluv stands behind, the other a thing Skilluv checked
	 * a link to.
	 */
	import { onMount } from 'svelte';
	import { ExternalLink } from '@lucide/svelte';
	import { domainProfilesApi } from '$lib/api/domain_profiles';
	import { i18n } from '$lib/i18n';
	import Badge from '$components/ui/Badge.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import DomainRecord from '../DomainRecord.svelte';
	import type { OpsProfile } from '$types';

	interface Props {
		username: string;
	}

	let { username }: Props = $props();

	let profile = $state<OpsProfile | null>(null);
	let loading = $state(true);

	let isEmpty = $derived(
		!!profile &&
			profile.score.score === 0 &&
			profile.objectives.length === 0 &&
			profile.incidents.length === 0 &&
			profile.cost_work.length === 0 &&
			profile.orientations.length === 0
	);

	async function load() {
		try {
			profile = (await domainProfilesApi.ops(username)).data;
		} catch {
			profile = null;
		} finally {
			loading = false;
		}
	}

	/** Minutes read as minutes under an hour, and as hours above. */
	function fmtMinutes(n: number | null): string {
		if (n === null) return '—';
		return n < 60 ? `${n} min` : `${(n / 60).toFixed(1)} h`;
	}

	/** NUMERIC over JSON arrives as a string; parse once, here. */
	function fmtMoney(value: string | number | null, currency: string | null): string {
		if (value === null) return '—';
		const amount = Number(value);
		if (!Number.isFinite(amount)) return String(value);
		return new Intl.NumberFormat(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', {
			style: 'currency',
			currency: currency || 'EUR',
			maximumFractionDigits: 0
		}).format(amount);
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
		domain="ops"
		score={profile.score}
		orientations={profile.orientations}
		attestations={profile.attestations}
	>
		{#snippet sections()}
			<!-- A snippet is its own closure: the narrowing above does not
			     reach in here, so it is stated again. -->
			{#if profile}
			{#if profile.objectives.length > 0}
				<div>
					<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
						{i18n.t('domainRecord.ops.objectivesTitle')}
					</p>
					<p class="mt-1 text-xs text-text-muted">{i18n.t('domainRecord.ops.objectivesHint')}</p>
					<ul class="mt-3 space-y-2" role="list">
						{#each profile.objectives as objective (objective.service_name + objective.window_days)}
							<li class="rounded-xl border border-border p-4">
								<div class="flex flex-wrap items-center gap-2">
									<span class="text-sm font-medium text-text-primary">
										{objective.service_name}
									</span>
									{#if objective.met !== null}
										<Badge variant={objective.met ? 'success' : 'warning'} size="sm">
											{objective.met
												? i18n.t('domainRecord.ops.met')
												: i18n.t('domainRecord.ops.missed')}
										</Badge>
									{/if}
									{#if objective.evidence_url}
										<a
											href={objective.evidence_url}
											target="_blank"
											rel="noopener noreferrer nofollow ugc"
											class="ml-auto inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-primary"
										>
											{i18n.t('domainRecord.ops.evidence')}
											<ExternalLink size={11} strokeWidth={2} />
										</a>
									{/if}
								</div>
								<p class="mt-1.5 font-mono text-xs text-text-muted">
									{i18n.t('domainRecord.ops.objectiveFigures', {
										achieved:
											objective.achieved_percent === null
												? '—'
												: String(objective.achieved_percent),
										target: String(objective.target_percent),
										days: objective.window_days
									})}
								</p>
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if profile.incidents.length > 0}
				<div>
					<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
						{i18n.t('domainRecord.ops.incidentsTitle')}
					</p>
					<ul class="mt-2 space-y-1.5" role="list">
						{#each profile.incidents as incident, i (i)}
							<li class="flex flex-wrap items-center gap-x-3 text-sm">
								<Badge variant="default" size="sm">{incident.severity}</Badge>
								<span class="font-mono text-xs text-text-muted">
									{i18n.t('domainRecord.ops.detect', {
										v: fmtMinutes(incident.time_to_detect_minutes)
									})}
								</span>
								<span class="font-mono text-xs text-text-muted">
									{i18n.t('domainRecord.ops.resolve', {
										v: fmtMinutes(incident.time_to_resolve_minutes)
									})}
								</span>
								{#if incident.postmortem_published_at}
									<span class="ml-auto text-xs text-text-muted">
										{i18n.t('domainRecord.ops.postmortem', {
											date: fmtDate(incident.postmortem_published_at)
										})}
									</span>
								{/if}
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if profile.cost_work.length > 0}
				<div>
					<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
						{i18n.t('domainRecord.ops.costTitle')}
					</p>
					<ul class="mt-2 space-y-1.5" role="list">
						{#each profile.cost_work as work, i (i)}
							<li class="flex flex-wrap items-center gap-x-3 text-sm">
								<span class="text-text-primary">{work.scope}</span>
								<span class="font-mono text-xs text-text-muted">
									{fmtMoney(work.monthly_before, work.currency)} →
									{fmtMoney(work.monthly_after, work.currency)}
								</span>
								<!-- The figure that decides whether it was a saving at all. -->
								{#if work.service_still_meets_slo === false}
									<span class="ml-auto text-xs text-warning">
										{i18n.t('domainRecord.ops.sloBroken')}
									</span>
								{:else if work.service_still_meets_slo}
									<span class="ml-auto text-xs text-text-muted">
										{i18n.t('domainRecord.ops.sloKept')}
									</span>
								{/if}
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if profile.credentials.length > 0}
				<div>
					<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
						{i18n.t('domainRecord.credentialsTitle')}
					</p>
					<p class="mt-1 text-xs text-text-muted">{i18n.t('domainRecord.credentialsHint')}</p>
					<ul class="mt-2 space-y-1.5" role="list">
						{#each profile.credentials as credential (credential.issuer + credential.name)}
							<li class="flex flex-wrap items-center gap-x-3 text-sm">
								<span class="text-text-primary">{credential.name}</span>
								<span class="text-xs text-text-muted">{credential.issuer}</span>
								{#if credential.expires_on}
									<span class="ml-auto text-xs text-text-muted">
										{i18n.t('domainRecord.until', { date: fmtDate(credential.expires_on) })}
									</span>
								{/if}
							</li>
						{/each}
					</ul>
				</div>
			{/if}
			{/if}
		{/snippet}
	</DomainRecord>
{/if}
