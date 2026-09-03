<script lang="ts">
	/**
	 * SKI-41 — structured peer coaching.
	 *
	 * Three surfaces on one page, in the order the flow happens: enroll on an
	 * orientation, look at who the matcher proposes, then run the weekly
	 * sessions with the peers you paired with.
	 *
	 * `orientation_id` is what every call takes, but a user's own orientations
	 * only carry slugs, so the catalogue is loaded to bridge the two.
	 */
	import { onMount } from 'svelte';
	import { CalendarPlus, RefreshCw } from '@lucide/svelte';
	import { peerMatchingApi } from '$lib/api/peer_matching';
	import { orientationsApi } from '$lib/api/orientations';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Input from '$components/ui/Input.svelte';
	import Modal from '$components/ui/Modal.svelte';
	import Select from '$components/ui/Select.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import type {
		Orientation,
		PeerEnrollmentListing,
		PeerMatchListing,
		PeerProposal,
		PeerSession
	} from '$types';

	let orientations = $state<Orientation[]>([]);
	let enrollments = $state<PeerEnrollmentListing[]>([]);
	let matches = $state<PeerMatchListing[]>([]);
	let proposals = $state<PeerProposal[]>([]);
	let sessions = $state<Record<string, PeerSession[]>>({});

	let loading = $state(true);
	let loadError = $state('');
	let busy = $state(false);
	let proposalsFor = $state('');
	let loadingProposals = $state(false);
	let includeEnded = $state(false);

	let enrollOrientationId = $state('');
	let enrollCadence = $state('1');

	let scheduleFor = $state<string | null>(null);
	let scheduleAt = $state('');

	let checkInFor = $state<PeerSession | null>(null);
	let checkInNotes = $state('');
	let checkInRating = $state('4');

	let orientationItems = $derived(
		orientations.map((o) => ({ value: o.id, label: o.name }))
	);
	let cadenceItems = $derived(
		[1, 2, 3, 4, 5].map((n) => ({
			value: String(n),
			label: i18n.t('peerMatching.enrollCadenceUnit', { n })
		}))
	);
	let ratingItems = $derived(
		[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: String(n) }))
	);
	let enrolledIds = $derived(
		new Set(enrollments.filter((e) => e.enrollment.active).map((e) => e.enrollment.orientation_id))
	);
	let proposalOrientations = $derived(
		enrollments.filter((e) => e.enrollment.active)
	);

	async function load() {
		loading = true;
		loadError = '';
		try {
			const [enrollRes, matchRes] = await Promise.all([
				peerMatchingApi.enrollments(),
				peerMatchingApi.matches(includeEnded)
			]);
			enrollments = enrollRes.data?.enrollments ?? [];
			matches = matchRes.data?.matches ?? [];
			await Promise.all(matches.filter((m) => m.match.active).map((m) => loadSessions(m.match.id)));
		} catch (err) {
			loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	async function loadSessions(matchId: string) {
		try {
			const res = await peerMatchingApi.sessions(matchId);
			sessions = { ...sessions, [matchId]: res.data?.sessions ?? [] };
		} catch {
			// One unreadable match must not blank the whole page.
		}
	}

	async function enroll() {
		if (!enrollOrientationId) return;
		busy = true;
		try {
			await peerMatchingApi.enroll({
				orientation_id: enrollOrientationId,
				weekly_cadence: Number(enrollCadence)
			});
			toast.success(i18n.t('peerMatching.enrolledToast'));
			enrollments = (await peerMatchingApi.enrollments()).data?.enrollments ?? [];
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			busy = false;
		}
	}

	async function unenroll(orientationId: string) {
		try {
			await peerMatchingApi.unenroll(orientationId);
			enrollments = enrollments.filter((e) => e.enrollment.orientation_id !== orientationId);
			if (proposalsFor === orientationId) {
				proposals = [];
				proposalsFor = '';
			}
			toast.success(i18n.t('peerMatching.unenrolledToast'));
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		}
	}

	async function loadProposals(orientationId: string) {
		proposalsFor = orientationId;
		loadingProposals = true;
		try {
			const res = await peerMatchingApi.proposals(orientationId);
			proposals = res.data?.proposals ?? [];
		} catch (err) {
			proposals = [];
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			loadingProposals = false;
		}
	}

	async function createMatch(proposal: PeerProposal) {
		busy = true;
		try {
			await peerMatchingApi.createMatch(proposal.user_id, proposalsFor);
			toast.success(i18n.t('peerMatching.matchedToast'));
			proposals = proposals.filter((p) => p.user_id !== proposal.user_id);
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			busy = false;
		}
	}

	async function endMatch(matchId: string) {
		if (!confirm(i18n.t('peerMatching.matchEndConfirm'))) return;
		try {
			await peerMatchingApi.endMatch(matchId);
			toast.success(i18n.t('peerMatching.matchEndedToast'));
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		}
	}

	async function scheduleSession() {
		if (!scheduleFor || !scheduleAt) return;
		busy = true;
		try {
			await peerMatchingApi.scheduleSession(scheduleFor, new Date(scheduleAt).toISOString());
			toast.success(i18n.t('peerMatching.sessionScheduledToast'));
			await loadSessions(scheduleFor);
			scheduleFor = null;
			scheduleAt = '';
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			busy = false;
		}
	}

	async function submitCheckIn() {
		if (!checkInFor) return;
		busy = true;
		try {
			await peerMatchingApi.checkIn(checkInFor.id, {
				notes: checkInNotes.trim() || undefined,
				rating: Number(checkInRating)
			});
			toast.success(i18n.t('peerMatching.checkInSavedToast'));
			await loadSessions(checkInFor.match_id);
			checkInFor = null;
			checkInNotes = '';
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			busy = false;
		}
	}

	async function cancelSession(session: PeerSession) {
		if (!confirm(i18n.t('peerMatching.sessionCancelConfirm'))) return;
		try {
			await peerMatchingApi.cancelSession(session.id);
			await loadSessions(session.match_id);
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		}
	}

	function fmtDateTime(iso: string): string {
		return new Date(iso).toLocaleString(i18n.locale, {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	/** Compatibility reason, rendered as one readable line. */
	function reasonLine(p: PeerProposal): string {
		const parts: string[] = [];
		parts.push(
			p.reason.rank_distance === 0
				? i18n.t('peerMatching.sameRank')
				: i18n.t('peerMatching.rankDistance', { n: p.reason.rank_distance })
		);
		parts.push(
			p.reason.timezone_distance_hours === null
				? i18n.t('peerMatching.timezoneUnknown')
				: i18n.t('peerMatching.timezoneClose', { n: p.reason.timezone_distance_hours })
		);
		parts.push(
			p.reason.shared_languages.length > 0
				? i18n.t('peerMatching.sharedLanguages', { list: p.reason.shared_languages.join(', ') })
				: i18n.t('peerMatching.noSharedLanguages')
		);
		return parts.join(' · ');
	}

	onMount(async () => {
		const [orientationsRes] = await Promise.allSettled([orientationsApi.list(), load()]);
		if (orientationsRes.status === 'fulfilled') {
			orientations = (orientationsRes.value.data?.orientations ?? []).filter((o) => !o.is_archived);
			if (!enrollOrientationId && orientations.length > 0) enrollOrientationId = orientations[0].id;
		}
	});
</script>

<svelte:head>
	<title>{i18n.t('peerMatching.title')} | Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-8" data-testid="peer-matching-page">
	<header class="mb-8">
		<h1 class="text-3xl font-bold text-text-primary">{i18n.t('peerMatching.title')}</h1>
		<p class="mt-2 text-text-muted">{i18n.t('peerMatching.subtitle')}</p>
		<p class="mt-1 text-sm text-text-muted">{i18n.t('peerMatching.vsMentorship')}</p>
	</header>

	{#if loading}
		<div class="space-y-4">
			{#each Array(3) as _, i (i)}
				<Skeleton class="h-32 w-full" rounded="xl" />
			{/each}
		</div>
	{:else if loadError}
		<div class="rounded-2xl border border-error/40 bg-error/5 p-6 text-center" role="alert">
			<p class="text-sm text-error">{loadError}</p>
			<Button variant="ghost" size="sm" class="mt-3" onclick={load}>
				{i18n.t('common.actions.retry')}
			</Button>
		</div>
	{:else}
		<!-- Enrollment -->
		<section class="rounded-2xl border border-border bg-surface-elevated p-5">
			<h2 class="text-sm font-bold text-text-primary">{i18n.t('peerMatching.enrollTitle')}</h2>
			<div class="mt-4 flex flex-wrap items-end gap-3">
				<div class="min-w-[200px] flex-1">
					<span class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
						{i18n.t('peerMatching.enrollOrientation')}
					</span>
					<Select
						items={orientationItems}
						value={enrollOrientationId}
						onchange={(v) => (enrollOrientationId = v)}
						shape="rounded"
						searchable
					/>
				</div>
				<div class="min-w-[160px]">
					<span class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
						{i18n.t('peerMatching.enrollCadence')}
					</span>
					<Select
						items={cadenceItems}
						value={enrollCadence}
						onchange={(v) => (enrollCadence = v)}
						shape="rounded"
					/>
				</div>
				<Button
					variant="accent"
					loading={busy}
					disabled={!enrollOrientationId || enrolledIds.has(enrollOrientationId)}
					onclick={enroll}
				>
					{i18n.t('peerMatching.enrollSubmit')}
				</Button>
			</div>

			<div class="mt-5 border-t border-border pt-4">
				<h3 class="text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.t('peerMatching.enrollmentsTitle')}
				</h3>
				{#if enrollments.length === 0}
					<p class="mt-2 text-sm text-text-muted">{i18n.t('peerMatching.enrollmentsEmpty')}</p>
				{:else}
					<ul class="mt-3 space-y-2" role="list">
						{#each enrollments as row (row.enrollment.orientation_id)}
							<li class="flex flex-wrap items-center justify-between gap-2">
								<span class="text-sm text-text-primary">
									{row.orientation_name}
									<span class="ml-2 text-xs text-text-muted">
										{i18n.t('peerMatching.enrollCadenceUnit', { n: row.enrollment.weekly_cadence })}
									</span>
								</span>
								<div class="flex items-center gap-2">
									<Button
										variant="ghost"
										size="sm"
										onclick={() => loadProposals(row.enrollment.orientation_id)}
									>
										{i18n.t('peerMatching.proposalsPick')}
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onclick={() => unenroll(row.enrollment.orientation_id)}
									>
										{i18n.t('peerMatching.unenroll')}
									</Button>
								</div>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</section>

		<!-- Proposals -->
		{#if proposalsFor}
			<section class="mt-6 rounded-2xl border border-border bg-surface-elevated p-5">
				<div class="flex items-center justify-between">
					<h2 class="text-sm font-bold text-text-primary">{i18n.t('peerMatching.proposalsTitle')}</h2>
					<Button
						variant="ghost"
						size="sm"
						loading={loadingProposals}
						onclick={() => loadProposals(proposalsFor)}
					>
						<span class="inline-flex items-center gap-1.5">
							<RefreshCw size={12} strokeWidth={2} />
							{i18n.t('peerMatching.proposalsRefresh')}
						</span>
					</Button>
				</div>

				{#if loadingProposals}
					<Skeleton class="mt-4 h-24 w-full" rounded="xl" />
				{:else if proposals.length === 0}
					<p class="mt-3 text-sm text-text-muted">{i18n.t('peerMatching.proposalsEmpty')}</p>
				{:else}
					<ul class="mt-4 space-y-3" role="list">
						{#each proposals as proposal (proposal.user_id)}
							<li class="rounded-xl border border-border p-4">
								<div class="flex flex-wrap items-start justify-between gap-3">
									<div class="min-w-0 flex-1">
										<p class="flex flex-wrap items-center gap-2">
											<span class="text-sm font-semibold text-text-primary">
												{proposal.display_name}
											</span>
											<Badge size="sm">{i18n.t(`common.titles.${proposal.rank}`)}</Badge>
											<Badge variant="accent" size="sm">
												{i18n.t('peerMatching.scoreLabel', { score: proposal.score })}
											</Badge>
										</p>
										<p class="mt-1.5 text-xs text-text-muted">{reasonLine(proposal)}</p>
									</div>
									<Button variant="accent" size="sm" loading={busy} onclick={() => createMatch(proposal)}>
										{i18n.t('peerMatching.proposalsPick')}
									</Button>
								</div>
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		{:else if proposalOrientations.length > 0}
			<p class="mt-6 text-sm text-text-muted">{i18n.t('peerMatching.proposalsEmpty')}</p>
		{/if}

		<!-- Matches -->
		<section class="mt-6">
			<div class="mb-3 flex items-center justify-between">
				<h2 class="text-sm font-bold text-text-primary">{i18n.t('peerMatching.matchesTitle')}</h2>
				<Button
					variant="ghost"
					size="sm"
					onclick={() => {
						includeEnded = !includeEnded;
						void load();
					}}
				>
					{i18n.t('peerMatching.showEnded')}
				</Button>
			</div>

			{#if matches.length === 0}
				<EmptyState
					variant="scroll"
					size="sm"
					align="left"
					title={i18n.t('peerMatching.matchesEmpty')}
				/>
			{:else}
				<div class="space-y-4">
					{#each matches as row (row.match.id)}
						{@const rows = sessions[row.match.id] ?? []}
						<article class="rounded-2xl border border-border bg-surface-elevated p-5">
							<div class="flex flex-wrap items-start justify-between gap-3">
								<div>
									<p class="flex flex-wrap items-center gap-2">
										<span class="text-base font-bold text-text-primary">
											{row.peer.display_name}
										</span>
										<Badge variant={row.match.active ? 'success' : 'default'} size="sm">
											{row.match.active
												? i18n.t('peerMatching.matchActive')
												: i18n.t('peerMatching.matchEnded')}
										</Badge>
									</p>
									<p class="mt-1 text-xs text-text-muted">
										{row.orientation_slug}
										<span class="mx-1.5">·</span>
										{i18n.t('peerMatching.enrollCadenceUnit', { n: row.match.weekly_cadence })}
									</p>
								</div>
								{#if row.match.active}
									<div class="flex items-center gap-2">
										<Button
											variant="ghost"
											size="sm"
											onclick={() => {
												scheduleFor = row.match.id;
												scheduleAt = '';
											}}
										>
											<span class="inline-flex items-center gap-1.5">
												<CalendarPlus size={12} strokeWidth={2} />
												{i18n.t('peerMatching.sessionScheduleCta')}
											</span>
										</Button>
										<Button variant="ghost" size="sm" onclick={() => endMatch(row.match.id)}>
											{i18n.t('peerMatching.matchEnd')}
										</Button>
									</div>
								{/if}
							</div>

							<div class="mt-4 border-t border-border pt-4">
								<h3 class="text-xs font-bold uppercase tracking-wider text-text-muted">
									{i18n.t('peerMatching.sessionsTitle')}
								</h3>
								{#if rows.length === 0}
									<p class="mt-2 text-sm text-text-muted">{i18n.t('peerMatching.sessionsEmpty')}</p>
								{:else}
									<ul class="mt-3 space-y-2" role="list">
										{#each rows as session (session.id)}
											{@const upcoming = new Date(session.session_at).getTime() > Date.now()}
											<li class="flex flex-wrap items-center justify-between gap-2 text-sm">
												<span class={session.canceled ? 'text-text-muted line-through' : 'text-text-primary'}>
													{fmtDateTime(session.session_at)}
												</span>
												<div class="flex items-center gap-2">
													<Badge size="sm">
														{session.canceled
															? i18n.t('peerMatching.sessionCanceled')
															: upcoming
																? i18n.t('peerMatching.sessionUpcoming')
																: i18n.t('peerMatching.sessionPast')}
													</Badge>
													{#if !session.canceled && !upcoming}
														<Button
															variant="ghost"
															size="sm"
															onclick={() => {
																checkInFor = session;
																checkInNotes = '';
															}}
														>
															{i18n.t('peerMatching.checkInTitle')}
														</Button>
													{/if}
													{#if !session.canceled && upcoming}
														<Button variant="ghost" size="sm" onclick={() => cancelSession(session)}>
															{i18n.t('peerMatching.sessionCancel')}
														</Button>
													{/if}
												</div>
											</li>
										{/each}
									</ul>
								{/if}
							</div>
						</article>
					{/each}
				</div>
			{/if}
		</section>
	{/if}
</div>

<Modal
	open={scheduleFor !== null}
	title={i18n.t('peerMatching.sessionScheduleCta')}
	onclose={() => (scheduleFor = null)}
	size="sm"
>
	<Input label={i18n.t('peerMatching.sessionSchedule')} type="datetime-local" bind:value={scheduleAt} />

	{#snippet actions()}
		<Button variant="ghost" onclick={() => (scheduleFor = null)}>
			{i18n.t('common.actions.cancel')}
		</Button>
		<Button variant="accent" loading={busy} disabled={!scheduleAt} onclick={scheduleSession}>
			{i18n.t('common.actions.confirm')}
		</Button>
	{/snippet}
</Modal>

<Modal
	open={checkInFor !== null}
	title={i18n.t('peerMatching.checkInTitle')}
	onclose={() => (checkInFor = null)}
	size="sm"
>
	<div class="space-y-4">
		<div>
			<label
				for="peer-check-in-notes"
				class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted"
			>
				{i18n.t('peerMatching.checkInNotes')}
			</label>
			<textarea
				id="peer-check-in-notes"
				bind:value={checkInNotes}
				rows="4"
				maxlength={2000}
				placeholder={i18n.t('peerMatching.checkInNotesPlaceholder')}
				class="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
			></textarea>
		</div>
		<div>
			<span class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
				{i18n.t('peerMatching.checkInRating')}
			</span>
			<Select
				items={ratingItems}
				value={checkInRating}
				onchange={(v) => (checkInRating = v)}
				shape="rounded"
			/>
		</div>
	</div>

	{#snippet actions()}
		<Button variant="ghost" onclick={() => (checkInFor = null)}>
			{i18n.t('common.actions.cancel')}
		</Button>
		<Button variant="accent" loading={busy} onclick={submitCheckIn}>
			{i18n.t('peerMatching.checkInSubmit')}
		</Button>
	{/snippet}
</Modal>
