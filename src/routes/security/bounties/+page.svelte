<script lang="ts">
	/**
	 * T-13 / P-05 — curated public programmes, and work claimed from them.
	 *
	 * The backend ships a `note` with the listing and this page renders it
	 * verbatim: *curated, not endorsed. This platform does not run any of
	 * these.* Presenting a third-party programme as a Skilluv one would put us
	 * behind terms nobody here has read, and would make us look responsible for
	 * a payout we cannot make.
	 *
	 * A claim is the same deal a GitHub profile gets: declared until a reviewer
	 * opens the report URL. `state` carries which, and the two are never mixed
	 * into one list — the whole value of the review is lost the moment a
	 * waiting claim renders like a confirmed one.
	 *
	 * The programme rows are open-shaped on purpose. The listing is curated
	 * data whose columns are the backend's to change, so the card reads the
	 * fields it knows and ignores the rest rather than failing on a new one.
	 */
	import { onMount } from 'svelte';
	import { ExternalLink, Target } from '@lucide/svelte';
	import { securityApi } from '$api/security';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Input from '$components/ui/Input.svelte';
	import Select from '$components/ui/Select.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import { SEVERITY_TIERS, type BountyClaim, type BountyProgramme } from '$types';

	let programmes = $state<BountyProgramme[]>([]);
	let note = $state('');
	let claims = $state<BountyClaim[]>([]);
	let loading = $state(true);
	let loadError = $state('');
	let paidOnly = $state(false);

	let platform = $state('');
	let organisation = $state('');
	let reportUrl = $state('');
	let claimedSeverity = $state<string>('medium');
	let cwe = $state('');
	let summary = $state('');
	let disclosedOn = $state('');
	let sending = $state(false);

	let severityOptions = $derived(
		SEVERITY_TIERS.map((t) => ({
			value: t as string,
			label: i18n.t(`securityMyReports.severities.${t}`)
		}))
	);

	let canClaim = $derived(
		platform.trim() !== '' &&
			organisation.trim() !== '' &&
			reportUrl.trim() !== '' &&
			summary.trim() !== '' &&
			!sending
	);

	function claimStateLabel(state: string): string {
		const key = `securityBounties.claimStates.${state}`;
		const translated = i18n.t(key);
		return translated === key ? state : translated;
	}

	function claimStateVariant(state: string): 'success' | 'warning' | 'error' | 'default' {
		if (state === 'confirmed') return 'success';
		if (state === 'refused') return 'error';
		if (state === 'waiting') return 'warning';
		return 'default';
	}

	/** A curated row's display name, from whichever field it carries. */
	function programmeName(row: BountyProgramme): string {
		return String(row.name ?? row.organisation ?? row.platform ?? '');
	}

	function programmeUrl(row: BountyProgramme): string | null {
		const url = row.url ?? row.programme_url ?? row.link;
		return typeof url === 'string' ? url : null;
	}

	async function load() {
		loading = true;
		loadError = '';
		try {
			const [list, mine] = await Promise.allSettled([
				securityApi.externalBounties({ paid_only: paidOnly || undefined }),
				securityApi.myBountyClaims()
			]);
			programmes = list.status === 'fulfilled' ? (list.value.data?.programmes ?? []) : [];
			note = list.status === 'fulfilled' ? (list.value.data?.note ?? '') : '';
			// A signed-out reader gets 401 here and still deserves the listing.
			claims = mine.status === 'fulfilled' ? (mine.value.data?.claims ?? []) : [];
			if (list.status === 'rejected') {
				loadError =
					list.reason instanceof SkilluError ? list.reason.message : i18n.t('errors.generic');
			}
		} finally {
			loading = false;
		}
	}

	async function claim() {
		if (!canClaim) return;
		sending = true;
		try {
			await securityApi.claimBounty({
				platform: platform.trim(),
				organisation_name: organisation.trim(),
				report_url: reportUrl.trim(),
				claimed_severity: claimedSeverity,
				cwe_id: cwe.trim() || null,
				summary_md: summary.trim(),
				disclosed_on: disclosedOn.trim() || null
			});
			toast.success(i18n.t('securityBounties.claimedToast'));
			organisation = '';
			reportUrl = '';
			summary = '';
			cwe = '';
			disclosedOn = '';
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			sending = false;
		}
	}

	function togglePaid() {
		paidOnly = !paidOnly;
		void load();
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('securityBounties.title')} · Skilluv</title>
	<meta name="description" content={i18n.t('securityBounties.subtitle')} />
</svelte:head>

<div class="mx-auto max-w-3xl space-y-8 px-4 py-8" data-testid="security-bounties-page">
	<header class="space-y-2">
		<h1 class="flex items-center gap-2 text-2xl font-bold text-text">
			<Target size={22} />
			{i18n.t('securityBounties.title')}
		</h1>
		<p class="text-sm text-text-muted">{i18n.t('securityBounties.subtitle')}</p>
	</header>

	{#if loading}
		<Skeleton class="h-64 w-full" rounded="xl" />
	{:else if loadError}
		<p class="rounded-lg border border-error/40 bg-error/5 px-4 py-3 text-sm text-error">
			{loadError}
		</p>
	{:else}
		<section class="space-y-3" data-testid="bounty-programmes">
			<div class="flex flex-wrap items-center justify-between gap-2">
				<h2 class="text-sm font-bold uppercase tracking-wider text-text-muted">
					{i18n.t('securityBounties.title')}
				</h2>
				<Button size="sm" variant={paidOnly ? 'secondary' : 'ghost'} onclick={togglePaid}>
					{i18n.t('securityBounties.paidOnly')}
				</Button>
			</div>

			{#if note}
				<!-- Verbatim. We run none of these, and saying otherwise would put
				     us behind terms nobody here has read. -->
				<p class="rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-muted" data-testid="bounty-note">
					{note}
				</p>
			{/if}

			{#if programmes.length === 0}
				<EmptyState title={i18n.t('securityBounties.empty')} size="sm" />
			{:else}
				<ul class="space-y-2">
					{#each programmes as programme, index (programmeName(programme) + index)}
						{@const url = programmeUrl(programme)}
						<li class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface-elevated p-4">
							<div class="min-w-0">
								<p class="truncate text-sm font-bold text-text">{programmeName(programme)}</p>
								{#if programme.platform}
									<p class="text-xs text-text-muted">{programme.platform}</p>
								{/if}
							</div>
							{#if url}
								<Button href={url} size="sm" variant="ghost" target="_blank" rel="noopener noreferrer">
									<ExternalLink size={14} />
									{i18n.t('securityBounties.openProgramme')}
								</Button>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section class="space-y-3" data-testid="bounty-claims">
			<h2 class="text-sm font-bold uppercase tracking-wider text-text-muted">
				{i18n.t('securityBounties.claimsTitle')}
			</h2>

			{#if claims.length === 0}
				<p class="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-muted">
					{i18n.t('securityBounties.claimsEmpty')}
				</p>
			{:else}
				<ul class="space-y-2">
					{#each claims as entry (entry.id)}
						<li class="rounded-xl border border-border bg-surface-elevated p-4">
							<div class="flex flex-wrap items-start justify-between gap-2">
								<span class="text-sm font-bold text-text">{entry.organisation}</span>
								<Badge variant={claimStateVariant(entry.state)} size="sm">
									{claimStateLabel(entry.state)}
								</Badge>
							</div>
							<div class="mt-1 flex flex-wrap items-center gap-3 text-xs text-text-muted">
								<span>{entry.platform}</span>
								<span>{entry.severity ?? entry.claimed_severity}</span>
								{#if entry.cwe_id}<span>{entry.cwe_id}</span>{/if}
							</div>
							<p class="mt-2 whitespace-pre-line text-sm text-text-muted">{entry.summary_md}</p>
							{#if entry.refused_reason}
								<p class="mt-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-muted">
									{i18n.t('securityBounties.refusedReason', { reason: entry.refused_reason })}
								</p>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section class="rounded-xl border border-border bg-surface-elevated p-5 space-y-3" data-testid="bounty-claim-form">
			<h2 class="text-sm font-bold text-text">{i18n.t('securityBounties.claimCta')}</h2>

			<div class="grid gap-3 sm:grid-cols-2">
				<Input label={i18n.t('securityBounties.claimPlatform')} bind:value={platform} data-testid="claim-platform" />
				<Input label={i18n.t('securityBounties.claimOrganisation')} bind:value={organisation} />
			</div>

			<Input
				label={i18n.t('securityBounties.claimReportUrl')}
				hint={i18n.t('securityBounties.claimReportUrlHint')}
				bind:value={reportUrl}
				placeholder="https://…"
			/>

			<div class="grid gap-3 sm:grid-cols-3">
				<label class="flex flex-col gap-1 text-xs text-text-muted">
					{i18n.t('securityBounties.claimSeverity')}
					<Select items={severityOptions} bind:value={claimedSeverity} shape="rounded" size="sm" />
				</label>
				<Input label={i18n.t('securityBounties.claimCwe')} bind:value={cwe} />
				<Input label={i18n.t('securityBounties.claimDisclosedOn')} type="date" bind:value={disclosedOn} />
			</div>

			<label class="flex flex-col gap-1">
				<span class="text-sm font-medium text-text">{i18n.t('securityBounties.claimSummary')}</span>
				<textarea
					bind:value={summary}
					rows="4"
					class="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
				></textarea>
			</label>

			<Button size="sm" loading={sending} disabled={!canClaim} onclick={claim}>
				{i18n.t('securityBounties.claimSubmit')}
			</Button>
		</section>
	{/if}
</div>
