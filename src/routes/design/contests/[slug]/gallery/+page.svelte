<script lang="ts">
	/**
	 * SKI-237 — every entry in a contest, with the community vote.
	 *
	 * Voting is one movable voice: re-posting on another entry moves it rather
	 * than adding a second. The tally comes from `community-ranking`, which
	 * returns counts per submission and nothing else, so the reader's own vote
	 * is inferred locally after they cast it.
	 */
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { tournamentApi } from '$api/tournament';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import { toast } from '$stores/toast.svelte';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import { SubmissionMasonry } from '$components/design';
	import type { ContestSubmission, Tournament } from '$types';

	let slug = $derived($page.params.slug ?? '');

	let contest = $state<Tournament | null>(null);
	let submissions = $state<ContestSubmission[]>([]);
	let votes = $state<Record<string, number>>({});
	let votedFor = $state<string | null>(null);
	let loading = $state(true);
	let loadError = $state('');

	let isOpen = $derived(
		contest ? new Date(contest.ends_at).getTime() > Date.now() && contest.status !== 'cancelled' : false
	);
	let canVote = $derived(!!auth.user && isOpen);

	async function load() {
		loading = true;
		loadError = '';
		try {
			const [contestRes, submissionsRes] = await Promise.all([
				tournamentApi.get(slug),
				tournamentApi.submissions(slug)
			]);
			contest = contestRes.data.tournament;
			submissions = submissionsRes.data.submissions ?? [];
			await loadVotes();
		} catch (err) {
			loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	async function loadVotes() {
		try {
			const res = await tournamentApi.communityRanking(slug);
			const next: Record<string, number> = {};
			for (const row of res.data?.ranking ?? []) next[row.submission_id] = row.votes;
			votes = next;
		} catch {
			// A contest with no community vote answers nothing useful here.
			// An absent tally is not an error worth a banner.
		}
	}

	async function vote(submissionId: string) {
		try {
			await tournamentApi.communityVote(slug, submissionId);
			votedFor = submissionId;
			toast.success(i18n.t('designContests.votedToast'));
			await loadVotes();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		}
	}

	onMount(load);
</script>

<svelte:head>
	<title>
		{contest
			? `${i18n.t('designContests.galleryTitle')} — ${contest.name}`
			: i18n.t('designContests.galleryTitle')} — Skilluv
	</title>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-8" data-testid="design-contest-gallery">
	<header class="mb-8">
		<a
			href={resolve(`/design/contests/${slug}`)}
			class="text-sm text-text-muted underline-offset-4 hover:text-text-primary hover:underline"
		>
			{contest?.name ?? i18n.t('designContests.title')}
		</a>
		<h1 class="mt-2 text-3xl font-bold text-text-primary">
			{i18n.t('designContests.galleryTitle')}
		</h1>
		<p class="mt-2 text-sm text-text-muted">
			{i18n.t('designContests.submissionCount', { n: submissions.length })}
			{#if canVote}
				<span class="mx-1.5">·</span>{i18n.t('designContests.voteOneVoice')}
			{:else if isOpen && !auth.user}
				<span class="mx-1.5">·</span>{i18n.t('designContests.voteSignedOut')}
			{/if}
		</p>
	</header>

	{#if loading}
		<div class="columns-1 gap-5 sm:columns-2 lg:columns-3">
			{#each Array(6) as _, i (i)}
				<Skeleton class="mb-5 h-56 w-full" rounded="xl" />
			{/each}
		</div>
	{:else if loadError}
		<div class="rounded-2xl border border-error/40 bg-error/5 p-6 text-center" role="alert">
			<p class="text-sm text-error">{loadError}</p>
			<Button variant="ghost" size="sm" class="mt-3" onclick={load}>
				{i18n.t('common.actions.retry')}
			</Button>
		</div>
	{:else if submissions.length === 0}
		<EmptyState variant="scroll" title={i18n.t('designContests.galleryEmpty')}>
			{#snippet action()}
				<Button variant="accent" href="/design/contests/{slug}">
					{i18n.t('designContests.viewCta')}
				</Button>
			{/snippet}
		</EmptyState>
	{:else}
		<SubmissionMasonry
			{submissions}
			{votes}
			{votedFor}
			onvote={canVote ? vote : undefined}
			ownParticipantId={auth.user?.id}
			canReport={!!auth.user}
		/>
	{/if}
</div>
