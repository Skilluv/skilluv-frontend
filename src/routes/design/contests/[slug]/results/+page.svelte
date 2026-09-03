<script lang="ts">
	/**
	 * SKI-237 — the result of a concluded contest.
	 *
	 * A standing is published only once the contest is over: showing a podium
	 * mid-run would publish a result nobody has decided. Before that, the page
	 * says so and points back at the gallery.
	 */
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { tournamentApi } from '$api/tournament';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import { PodiumDisplay, SubmissionMasonry } from '$components/design';
	import type { ContestSubmission, Tournament, TournamentParticipant } from '$types';

	let slug = $derived($page.params.slug ?? '');

	let contest = $state<Tournament | null>(null);
	let standing = $state<TournamentParticipant[]>([]);
	let submissions = $state<ContestSubmission[]>([]);
	let votes = $state<Record<string, number>>({});
	let loading = $state(true);
	let loadError = $state('');

	let isConcluded = $derived(contest?.status === 'concluded');
	let ranked = $derived(standing.filter((p) => p.rank !== null));
	let beyondPodium = $derived(ranked.filter((p) => (p.rank ?? 0) > 3));

	async function load() {
		loading = true;
		loadError = '';
		try {
			const [contestRes, standingRes, submissionsRes, rankingRes] = await Promise.all([
				tournamentApi.get(slug),
				tournamentApi.leaderboard(slug),
				tournamentApi.submissions(slug),
				tournamentApi.communityRanking(slug).catch(() => null)
			]);
			contest = contestRes.data.tournament;
			standing = standingRes.data.leaderboard ?? [];
			submissions = submissionsRes.data.submissions ?? [];
			if (rankingRes) {
				const next: Record<string, number> = {};
				for (const row of rankingRes.data?.ranking ?? []) next[row.submission_id] = row.votes;
				votes = next;
			}
		} catch (err) {
			loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	onMount(load);
</script>

<svelte:head>
	<title>
		{contest
			? `${i18n.t('designContests.resultsTitle')} — ${contest.name}`
			: i18n.t('designContests.resultsTitle')} — Skilluv
	</title>
	{#if contest}
		<meta property="og:title" content="{i18n.t('designContests.resultsTitle')} | {contest.name}" />
		<meta property="og:description" content={contest.description ?? i18n.t('designContests.subtitle')} />
	{/if}
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-8" data-testid="design-contest-results">
	<header class="mb-8">
		<a
			href="/design/contests/{slug}"
			class="text-sm text-text-muted underline-offset-4 hover:text-text-primary hover:underline"
		>
			{contest?.name ?? i18n.t('designContests.title')}
		</a>
		<h1 class="mt-2 text-3xl font-bold text-text-primary">
			{i18n.t('designContests.resultsTitle')}
		</h1>
	</header>

	{#if loading}
		<Skeleton class="h-48 w-full" rounded="xl" />
	{:else if loadError}
		<div class="rounded-2xl border border-error/40 bg-error/5 p-6 text-center" role="alert">
			<p class="text-sm text-error">{loadError}</p>
			<Button variant="ghost" size="sm" class="mt-3" onclick={load}>
				{i18n.t('common.actions.retry')}
			</Button>
		</div>
	{:else if !isConcluded}
		<EmptyState
			variant="seal-intact"
			title={i18n.t('designContests.resultsPending')}
			body={i18n.t('designContests.noStanding')}
		>
			{#snippet action()}
				<Button variant="accent" href="/design/contests/{slug}/gallery">
					{i18n.t('designContests.galleryCta')}
				</Button>
			{/snippet}
		</EmptyState>
	{:else}
		<section class="rounded-2xl border border-border bg-surface-elevated p-8">
			<PodiumDisplay {standing} />
		</section>

		{#if beyondPodium.length > 0}
			<section class="mt-8">
				<h2 class="mb-3 text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.t('designContests.otherEntries')}
				</h2>
				<ul class="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface-elevated" role="list">
					{#each beyondPodium as entry (entry.participant_id)}
						{@const isMe = entry.participant_id === auth.user?.id}
						<li class="flex items-center justify-between gap-3 px-5 py-3 {isMe ? 'bg-accent/5' : ''}">
							<span class="flex items-center gap-3">
								<span class="w-8 font-mono text-sm text-text-muted">#{entry.rank}</span>
								{#if isMe}
									<Badge variant="accent" size="sm">{i18n.t('designContests.yourEntry')}</Badge>
								{/if}
							</span>
							<span class="font-mono text-sm text-text-primary">
								{entry.score.toLocaleString()}
							</span>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if submissions.length > 0}
			<section class="mt-10">
				<h2 class="mb-5 text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.t('designContests.galleryTitle')}
				</h2>
				<SubmissionMasonry {submissions} {votes} ownParticipantId={auth.user?.id} />
			</section>
		{/if}
	{/if}
</div>
