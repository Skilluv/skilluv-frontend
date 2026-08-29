<script lang="ts">
	/**
	 * SKI-237 — one contest: the brief, what is judged, who judges, and the
	 * way in.
	 *
	 * Entering is two steps server-side — register, then submit — because a
	 * submission requires a participant row. The page collapses that into one
	 * button: a designer thinks "I am handing in my concept", not "I am
	 * registering then handing in".
	 */
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { CalendarRange, ExternalLink, Trophy, Users } from '@lucide/svelte';
	import { tournamentApi } from '$api/tournament';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import Modal from '$components/ui/Modal.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import type { ContestJuror, ContestSubmission, Tournament, TournamentParticipant } from '$types';

	let slug = $derived($page.params.slug ?? '');

	let contest = $state<Tournament | null>(null);
	let standing = $state<TournamentParticipant[]>([]);
	let submissions = $state<ContestSubmission[]>([]);
	let jury = $state<ContestJuror[]>([]);
	let loading = $state(true);
	let loadError = $state('');

	let submitOpen = $state(false);
	let artifactUrl = $state('');
	let artifactType = $state('design_artifact');
	let secondaryUrl = $state('');
	let summary = $state('');
	let submitting = $state(false);

	let isRegistered = $derived(
		!!auth.user && standing.some((p) => p.participant_id === auth.user?.id)
	);
	let myEntry = $derived(
		auth.user ? (submissions.find((s) => s.participant_id === auth.user?.id) ?? null) : null
	);
	let isOver = $derived(
		contest ? new Date(contest.ends_at).getTime() <= Date.now() : false
	);
	let isConcluded = $derived(contest?.status === 'concluded');
	let canSubmit = $derived(!!auth.user && !!contest && !isOver && contest.status !== 'cancelled');

	let brief = $derived(typeof contest?.rules?.brief === 'string' ? contest.rules.brief : null);
	let criteria = $derived(
		typeof contest?.rules?.judging_criteria === 'string' ? contest.rules.judging_criteria : null
	);
	let moodboard = $derived(
		typeof contest?.rules?.moodboard_url === 'string' ? contest.rules.moodboard_url : null
	);
	let deliverables = $derived(
		Array.isArray(contest?.rules?.deliverables)
			? (contest.rules.deliverables as unknown[]).filter(
					(d): d is string => typeof d === 'string'
				)
			: []
	);

	async function load() {
		loading = true;
		loadError = '';
		try {
			const res = await tournamentApi.get(slug);
			contest = res.data.tournament;

			const [standingRes, submissionsRes, juryRes] = await Promise.allSettled([
				tournamentApi.leaderboard(slug),
				tournamentApi.submissions(slug),
				tournamentApi.jury(slug)
			]);
			if (standingRes.status === 'fulfilled') standing = standingRes.value.data.leaderboard ?? [];
			if (submissionsRes.status === 'fulfilled') {
				submissions = submissionsRes.value.data.submissions ?? [];
			}
			if (juryRes.status === 'fulfilled') jury = juryRes.value.data.jury ?? [];
		} catch (err) {
			loadError =
				err instanceof SkilluError && err.code === 'RESOURCE_NOT_FOUND'
					? i18n.t('errors.notFound')
					: err instanceof SkilluError
						? err.message
						: i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	/**
	 * Register if needed, then hand in. A double registration is not an error
	 * worth surfacing — the goal was the submission, and it is about to happen.
	 */
	async function submit() {
		submitting = true;
		try {
			if (!isRegistered) {
				try {
					await tournamentApi.register(slug);
				} catch (err) {
					if (!(err instanceof SkilluError) || err.status !== 409) throw err;
				}
			}
			await tournamentApi.submit(slug, {
				artifact_url: artifactUrl.trim(),
				artifact_type: artifactType.trim(),
				secondary_url: secondaryUrl.trim() || undefined,
				summary: summary.trim()
			});
			toast.success(i18n.t('designContests.submittedToast'));
			submitOpen = false;
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			submitting = false;
		}
	}

	function openSubmit() {
		if (myEntry) {
			artifactUrl = myEntry.artifact_url;
			artifactType = myEntry.artifact_type;
			secondaryUrl = myEntry.secondary_url ?? '';
			summary = myEntry.summary;
		}
		submitOpen = true;
	}

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}

	let statusLabel = $derived.by(() => {
		if (!contest) return '';
		const key = `designContests.statuses.${contest.status}`;
		const translated = i18n.t(key);
		return translated === key ? contest.status : translated;
	});

	onMount(load);
</script>

<svelte:head>
	<title>{contest ? `${contest.name} — Skilluv` : `${i18n.t('designContests.title')} — Skilluv`}</title>
	{#if contest}
		<meta name="description" content={contest.description ?? i18n.t('designContests.subtitle')} />
		<meta property="og:title" content="{contest.name} — Skilluv" />
		<meta property="og:description" content={contest.description ?? i18n.t('designContests.subtitle')} />
		{#if moodboard}
			<meta property="og:image" content={moodboard} />
		{/if}
	{/if}
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-8" data-testid="design-contest-detail">
	{#if loading}
		<Skeleton class="h-64 w-full" rounded="xl" />
		<Skeleton class="mt-6 h-48 w-full" rounded="xl" />
	{:else if loadError}
		<div class="rounded-2xl border border-error/40 bg-error/5 p-6 text-center" role="alert">
			<p class="text-sm text-error">{loadError}</p>
			<Button variant="ghost" size="sm" class="mt-3" href="/design/contests">
				{i18n.t('designContests.title')}
			</Button>
		</div>
	{:else if contest}
		<!-- Hero -->
		<header class="overflow-hidden rounded-2xl border border-border bg-surface-elevated">
			{#if moodboard}
				<img src={moodboard} alt="" class="aspect-[21/9] w-full object-cover" />
			{/if}
			<div class="p-6">
				<div class="flex flex-wrap items-center gap-2">
					<Badge variant={contest.status === 'active' ? 'success' : 'default'} size="sm">
						{statusLabel}
					</Badge>
					{#if isRegistered}
						<Badge variant="accent" size="sm">{i18n.t('designContests.registeredLabel')}</Badge>
					{/if}
				</div>
				<h1 class="mt-3 text-3xl font-bold text-text-primary sm:text-4xl">{contest.name}</h1>
				{#if contest.description}
					<p class="mt-3 text-text-muted">{contest.description}</p>
				{/if}

				<div class="mt-5 flex flex-wrap items-center gap-5 text-sm text-text-muted">
					<span class="inline-flex items-center gap-1.5">
						<CalendarRange size={14} strokeWidth={2} />
						{i18n.t('designContests.runsFrom', {
							start: fmtDate(contest.starts_at),
							end: fmtDate(contest.ends_at)
						})}
					</span>
					<span class="inline-flex items-center gap-1.5">
						<Users size={14} strokeWidth={2} />
						{i18n.t('designContests.entrantCount', { n: standing.length })}
					</span>
					{#if contest.prize_pool_fragments > 0}
						<span class="inline-flex items-center gap-1.5 font-semibold text-accent">
							<Trophy size={14} strokeWidth={2} />
							{i18n.t('designContests.prizePool', {
								n: contest.prize_pool_fragments.toLocaleString()
							})}
						</span>
					{/if}
				</div>

				{#if contest.sponsor_blurb || contest.sponsor_logo_url}
					<div class="mt-5 flex items-center gap-3 border-t border-border pt-5">
						{#if contest.sponsor_logo_url}
							<img src={contest.sponsor_logo_url} alt="" class="h-8 w-auto" />
						{/if}
						<div class="text-xs text-text-muted">
							<span class="font-semibold uppercase tracking-wide">
								{i18n.t('designContests.sponsorLabel')}
							</span>
							{#if contest.sponsor_blurb}
								<p class="mt-0.5">{contest.sponsor_blurb}</p>
							{/if}
						</div>
					</div>
				{/if}

				<div class="mt-6 flex flex-wrap items-center gap-3">
					{#if canSubmit}
						<Button variant="accent" onclick={openSubmit}>
							{i18n.t('designContests.submitCta')}
						</Button>
					{/if}
					<Button variant="ghost" href="/design/contests/{contest.slug}/gallery">
						{i18n.t('designContests.galleryCta')}
					</Button>
					{#if isConcluded}
						<Button variant="ghost" href="/design/contests/{contest.slug}/results">
							{i18n.t('designContests.resultsCta')}
						</Button>
					{/if}
				</div>
			</div>
		</header>

		<div class="mt-6 grid gap-6 lg:grid-cols-3">
			<div class="space-y-6 lg:col-span-2">
				<section class="rounded-2xl border border-border bg-surface-elevated p-6">
					<h2 class="text-xs font-bold uppercase tracking-wider text-text-muted">
						{i18n.t('designContests.briefTitle')}
					</h2>
					<p class="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-text-primary">
						{brief ?? i18n.t('designContests.briefMissing')}
					</p>
					{#if moodboard}
						<a
							href={moodboard}
							target="_blank"
							rel="external noopener noreferrer"
							class="mt-4 inline-flex items-center gap-1.5 text-sm text-accent underline-offset-4 hover:underline"
						>
							{i18n.t('designContests.moodboardCta')}
							<ExternalLink size={12} strokeWidth={2} />
						</a>
					{/if}
				</section>

				{#if criteria}
					<section class="rounded-2xl border border-border bg-surface-elevated p-6">
						<h2 class="text-xs font-bold uppercase tracking-wider text-text-muted">
							{i18n.t('designContests.criteriaTitle')}
						</h2>
						<p class="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-text-primary">
							{criteria}
						</p>
					</section>
				{/if}

				{#if deliverables.length > 0}
					<section class="rounded-2xl border border-border bg-surface-elevated p-6">
						<h2 class="text-xs font-bold uppercase tracking-wider text-text-muted">
							{i18n.t('designContests.deliverablesTitle')}
						</h2>
						<ul class="mt-3 list-inside list-disc space-y-1 text-sm text-text-primary" role="list">
							{#each deliverables as deliverable (deliverable)}
								<li>{deliverable}</li>
							{/each}
						</ul>
					</section>
				{/if}
			</div>

			<div class="space-y-6">
				<section class="rounded-2xl border border-border bg-surface-elevated p-6">
					<h2 class="text-xs font-bold uppercase tracking-wider text-text-muted">
						{i18n.t('designContests.timelineTitle')}
					</h2>
					<dl class="mt-3 space-y-2 text-sm">
						{#if contest.registration_opens_at}
							<div class="flex justify-between gap-3">
								<dt class="text-text-muted">{i18n.t('designContests.statuses.registration')}</dt>
								<dd class="text-text-primary">{fmtDate(contest.registration_opens_at)}</dd>
							</div>
						{/if}
						<div class="flex justify-between gap-3">
							<dt class="text-text-muted">{i18n.t('designContests.statuses.active')}</dt>
							<dd class="text-text-primary">{fmtDate(contest.starts_at)}</dd>
						</div>
						<div class="flex justify-between gap-3">
							<dt class="text-text-muted">{i18n.t('designContests.closed')}</dt>
							<dd class="text-text-primary">{fmtDate(contest.ends_at)}</dd>
						</div>
					</dl>
				</section>

				<section class="rounded-2xl border border-border bg-surface-elevated p-6">
					<h2 class="text-xs font-bold uppercase tracking-wider text-text-muted">
						{i18n.t('designContests.juryTitle')}
					</h2>
					{#if jury.length === 0}
						<p class="mt-3 text-sm text-text-muted">{i18n.t('designContests.juryEmpty')}</p>
					{:else}
						<!-- The panel carries juror UUIDs and their answer, no names. -->
						<ul class="mt-3 space-y-2" role="list">
							{#each jury as juror (juror.juror_user_id)}
								<li class="flex items-center justify-between gap-2 text-sm">
									<span class="font-mono text-xs text-text-muted">
										{juror.juror_user_id.slice(0, 8)}
									</span>
									<Badge
										variant={juror.accepted_at ? 'success' : juror.declined_at ? 'default' : 'accent'}
										size="sm"
									>
										{juror.accepted_at
											? i18n.t('designContests.juryAccepted')
											: juror.declined_at
												? i18n.t('designContests.juryDeclined')
												: i18n.t('designContests.juryInvited')}
									</Badge>
								</li>
							{/each}
						</ul>
					{/if}
				</section>
			</div>
		</div>
	{/if}
</div>

<Modal
	open={submitOpen}
	title={i18n.t('designContests.submitTitle')}
	onclose={() => (submitOpen = false)}
	size="lg"
>
	<div class="space-y-4">
		{#if myEntry}
			<p class="rounded-xl bg-surface-overlay p-3 text-sm text-text-muted" role="status">
				{i18n.t('designContests.resubmitNotice')}
			</p>
		{/if}
		<Input
			label={i18n.t('designContests.submitArtifactUrl')}
			type="url"
			bind:value={artifactUrl}
			hint={i18n.t('designContests.submitArtifactUrlHint')}
			placeholder="https://"
			required
		/>
		<Input label={i18n.t('designContests.submitArtifactType')} bind:value={artifactType} />
		<Input
			label={i18n.t('designContests.submitSecondaryUrl')}
			type="url"
			bind:value={secondaryUrl}
			hint={i18n.t('designContests.submitSecondaryUrlHint')}
			placeholder="https://"
		/>
		<div>
			<label
				for="contest-summary"
				class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted"
			>
				{i18n.t('designContests.submitSummary')}
			</label>
			<textarea
				id="contest-summary"
				bind:value={summary}
				rows="4"
				maxlength={4000}
				placeholder={i18n.t('designContests.submitSummaryPlaceholder')}
				class="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
			></textarea>
		</div>
	</div>

	{#snippet actions()}
		<Button variant="ghost" onclick={() => (submitOpen = false)}>
			{i18n.t('common.actions.cancel')}
		</Button>
		<Button
			variant="accent"
			loading={submitting}
			disabled={artifactUrl.trim() === '' || summary.trim() === ''}
			onclick={submit}
		>
			{i18n.t('designContests.submitSend')}
		</Button>
	{/snippet}
</Modal>
