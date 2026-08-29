<script lang="ts">
	/**
	 * The security record: confirmed findings, solved practice, credentials.
	 *
	 * The embargo is the invariant here, and it is enforced server-side, not
	 * by this page: **a finding still under embargo arrives without its
	 * title**, because the title of an embargoed finding is half the
	 * disclosure. The date arrives as a month for the same reason — a precise
	 * day narrows the window. So there is nothing to hide client-side; there
	 * is only the honest rendering of what was sent.
	 *
	 * Practice is a count and not a list. Forty rows of "solved a lab" is not
	 * a portfolio.
	 */
	import { onMount } from 'svelte';
	import { ExternalLink, ShieldCheck } from '@lucide/svelte';
	import { domainProfilesApi } from '$lib/api/domain_profiles';
	import { i18n } from '$lib/i18n';
	import Badge from '$components/ui/Badge.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import DomainRecord from '../DomainRecord.svelte';
	import type { SecurityProfile } from '$types';

	interface Props {
		username: string;
	}

	let { username }: Props = $props();

	let profile = $state<SecurityProfile | null>(null);
	let loading = $state(true);

	let isEmpty = $derived(
		!!profile &&
			profile.score.score === 0 &&
			profile.findings.length === 0 &&
			profile.practice.length === 0 &&
			profile.orientations.length === 0
	);

	const severityVariant: Record<string, 'error' | 'warning' | 'default'> = {
		critical: 'error',
		high: 'error',
		medium: 'warning',
		low: 'default',
		informational: 'default'
	};

	async function load() {
		try {
			profile = (await domainProfilesApi.security(username)).data;
		} catch {
			profile = null;
		} finally {
			loading = false;
		}
	}

	/** Practice, biggest first: the tier that was hardest is the one to read. */
	let practice = $derived([...(profile?.practice ?? [])].sort((a, b) => b.solved - a.solved));

	onMount(load);
</script>

{#if loading}
	<Skeleton class="h-40 w-full" rounded="xl" />
{:else if profile && !isEmpty}
	<DomainRecord
		domain="security"
		score={profile.score}
		orientations={profile.orientations}
		attestations={profile.attestations}
	>
		{#snippet sections()}
			<!-- A snippet is its own closure: the narrowing above does not
			     reach in here, so it is stated again. -->
			{#if profile}
			{#if profile.findings.length > 0}
				<div>
					<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
						{i18n.t('domainRecord.security.findingsTitle')}
					</p>
					<p class="mt-1 text-xs text-text-muted">{i18n.t('domainRecord.security.findingsHint')}</p>
					<ul class="mt-3 space-y-2" role="list">
						{#each profile.findings as finding (finding.id)}
							<li class="rounded-xl border border-border p-4">
								<div class="flex flex-wrap items-center gap-2">
									<Badge variant={severityVariant[finding.severity_tier] ?? 'default'} size="sm">
										{finding.severity_tier}
									</Badge>
									{#if finding.cvss_score !== null}
										<span class="font-mono text-xs text-text-muted">
											CVSS {finding.cvss_score.toFixed(1)}
										</span>
									{/if}
									{#if finding.cwe_id}
										<span class="font-mono text-xs text-text-muted">{finding.cwe_id}</span>
									{/if}
									{#if finding.confirmed_month}
										<span class="ml-auto font-mono text-xs text-text-muted">
											{finding.confirmed_month}
										</span>
									{/if}
								</div>

								{#if finding.title}
									<p class="mt-1.5 text-sm text-text-primary">{finding.title}</p>
								{:else}
									<!-- No title means still under embargo. The backend withheld
									     it; saying so beats an empty line. -->
									<p class="mt-1.5 text-sm italic text-text-muted">
										{i18n.t('domainRecord.security.underEmbargo')}
									</p>
								{/if}

								<div class="mt-2 flex flex-wrap items-center gap-x-3 text-xs text-text-muted">
									<span>{finding.disclosure_stage}</span>
									{#if finding.target_kind}
										<span>{finding.target_kind}</span>
									{/if}
									{#if finding.writeup_url}
										<a
											href={finding.writeup_url}
											target="_blank"
											rel="external noopener noreferrer nofollow ugc"
											class="ml-auto inline-flex items-center gap-1 hover:text-text-primary"
										>
											{i18n.t('domainRecord.security.writeup')}
											<ExternalLink size={11} strokeWidth={2} />
										</a>
									{/if}
								</div>
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if practice.length > 0}
				<div>
					<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
						{i18n.t('domainRecord.security.practiceTitle')}
					</p>
					<div class="mt-2 flex flex-wrap gap-2">
						{#each practice as row (row.kind + row.tier)}
							<span
								class="rounded-full border border-border bg-surface-overlay px-3 py-1 text-xs text-text-primary"
							>
								{row.kind} · {row.tier}
								<span class="ml-1 font-mono text-text-muted">{row.solved}</span>
							</span>
						{/each}
					</div>
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
							<li class="flex flex-wrap items-center gap-x-2 text-sm">
								<span class="text-text-primary">{credential.name}</span>
								<span class="text-xs text-text-muted">{credential.issuer}</span>
								<!-- Declared and checked are not the same claim. -->
								{#if credential.verified}
									<ShieldCheck size={12} strokeWidth={2} class="text-success" />
									<span class="text-xs text-text-muted">
										{i18n.t('domainRecord.security.credentialChecked')}
									</span>
								{:else}
									<span class="text-xs text-text-muted">
										{i18n.t('domainRecord.security.credentialDeclared')}
									</span>
								{/if}
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if profile.external_platforms.length > 0}
				<div>
					<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
						{i18n.t('domainRecord.security.elsewhereTitle')}
					</p>
					<ul class="mt-2 space-y-1.5" role="list">
						{#each profile.external_platforms as platform (platform.platform + platform.handle)}
							<li class="flex flex-wrap items-center gap-x-3 text-sm">
								{#if platform.profile_url}
									<a
										href={platform.profile_url}
										target="_blank"
										rel="external noopener noreferrer nofollow ugc"
										class="text-text-primary hover:text-accent"
									>
										{platform.name || platform.platform}
									</a>
								{:else}
									<span class="text-text-primary">{platform.name || platform.platform}</span>
								{/if}
								{#if platform.items !== null && platform.items_label}
									<span class="font-mono text-xs text-text-muted">
										{platform.items} {platform.items_label}
									</span>
								{/if}
								<!-- A figure the person typed is not a figure the platform
								     gave us, and the payload keeps them apart. -->
								{#if platform.figures_are_declared}
									<span class="ml-auto text-xs text-text-muted">
										{i18n.t('domainRecord.security.figuresDeclared')}
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
