<script lang="ts">
	/**
	 * SKI-253 — the design record on a public profile.
	 *
	 * One call, addressed by username: craft score with its breakdown, verified
	 * artefacts, contest standings, validated trades and design attestations.
	 * Unlike the id-addressed Post-MVP sections, this one needs no UUID and so
	 * works on anyone's profile today.
	 *
	 * The round count on each artefact is the editorial point of the section:
	 * a piece that converged over four critique rounds says more about a
	 * designer than one that passed first time, and the layout gives it room.
	 *
	 * Missions, availability and external portfolios are in the ticket but not
	 * in the payload — their backend tickets (M-05, A-01) are still open.
	 */
	import { onMount } from 'svelte';
	import { BadgeCheck, ExternalLink, RefreshCw, Trophy } from '@lucide/svelte';
	import { designApi } from '$lib/api/design';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import type { DesignProfile } from '$types';

	interface Props {
		username: string;
		/** Shows the recompute action, which only acts on your own score. */
		isOwn?: boolean;
	}

	let { username, isOwn = false }: Props = $props();

	let profile = $state<DesignProfile | null>(null);
	let loading = $state(true);
	let recomputing = $state(false);
	let breakdownOpen = $state(false);

	/** Nothing to show at all: no score, no artefact, no standing. */
	let isEmpty = $derived(
		!!profile &&
			profile.craft_score.score === 0 &&
			profile.artefacts.length === 0 &&
			profile.contests.length === 0 &&
			profile.trades.length === 0
	);

	/** Terms that actually contributed, biggest first. */
	let contributingTerms = $derived(
		(profile?.craft_score.breakdown ?? [])
			.filter((t) => t.points > 0)
			.sort((a, b) => b.points - a.points)
	);

	let scorePct = $derived.by(() => {
		if (!profile) return 0;
		const next = profile.craft_score.next_tier_at;
		if (!next || next <= 0) return 100;
		return Math.min(100, Math.round((profile.craft_score.score / next) * 100));
	});

	async function load() {
		loading = true;
		try {
			const res = await designApi.profile(username);
			profile = res.data;
		} catch {
			// A profile with no design record answers 404 here, and so does a
			// hidden one. Either way the section simply does not render.
			profile = null;
		} finally {
			loading = false;
		}
	}

	async function recompute() {
		recomputing = true;
		try {
			await designApi.recomputeMine();
			toast.success(i18n.t('designProfile.recomputedToast'));
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			recomputing = false;
		}
	}

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	/** NUMERIC over JSON: a grid average arrives as a string. */
	function fmtGrid(value: string): string {
		const n = Number(value);
		return Number.isFinite(n) ? n.toFixed(1) : value;
	}

	onMount(load);
</script>

{#if loading}
	<Skeleton class="h-56 w-full" rounded="xl" />
{:else if profile && !isEmpty}
	<section
		class="rounded-xl border border-border bg-surface-elevated overflow-hidden"
		data-testid="profile-design-section"
	>
		<div class="flex items-center justify-between border-b border-border px-5 py-3">
			<span class="text-xs font-bold uppercase tracking-wider text-text-muted">
				{i18n.t('designProfile.sectionTitle')}
			</span>
			{#if isOwn}
				<Button variant="ghost" size="sm" loading={recomputing} onclick={recompute}>
					<span class="inline-flex items-center gap-1.5">
						<RefreshCw size={12} strokeWidth={2} />
						{i18n.t('designProfile.recomputeCta')}
					</span>
				</Button>
			{/if}
		</div>

		<div class="space-y-8 p-5">
			<!-- Craft score -->
			<div>
				<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
					{i18n.t('designProfile.craftScoreTitle')}
				</p>
				<div class="mt-2 flex flex-wrap items-baseline gap-3">
					<span class="font-mono text-4xl font-black text-text-primary">
						{profile.craft_score.score.toLocaleString()}
					</span>
					<Badge variant="accent" size="sm">
						{i18n.t('designProfile.tierLabel', { name: profile.craft_score.tier_name })}
					</Badge>
					{#if profile.craft_score.capped}
						<span class="text-xs text-text-muted">{i18n.t('designProfile.cappedNotice')}</span>
					{/if}
				</div>
				<p class="mt-1 text-sm text-text-muted">{profile.craft_score.tier_description}</p>

				{#if profile.craft_score.next_tier_at}
					<div class="mt-3">
						<div
							class="h-2 w-full overflow-hidden rounded-full bg-surface-overlay"
							role="progressbar"
							aria-valuenow={scorePct}
							aria-valuemin={0}
							aria-valuemax={100}
							aria-label={i18n.t('designProfile.craftScoreTitle')}
						>
							<div class="h-full rounded-full bg-accent" style="width: {scorePct}%"></div>
						</div>
						<p class="mt-1.5 text-xs text-text-muted">
							{i18n.t('designProfile.nextTierAt', {
								n: profile.craft_score.next_tier_at.toLocaleString()
							})}
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
						{i18n.t('designProfile.breakdownTitle')}
					</button>
					{#if breakdownOpen}
						<ul class="mt-2 space-y-1.5" role="list">
							{#each contributingTerms as term (term.term)}
								<li class="flex items-baseline justify-between gap-3 text-xs">
									<span class="text-text-primary">{term.explanation}</span>
									<span class="shrink-0 font-mono text-text-muted">
										{term.measured} → +{term.points}
									</span>
								</li>
							{/each}
						</ul>
					{/if}
				{/if}
			</div>

			<!-- Trades -->
			{#if profile.trades.length > 0}
				<div>
					<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
						{i18n.t('designProfile.tradesTitle')}
					</p>
					<div class="mt-2 flex flex-wrap gap-2">
						{#each profile.trades as trade (trade.trade)}
							<span
								class="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-overlay px-3 py-1 text-xs"
							>
								<span class="text-text-primary">{trade.trade}</span>
								<span class="text-text-muted">
									{i18n.t('designProfile.tradeValidated', { n: trade.validated })}
								</span>
							</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Artefacts -->
			{#if profile.artefacts.length > 0}
				<div>
					<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
						{i18n.t('designProfile.artefactsTitle')}
					</p>
					<p class="mt-1 text-xs text-text-muted">{i18n.t('designProfile.artefactsHint')}</p>
					<ul class="mt-3 grid gap-3 sm:grid-cols-2" role="list">
						{#each profile.artefacts as artefact (artefact.deliverable_id)}
							<li class="rounded-xl border border-border p-4">
								<p class="text-sm font-semibold text-text-primary">{artefact.title}</p>
								<p class="mt-1 text-xs text-text-muted">
									{#if artefact.trade}{artefact.trade}{/if}
									{#if artefact.subtype}
										<span class="mx-1.5">·</span>{artefact.subtype}
									{/if}
								</p>
								<p class="mt-2 flex flex-wrap items-center gap-2 text-xs">
									{#if artefact.rounds}
										<Badge variant={artefact.rounds >= 3 ? 'accent' : 'default'} size="sm">
											{artefact.rounds === 1
												? i18n.t('designProfile.roundsOne')
												: i18n.t('designProfile.roundsLabel', { n: artefact.rounds })}
										</Badge>
									{/if}
									{#if artefact.grid_average}
										<span class="text-text-muted">
											{i18n.t('designProfile.gridAverage', {
												n: fmtGrid(artefact.grid_average)
											})}
										</span>
									{/if}
								</p>
								<div class="mt-3 flex items-center justify-between gap-2 text-xs">
									{#if artefact.verified_at}
										<span class="text-text-muted">
											{i18n.t('designProfile.verifiedOn', {
												date: fmtDate(artefact.verified_at)
											})}
										</span>
									{/if}
									<a
										href={artefact.artifact_url}
										target="_blank"
										rel="noopener noreferrer nofollow ugc"
										class="inline-flex shrink-0 items-center gap-1 text-text-muted hover:text-text-primary"
									>
										{i18n.t('designProfile.openArtifact')}
										<ExternalLink size={11} strokeWidth={2} />
									</a>
								</div>
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			<!-- Contests -->
			{#if profile.contests.length > 0}
				<div>
					<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
						{i18n.t('designProfile.contestsTitle')}
					</p>
					<ul class="mt-2 space-y-2" role="list">
						{#each profile.contests as contest (contest.name)}
							<li class="flex flex-wrap items-center justify-between gap-2 text-sm">
								<span class="inline-flex items-center gap-2 text-text-primary">
									{#if contest.rank !== null && contest.rank <= 3}
										<Trophy size={13} strokeWidth={2} class="text-accent" />
									{/if}
									{contest.name}
								</span>
								<span class="text-xs text-text-muted">
									{contest.rank !== null
										? i18n.t('designProfile.contestRank', {
												rank: contest.rank,
												entrants: contest.entrants
											})
										: i18n.t('designProfile.contestUnranked', { entrants: contest.entrants })}
								</span>
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			<!-- Attestations -->
			{#if profile.attestations.length > 0}
				<div>
					<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
						{i18n.t('designProfile.attestationsTitle')}
					</p>
					<ul class="mt-2 space-y-2" role="list">
						{#each profile.attestations as attestation (attestation.verification_code)}
							<li class="flex flex-wrap items-center justify-between gap-2 text-sm">
								<span class="inline-flex items-center gap-2 text-text-primary">
									<BadgeCheck size={13} strokeWidth={2} class="text-success" />
									{attestation.title}
								</span>
								<!-- Shown, not linked: `/verify/[hash]` resolves a 64-hex slice
									     attestation hash, while this is a 12-character
									     `verification_code` on the attestations table. The backend
									     serves it at /api/attestations/verify/{code}; there is no
									     page for that route yet, and a link into the wrong one
									     would only 404. -->
								<span class="font-mono text-xs text-text-muted" title={i18n.t('designProfile.verifyCta')}>
									{attestation.verification_code}
								</span>
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			<p class="border-t border-border pt-4 text-xs text-text-muted">
				{i18n.t('designProfile.notAClaim')}
			</p>
		</div>
	</section>
{/if}
