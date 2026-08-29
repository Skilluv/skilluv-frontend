<script lang="ts">
	/**
	 * What companies are asking of you (SKI-324).
	 *
	 * The talent half of the TALENT pillar. Everything here was served and
	 * called by nothing, and the worst of it was reverse recruitment:
	 * somebody publishes a "job wanted", companies spend credits pitching to
	 * them, and the pitches were reachable from no page. The loop never
	 * closed.
	 *
	 * One page rather than four, because from where the reader sits it is one
	 * question: what is being asked of me, and what do I answer. A pitch, a
	 * campaign, an interview and a trial are four shapes of the same moment.
	 *
	 * Two things the backend is careful about and this page keeps:
	 *
	 *   * Opening a pitch marks it read, which is not an answer. The company
	 *     is owed the knowledge that their argument was opened; the page says
	 *     "read" and never "considered".
	 *   * A trial shows approved and pending hours apart. Claimed but
	 *     unapproved is not money owed, and one total would be a figure nobody
	 *     agreed to.
	 */
	import { onMount } from 'svelte';
	import { CalendarClock, Check, Video, X } from '@lucide/svelte';
	import { opportunitiesApi } from '$lib/api/opportunities';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Markdown from '$components/ui/Markdown.svelte';
	import Modal from '$components/ui/Modal.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import {
		PITCH_DECLINE_REASON_MAX,
		type Interview,
		type InterviewSlot,
		type RecruitmentInvitation,
		type ReverseRecruitmentPitch,
		type ReverseRecruitmentPosting,
		type Trial
	} from '$types';

	let pitches = $state<ReverseRecruitmentPitch[]>([]);
	let posting = $state<ReverseRecruitmentPosting | null>(null);
	let invitations = $state<RecruitmentInvitation[]>([]);
	let interviews = $state<Interview[]>([]);
	let trials = $state<Trial[]>([]);
	let loading = $state(true);

	let acting = $state<string | null>(null);

	let declineOpen = $state(false);
	let declineTarget = $state<ReverseRecruitmentPitch | null>(null);
	let declineReason = $state('');

	/** A pitch you have not answered yet. `read` still counts as unanswered. */
	let openPitches = $derived(pitches.filter((p) => p.status === 'sent' || p.status === 'read'));
	let openInvitations = $derived(invitations.filter((i) => i.my_status === 'shortlisted'));
	let openInterviews = $derived(interviews.filter((i) => !i.confirmed_slot && i.status !== 'declined'));
	let runningTrials = $derived(trials.filter((t) => !t.ended_at));

	let waiting = $derived(
		openPitches.length + openInvitations.length + openInterviews.length
	);

	let isEmpty = $derived(
		pitches.length === 0 &&
			invitations.length === 0 &&
			interviews.length === 0 &&
			trials.length === 0
	);

	async function load() {
		loading = true;
		// Settled: one surface being down must not blank the others.
		const [p, post, inv, itw, tr] = await Promise.allSettled([
			opportunitiesApi.pitches(),
			opportunitiesApi.posting(),
			opportunitiesApi.recruitmentInvitations(),
			opportunitiesApi.interviews(),
			opportunitiesApi.trials()
		]);
		if (p.status === 'fulfilled') pitches = p.value.data?.pitches ?? [];
		if (post.status === 'fulfilled') posting = post.value.data?.posting ?? null;
		if (inv.status === 'fulfilled') invitations = inv.value.data?.invitations ?? [];
		if (itw.status === 'fulfilled') interviews = itw.value.data?.interviews ?? [];
		if (tr.status === 'fulfilled') trials = tr.value.data?.trials ?? [];
		loading = false;
	}

	async function answerPitch(pitch: ReverseRecruitmentPitch, interested: boolean, reason?: string) {
		acting = pitch.id;
		try {
			await opportunitiesApi.respondToPitch(pitch.id, { interested, reason });
			toast.success(i18n.t('opportunities.answeredToast'));
			declineOpen = false;
			declineTarget = null;
			declineReason = '';
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			acting = null;
		}
	}

	async function answerCampaign(invitation: RecruitmentInvitation, interested: boolean) {
		acting = invitation.campaign_id;
		try {
			await opportunitiesApi.respondToCampaign(invitation.campaign_id, interested);
			toast.success(i18n.t('opportunities.answeredToast'));
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			acting = null;
		}
	}

	async function confirmSlot(interview: Interview, slot: InterviewSlot) {
		acting = interview.id;
		try {
			await opportunitiesApi.confirmInterview(interview.id, slot);
			toast.success(i18n.t('opportunities.slotConfirmedToast'));
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			acting = null;
		}
	}

	async function declineInterview(interview: Interview) {
		acting = interview.id;
		try {
			await opportunitiesApi.declineInterview(interview.id);
			toast.success(i18n.t('opportunities.declinedToast'));
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			acting = null;
		}
	}

	function fmtMoney(value: string | null, currency: string | null): string | null {
		if (value === null) return null;
		const amount = Number(value);
		if (!Number.isFinite(amount)) return value;
		return new Intl.NumberFormat(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', {
			style: 'currency',
			currency: currency || 'EUR',
			maximumFractionDigits: 0
		}).format(amount);
	}

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	function fmtSlot(slot: InterviewSlot): string {
		const start = new Date(slot.start);
		const end = new Date(slot.end);
		const day = start.toLocaleDateString(i18n.locale, {
			weekday: 'short',
			day: 'numeric',
			month: 'short'
		});
		const time = (d: Date) =>
			d.toLocaleTimeString(i18n.locale, { hour: '2-digit', minute: '2-digit' });
		return `${day} ${time(start)} – ${time(end)}`;
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('opportunities.title')} — Skilluv</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-8" data-testid="opportunities-page">
	<header class="mb-8">
		<h1 class="text-3xl font-bold text-text-primary">{i18n.t('opportunities.title')}</h1>
		<p class="mt-2 text-text-muted">
			{waiting > 0
				? i18n.t('opportunities.waiting', { n: waiting })
				: i18n.t('opportunities.nothingWaiting')}
		</p>
	</header>

	{#if loading}
		<div class="space-y-4">
			{#each Array(3) as _, i (i)}
				<Skeleton class="h-32 w-full" rounded="xl" />
			{/each}
		</div>
	{:else if isEmpty}
		<EmptyState
			variant="scroll"
			title={i18n.t('opportunities.empty')}
			body={posting
				? i18n.t('opportunities.emptyWithPosting')
				: i18n.t('opportunities.emptyNoPosting')}
		/>
	{:else}
		{#if openPitches.length > 0}
			<section class="mb-10" data-testid="opportunities-pitches">
				<h2 class="mb-1 text-lg font-bold text-text-primary">
					{i18n.t('opportunities.pitchesTitle')}
				</h2>
				<p class="mb-3 text-sm text-text-muted">{i18n.t('opportunities.pitchesHint')}</p>
				<ul class="space-y-3" role="list">
					{#each openPitches as pitch (pitch.id)}
						{@const salary = fmtMoney(pitch.offered_salary, pitch.currency)}
						<li class="rounded-2xl border border-border bg-surface-elevated p-5">
							<div class="mb-2 flex flex-wrap items-center gap-2">
								<span class="text-sm font-semibold text-text-primary">{pitch.company_name}</span>
								{#if salary}
									<Badge variant="accent" size="sm">{salary}</Badge>
								{/if}
								<!-- Read, which is not considered. Saying more would be
								     inventing an answer on the reader's behalf. -->
								{#if pitch.status === 'read'}
									<span class="text-xs text-text-muted">{i18n.t('opportunities.opened')}</span>
								{/if}
								<span class="ml-auto text-xs text-text-muted">{fmtDate(pitch.created_at)}</span>
							</div>

							<Markdown source={pitch.pitch_md} />

							<div class="mt-4 flex flex-wrap justify-end gap-2">
								<Button
									variant="ghost"
									size="sm"
									onclick={() => {
										declineTarget = pitch;
										declineReason = '';
										declineOpen = true;
									}}
								>
									{i18n.t('opportunities.notInterested')}
								</Button>
								<Button
									variant="accent"
									size="sm"
									loading={acting === pitch.id}
									onclick={() => answerPitch(pitch, true)}
								>
									{i18n.t('opportunities.interested')}
								</Button>
							</div>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if openInvitations.length > 0}
			<section class="mb-10" data-testid="opportunities-campaigns">
				<h2 class="mb-3 text-lg font-bold text-text-primary">
					{i18n.t('opportunities.campaignsTitle')}
				</h2>
				<ul class="space-y-3" role="list">
					{#each openInvitations as invitation (invitation.campaign_id)}
						<li class="rounded-2xl border border-border bg-surface-elevated p-5">
							<div class="mb-2 flex flex-wrap items-center gap-2">
								<span class="text-sm font-semibold text-text-primary">
									{invitation.company_name}
								</span>
								<Badge variant="default" size="sm">{invitation.target_role}</Badge>
							</div>
							<p class="text-sm text-text-primary">{invitation.title}</p>
							<div class="mt-2">
								<Markdown source={invitation.brief_md} />
							</div>
							<div class="mt-4 flex flex-wrap justify-end gap-2">
								<Button
									variant="ghost"
									size="sm"
									loading={acting === invitation.campaign_id}
									onclick={() => answerCampaign(invitation, false)}
								>
									{i18n.t('opportunities.notInterested')}
								</Button>
								<Button
									variant="accent"
									size="sm"
									loading={acting === invitation.campaign_id}
									onclick={() => answerCampaign(invitation, true)}
								>
									{i18n.t('opportunities.interested')}
								</Button>
							</div>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if interviews.length > 0}
			<section class="mb-10" data-testid="opportunities-interviews">
				<h2 class="mb-3 text-lg font-bold text-text-primary">
					{i18n.t('opportunities.interviewsTitle')}
				</h2>
				<ul class="space-y-3" role="list">
					{#each interviews as interview (interview.id)}
						<li class="rounded-2xl border border-border bg-surface-elevated p-5">
							<div class="mb-2 flex flex-wrap items-center gap-2">
								<Badge
									variant={interview.confirmed_slot ? 'success' : 'default'}
									size="sm"
								>
									{interview.status}
								</Badge>
								<span class="text-xs text-text-muted">{interview.source_type}</span>
								{#if interview.platform}
									<span class="inline-flex items-center gap-1 text-xs text-text-muted">
										<Video size={11} strokeWidth={2} />
										{interview.platform}
									</span>
								{/if}
							</div>

							{#if interview.confirmed_slot}
								<p class="inline-flex items-center gap-2 text-sm text-text-primary">
									<CalendarClock size={13} strokeWidth={2} />
									{fmtSlot(interview.confirmed_slot)}
								</p>
								{#if interview.meeting_url}
									<a
										href={interview.meeting_url}
										target="_blank"
										rel="external noopener noreferrer nofollow"
										class="mt-2 inline-block text-sm text-accent hover:underline"
									>
										{i18n.t('opportunities.joinMeeting')}
									</a>
								{:else if interview.location}
									<p class="mt-1 text-sm text-text-muted">{interview.location}</p>
								{/if}
							{:else}
								<p class="text-sm text-text-muted">{i18n.t('opportunities.pickASlot')}</p>
								<div class="mt-3 flex flex-wrap gap-2">
									{#each interview.proposed_slots as slot, i (i)}
										<Button
											variant="secondary"
											size="sm"
											loading={acting === interview.id}
											onclick={() => confirmSlot(interview, slot)}
										>
											<span class="inline-flex items-center gap-1.5">
												<Check size={12} strokeWidth={2} />
												{fmtSlot(slot)}
											</span>
										</Button>
									{/each}
								</div>
								<div class="mt-3 flex justify-end">
									<Button
										variant="ghost"
										size="sm"
										loading={acting === interview.id}
										onclick={() => declineInterview(interview)}
									>
										<span class="inline-flex items-center gap-1.5">
											<X size={12} strokeWidth={2} />
											{i18n.t('opportunities.declineInterview')}
										</span>
									</Button>
								</div>
							{/if}
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if runningTrials.length > 0}
			<section class="mb-10" data-testid="opportunities-trials">
				<h2 class="mb-1 text-lg font-bold text-text-primary">
					{i18n.t('opportunities.trialsTitle')}
				</h2>
				<p class="mb-3 text-sm text-text-muted">{i18n.t('opportunities.trialsHint')}</p>
				<ul class="space-y-3" role="list">
					{#each runningTrials as trial (trial.id)}
						<li class="rounded-2xl border border-border bg-surface-elevated p-5">
							<div class="mb-2 flex flex-wrap items-center gap-2">
								<span class="font-mono text-sm text-text-primary">
									{fmtMoney(trial.hourly_rate, trial.currency)} / h
								</span>
								<span class="text-xs text-text-muted">
									{i18n.t('opportunities.until', { date: fmtDate(trial.ends_at) })}
								</span>
							</div>
							<!-- Two figures, never one: claimed but unapproved is not
							     money owed. -->
							<p class="font-mono text-xs text-text-muted">
								{i18n.t('opportunities.approvedHours', { n: trial.approved_hours })}
								<span class="mx-2">·</span>
								{i18n.t('opportunities.pendingHours', { n: trial.pending_hours })}
							</p>
							<div class="mt-3 flex justify-end">
								<Button variant="ghost" size="sm" href="/dashboard/trials/{trial.id}">
									{i18n.t('opportunities.openTrial')}
								</Button>
							</div>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if posting}
			<section>
				<h2 class="mb-3 text-lg font-bold text-text-primary">
					{i18n.t('opportunities.postingTitle')}
				</h2>
				<div class="rounded-2xl border border-border bg-surface-elevated p-5">
					<p class="text-sm font-semibold text-text-primary">{posting.title}</p>
					<p class="mt-1 text-xs text-text-muted">
						{posting.desired_role} · {posting.desired_domain}
						{#if posting.remote_only}
							<span class="ml-1">· {i18n.t('opportunities.remoteOnly')}</span>
						{/if}
					</p>
					{#if posting.not_looking_for}
						<p class="mt-2 text-xs text-text-muted">
							{i18n.t('opportunities.notLookingFor', { text: posting.not_looking_for })}
						</p>
					{/if}
					<!-- On the posting rather than in a quota table: it is what a
					     company needs to know before writing four hundred words. -->
					<p class="mt-3 border-t border-border pt-3 text-xs text-text-muted">
						{i18n.t('opportunities.pitchesLeft', { n: posting.pitches_left_this_month })}
					</p>
				</div>
			</section>
		{/if}
	{/if}
</div>

<Modal
	open={declineOpen}
	title={i18n.t('opportunities.declineTitle')}
	onclose={() => (declineOpen = false)}
	size="sm"
>
	<div class="space-y-4">
		<!-- Optional, and said so: somebody declining ten pitches should not
		     have to justify each one. -->
		<p class="text-sm text-text-muted">{i18n.t('opportunities.declineHint')}</p>
		<textarea
			bind:value={declineReason}
			rows="4"
			maxlength={PITCH_DECLINE_REASON_MAX}
			placeholder={i18n.t('opportunities.declinePlaceholder')}
			aria-label={i18n.t('opportunities.declineTitle')}
			class="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
		></textarea>
	</div>

	{#snippet actions()}
		<Button variant="ghost" onclick={() => (declineOpen = false)}>
			{i18n.t('common.actions.cancel')}
		</Button>
		<Button
			variant="danger"
			loading={acting === declineTarget?.id}
			onclick={() =>
				declineTarget && answerPitch(declineTarget, false, declineReason.trim() || undefined)}
		>
			{i18n.t('opportunities.declineSubmit')}
		</Button>
	{/snippet}
</Modal>
