<script lang="ts">
	/**
	 * The dashboard home.
	 *
	 * `/dashboard` had eight sub-pages and no entry point — nothing linked to
	 * it bare, and going there answered a 404. The reason is that the five
	 * reads that belong on it were served under `/users/me/**` and called by
	 * nothing.
	 *
	 * It answers two questions and no more: **what is worth doing next**, and
	 * **what is already waiting on me**. Everything else on the page is a way
	 * into the sub-pages that already existed.
	 *
	 * The suggestions carry their reasons, because the backend returns them
	 * rather than logging them: a recommendation nobody can argue with is a
	 * recommendation nobody trusts. They are cached an hour server-side, which
	 * is said out loud rather than left to look like staleness.
	 *
	 * `/users/me/performance` and `/users/me/orientations/suggest` are not
	 * here. Both go through the AI worker — one rate-limited to a refresh an
	 * hour, the other paying for a model call — so they belong to the
	 * assistant rather than to a page that loads on every visit.
	 */
	import { onMount } from 'svelte';
	import {
		Bookmark,
		CalendarRange,
		ExternalLink,
		Handshake,
		NotebookPen,
		Sparkles,
		Target,
		Timer,
		Trophy,
		Users
	} from '@lucide/svelte';
	import { dashboardApi } from '$lib/api/dashboard';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import { FirstRunBanner } from '$components/onboarding';
	import type {
		ContestInvitation,
		MentorSubscription,
		MyEvent,
		NextChallenge,
		ProjectStewardship
	} from '$types';

	let suggestions = $state<NextChallenge[]>([]);
	let suggestionsCached = $state(false);
	/**
	 * Said rather than swallowed: the endpoint refuses when onboarding never
	 * named a domain, and "no suggestions" would be the wrong reading of that.
	 */
	let suggestionsError = $state('');
	let invitations = $state<ContestInvitation[]>([]);
	let events = $state<MyEvent[]>([]);
	let subscriptions = $state<MentorSubscription[]>([]);
	let stewardships = $state<ProjectStewardship[]>([]);
	let loading = $state(true);

	/** Only the ones still waiting on an answer belong under "waiting on me". */
	let pendingInvitations = $derived(invitations.filter((i) => !i.accepted_at));

	let waitingCount = $derived(pendingInvitations.length);

	const shortcuts = [
		{ href: '/dashboard/opportunities', icon: Handshake, key: 'opportunities' },
		{ href: '/dashboard/bookmarks', icon: Bookmark, key: 'bookmarks' },
		{ href: '/dashboard/notes', icon: NotebookPen, key: 'notes' },
		{ href: '/dashboard/goals', icon: Target, key: 'goals' },
		{ href: '/dashboard/vouchings', icon: Handshake, key: 'vouchings' },
		{ href: '/dashboard/slices', icon: Sparkles, key: 'slices' },
		{ href: '/dashboard/teams', icon: Users, key: 'teams' }
	];

	async function load() {
		loading = true;
		// Settled rather than awaited together: one surface being unavailable
		// must not blank the other four.
		const [next, invites, evts, subs, stews] = await Promise.allSettled([
			dashboardApi.nextChallenges(),
			dashboardApi.contestInvitations(),
			dashboardApi.events(),
			dashboardApi.mentorSubscriptions(),
			dashboardApi.stewardships()
		]);

		if (next.status === 'fulfilled') {
			suggestions = next.value.data?.suggestions ?? [];
			suggestionsCached = next.value.data?.cached ?? false;
		} else {
			suggestionsError =
				next.reason instanceof SkilluError
					? next.reason.message
					: i18n.t('dashboardHome.suggestionsUnavailable');
		}
		if (invites.status === 'fulfilled') invitations = invites.value.data?.invitations ?? [];
		if (evts.status === 'fulfilled') events = evts.value.data?.events ?? [];
		if (subs.status === 'fulfilled') subscriptions = subs.value.data?.subscriptions ?? [];
		if (stews.status === 'fulfilled') stewardships = stews.value.data?.stewardships ?? [];

		loading = false;
	}

	/** A contest points at the tournament; an individual brief at its slice. */
	function suggestionHref(s: NextChallenge): string {
		if (s.format === 'contest') return s.slug ? `/tournaments/${s.slug}` : '/tournaments';
		return `/slices/${s.id}`;
	}

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	function fmtMoney(cents: number, currency: string): string {
		return new Intl.NumberFormat(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', {
			style: 'currency',
			currency: currency || 'EUR',
			maximumFractionDigits: 0
		}).format(cents / 100);
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('dashboardHome.title')} | Skilluv</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-8" data-testid="dashboard-home">
	<!-- Shown only until the first run is finished, then gone: an
	     onboarding that keeps offering itself reads as the platform not
	     having noticed. -->
	<div class="mb-6">
		<FirstRunBanner />
	</div>

	<header class="mb-8">
		<h1 class="text-3xl font-bold text-text-primary">
			{auth.user
				? i18n.t('dashboardHome.greeting', { name: auth.user.display_name || auth.user.username })
				: i18n.t('dashboardHome.title')}
		</h1>
		<p class="mt-2 text-text-muted">
			{waitingCount > 0
				? i18n.t('dashboardHome.waitingOnYou', { n: waitingCount })
				: i18n.t('dashboardHome.nothingWaiting')}
		</p>
	</header>

	{#if loading}
		<div class="space-y-4">
			{#each Array(3) as _}
				<Skeleton class="h-32 w-full" rounded="xl" />
			{/each}
		</div>
	{:else}
		{#if pendingInvitations.length > 0}
			<section class="mb-10" data-testid="dashboard-invitations">
				<h2 class="mb-3 text-lg font-bold text-text-primary">
					{i18n.t('dashboardHome.invitationsTitle')}
				</h2>
				<ul class="space-y-3" role="list">
					{#each pendingInvitations as invitation (invitation.contest_id)}
						<li class="rounded-2xl border border-accent/40 bg-accent/5 p-5">
							<div class="mb-2 flex flex-wrap items-center gap-2">
								<Badge variant="accent" size="sm">{invitation.kind}</Badge>
								{#if invitation.deadline}
									<span class="inline-flex items-center gap-1 text-xs text-text-muted">
										<Timer size={11} strokeWidth={2} />
										{i18n.t('dashboardHome.closesOn', { date: fmtDate(invitation.deadline) })}
									</span>
								{/if}
								<span class="ml-auto text-xs text-text-muted">
									{i18n.t('dashboardHome.invitedOn', { date: fmtDate(invitation.invited_at) })}
								</span>
							</div>
							<p class="text-sm font-semibold text-text-primary">{invitation.title}</p>
							<div class="mt-3 flex justify-end">
								<Button variant="accent" size="sm" href="/tournaments/{invitation.slug}">
									{i18n.t('dashboardHome.openContest')}
								</Button>
							</div>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		<section class="mb-10">
			<div class="mb-3 flex flex-wrap items-baseline justify-between gap-2">
				<h2 class="text-lg font-bold text-text-primary">
					{i18n.t('dashboardHome.nextTitle')}
				</h2>
				{#if suggestionsCached}
					<!-- Cached an hour on purpose: advice that changed on every load
					     would stop reading as advice. -->
					<span class="text-xs text-text-muted">{i18n.t('dashboardHome.cachedNotice')}</span>
				{/if}
			</div>

			{#if suggestionsError}
				<div class="rounded-2xl border border-border bg-surface-elevated p-5">
					<p class="text-sm text-text-muted">{suggestionsError}</p>
					<Button variant="ghost" size="sm" class="mt-3" href="/onboarding/orientations">
						{i18n.t('dashboardHome.pickAnOrientation')}
					</Button>
				</div>
			{:else if suggestions.length === 0}
				<EmptyState
					variant="search"
					title={i18n.t('dashboardHome.nextEmpty')}
					body={i18n.t('dashboardHome.nextEmptyBody')}
				/>
			{:else}
				<ul class="space-y-3" role="list" data-testid="dashboard-suggestions">
					{#each suggestions as suggestion (suggestion.id)}
						<li class="rounded-2xl border border-border bg-surface-elevated p-5">
							<div class="mb-2 flex flex-wrap items-center gap-2">
								<Badge
									variant={suggestion.format === 'contest' ? 'accent' : 'default'}
									size="sm"
								>
									{i18n.t(`dashboardHome.formats.${suggestion.format}`)}
								</Badge>
								{#if suggestion.orientation_slug}
									<span class="text-xs text-text-muted">{suggestion.orientation_slug}</span>
								{/if}
								{#if suggestion.difficulty}
									<span class="text-xs text-text-muted">
										{i18n.t('dashboardHome.difficulty', { n: suggestion.difficulty })}
									</span>
								{/if}
								{#if suggestion.estimated_hours}
									<span class="text-xs text-text-muted">
										{i18n.t('dashboardHome.estimatedHours', { n: suggestion.estimated_hours })}
									</span>
								{/if}
								{#if suggestion.closes_at}
									<span class="ml-auto inline-flex items-center gap-1 text-xs text-warning">
										<Timer size={11} strokeWidth={2} />
										{fmtDate(suggestion.closes_at)}
									</span>
								{/if}
							</div>

							<a
								href={suggestionHref(suggestion)}
								class="text-sm font-semibold text-text-primary hover:text-accent"
							>
								{suggestion.title}
							</a>

							<!-- The reasons are the point. The backend returns them rather
							     than logging them: a recommendation nobody can argue with
							     is a recommendation nobody trusts. -->
							{#if suggestion.reasons.length > 0}
								<ul class="mt-2 space-y-1" role="list">
									{#each suggestion.reasons as reason, i (i)}
										<li class="text-xs text-text-muted">— {reason}</li>
									{/each}
								</ul>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		{#if events.length > 0 || subscriptions.length > 0 || stewardships.length > 0}
			<section class="mb-10">
				<h2 class="mb-3 text-lg font-bold text-text-primary">
					{i18n.t('dashboardHome.partOfTitle')}
				</h2>
				<div class="grid gap-3 sm:grid-cols-2">
					{#if events.length > 0}
						<div class="rounded-2xl border border-border bg-surface-elevated p-5">
							<p class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-muted">
								<CalendarRange size={13} strokeWidth={2} />
								{i18n.t('dashboardHome.eventsTitle')}
							</p>
							<ul class="mt-3 space-y-2" role="list">
								{#each events as event (event.event_slug)}
									<li class="flex flex-wrap items-center gap-x-2 text-sm">
										<a
											href="/events/{event.event_slug}"
											class="text-text-primary hover:text-accent"
										>
											{event.event_name}
										</a>
										<span class="text-xs text-text-muted">{event.role}</span>
										{#if event.contribution_ref}
											<a
												href={event.contribution_ref}
												target="_blank"
												rel="noopener noreferrer nofollow ugc"
												class="ml-auto inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-primary"
											>
												{i18n.t('dashboardHome.contribution')}
												<ExternalLink size={11} strokeWidth={2} />
											</a>
										{/if}
									</li>
								{/each}
							</ul>
						</div>
					{/if}

					{#if subscriptions.length > 0}
						<div class="rounded-2xl border border-border bg-surface-elevated p-5">
							<p class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-muted">
								<Handshake size={13} strokeWidth={2} />
								{i18n.t('dashboardHome.mentoringTitle')}
							</p>
							<ul class="mt-3 space-y-2" role="list">
								{#each subscriptions as subscription (subscription.id)}
									<li class="text-sm">
										<span class="text-text-primary">
											<!-- The same row serves both sides, so which one you
											     are is read from the ids rather than a flag. -->
											{subscription.mentor_user_id === auth.user?.id
												? i18n.t('dashboardHome.asMentor')
												: i18n.t('dashboardHome.asMentee')}
										</span>
										<span class="ml-2 font-mono text-xs text-text-muted">
											{fmtMoney(subscription.monthly_fee_cents, subscription.currency)}
										</span>
										<p class="mt-0.5 text-xs text-text-muted">
											{i18n.t('dashboardHome.periodEnds', {
												date: fmtDate(subscription.current_period_end)
											})}
											{#if !subscription.auto_renew}
												<!-- Stopped, but what was paid for runs to its end. -->
												<span class="ml-1 text-warning">
													{i18n.t('dashboardHome.notRenewing')}
												</span>
											{/if}
										</p>
									</li>
								{/each}
							</ul>
						</div>
					{/if}

					{#if stewardships.length > 0}
						<div class="rounded-2xl border border-border bg-surface-elevated p-5">
							<p class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-muted">
								<Trophy size={13} strokeWidth={2} />
								{i18n.t('dashboardHome.stewardshipsTitle')}
							</p>
							<ul class="mt-3 space-y-1.5" role="list">
								{#each stewardships as stewardship (stewardship.project_id)}
									<li class="flex flex-wrap items-center gap-x-2 text-sm">
										<span class="font-mono text-xs text-text-muted">
											{stewardship.project_id.slice(0, 8)}…
										</span>
										<Badge variant="default" size="sm">{stewardship.role}</Badge>
										<span class="ml-auto text-xs text-text-muted">
											{i18n.t('dashboardHome.since', {
												date: fmtDate(stewardship.appointed_at)
											})}
										</span>
									</li>
								{/each}
							</ul>
						</div>
					{/if}
				</div>
			</section>
		{/if}

		<section>
			<h2 class="mb-3 text-lg font-bold text-text-primary">
				{i18n.t('dashboardHome.yoursTitle')}
			</h2>
			<div class="grid gap-3 sm:grid-cols-3">
				{#each shortcuts as shortcut (shortcut.href)}
					{@const Icon = shortcut.icon}
					<a
						href={shortcut.href}
						class="flex items-center gap-2 rounded-xl border border-border bg-surface-elevated px-4 py-3 text-sm text-text-primary transition-colors hover:border-accent/40"
					>
						<Icon size={14} strokeWidth={2} class="text-text-muted" />
						{i18n.t(`dashboardHome.shortcuts.${shortcut.key}`)}
					</a>
				{/each}
			</div>
		</section>
	{/if}
</div>
