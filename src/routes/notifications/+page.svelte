<script lang="ts">
	import { notificationsApi } from '$api/notifications';
	import { notifications } from '$stores/notifications.svelte';
	import { attestationApi } from '$api/attestation';
	import { validatorApplicationsApi } from '$api/validatorApplications';
	import { toast } from '$stores/toast.svelte';
	import { auth } from '$stores/auth.svelte';
	import { SkilluError } from '$api/client';
	import Button from '$components/ui/Button.svelte';
	import SegmentedControl from '$components/ui/SegmentedControl.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import { i18n } from '$lib/i18n';
	import type { Notification } from '$types';
	import { foldNotifications, actorsLine } from '$lib/utils/notificationGrouping';
	import {
		Rocket,
		CheckCircle2,
		UserPlus,
		Mail,
		Wallet,
		Scale,
		AtSign,
		Users,
		CalendarCheck,
		ShieldAlert,
		Award,
		Building2,
		MessageSquare
	} from '@lucide/svelte';
	import type { Component } from 'svelte';

	// SKI-97 — 4 categories iconiques :
	//   workflow (claim/PR/CI/merge/close) -> Rocket
	//   validation (validated/rejected/pickups)  -> CheckCircle2
	//   candidature validateur                   -> UserPlus
	//   maintainer digest                        -> Mail
	const typeIcon: Record<string, Component> = {
		slice_claimed: Rocket,
		slice_fork_created: Rocket,
		slice_pr_submitted: Rocket,
		slice_pr_submitted_announced: Rocket,
		slice_ci_green: Rocket,
		slice_upstream_closed: Rocket,
		slice_merged_upstream: Rocket,
		slice_pr_rejected_upstream: Rocket,
		validation_picked_up_by_you: CheckCircle2,
		validation_picked_up_by_other: CheckCircle2,
		slice_validated: CheckCircle2,
		slice_rejected: CheckCircle2,
		validator_application_status_changed: UserPlus,
		validator_invitation_received: UserPlus,
		maintainer_digest_confirmation_sent: Mail,
		maintainer_digest_subscribed: Mail
	};

	/**
	 * Icon per `kind` family, keyed on the dotted prefix.
	 *
	 * The backend catalogue holds some sixty kinds and gains one with every
	 * feature. Enumerating them here would mean a kind added server-side
	 * renders with no icon until the next frontend release. The prefix is
	 * stable.
	 */
	const familyIcon: Record<string, Component> = {
		payout: Wallet,
		payment: Wallet,
		funds: Wallet,
		dispute: Scale,
		social: AtSign,
		forum: MessageSquare,
		dm: MessageSquare,
		guild: Users,
		mentorship: CalendarCheck,
		security: ShieldAlert,
		account: ShieldAlert,
		badge: Award,
		rank: Award,
		attestation: Award,
		tournament: Award,
		enterprise: Building2,
		contact: UserPlus,
		challenge: CheckCircle2,
		deliverable: CheckCircle2,
		community: CheckCircle2,
		digest: Mail,
		lifecycle: Mail,
		streak: Mail
	};

	function iconFor(n: Notification): Component | undefined {
		const legacy = typeIcon[n.notification_type];
		if (legacy) return legacy;
		const kind = n.kind ?? n.notification_type;
		return familyIcon[kind.split('.')[0]];
	}


	// Contexte data payload (best-effort — deprecate CTA si champ absent).
	interface NotifData {
		slice_id?: string;
		slice_title?: string;
		fork_url?: string;
		pr_url?: string;
		repo?: string;
		claimer?: string;
		validator?: string;
		reason?: string;
		fragments_bonus?: number;
		invitation_id?: string;
		domain?: string;
		status?: string;
		notes?: string;
		attestation_hash?: string;
		upstream_issue_url?: string;
		/** SKI-43 promotion payloads. */
		to_rank?: string;
		unlock_hint?: { unlocked_slices_count?: number; sample?: { slice_id: string; title: string }[] };
		capability?: string;
		badge_slug?: string;
		goal_id?: string;
	}

	function ctx(n: Notification): NotifData {
		return (n.data as NotifData | null) ?? {};
	}

	/**
	 * The five kinds `promotion_notify` emits (SKI-43).
	 *
	 * Rows written before the catalogue carry the kind in `notification_type`
	 * instead of `kind`, so both are consulted. Anything else returns null and
	 * falls through the CTA chain untouched.
	 */
	const PROMOTION_KINDS = new Set([
		'rank.promoted',
		'capability.granted',
		'badge.awarded',
		'deliverable.first_verified',
		'goal.reached'
	]);

	function promotionKind(n: Notification): string | null {
		const kind = n.kind ?? n.notification_type;
		return PROMOTION_KINDS.has(kind) ? kind : null;
	}

	/** Localised body for enriched types. Falls back to the backend `body`. */
	function renderBody(n: Notification): string {
		const d = ctx(n);
		const key = `notifTypes.${n.notification_type}`;
		const params: Record<string, string | number> = {
			title: d.slice_title ?? '',
			url: d.fork_url ?? d.pr_url ?? d.upstream_issue_url ?? '',
			user: d.claimer ?? d.validator ?? '',
			reason: d.reason ?? '—',
			repo: d.repo ?? '',
			n: d.fragments_bonus ?? 0,
			domain: d.domain ?? '',
			notes: d.notes ?? '—',
			status:
				d.status === 'approved'
					? i18n.t('notifTypes.statusApproved')
					: d.status === 'rejected'
						? i18n.t('notifTypes.statusRejected')
						: (d.status ?? '')
		};
		const text = i18n.t(key, params);
		// `t()` returns the key itself when missing: fall back to the backend copy
		// rather than showing a raw key to the user.
		return text === key ? (n.body ?? '') : text;
	}


	let items = $state<Notification[]>([]);

	let grouped = $derived(foldNotifications(items));
	let loading = $state(true);
	let loadingMore = $state(false);
	let page = $state(1);
	let totalPages = $state(1);
	let error = $state('');
	let filterRead = $state<boolean | undefined>(false);
	let filterValue = $derived(filterRead === false ? 'unread' : 'all');

	/** Couleur accent par type — l'icône est rendue via le composant NotifIcon plus bas. */
	const typeColor: Record<string, string> = {
		interest_request_received: 'text-primary',
		interest_accepted: 'text-success',
		interest_declined: 'text-text-muted',
		new_message: 'text-primary',
		challenge_approved: 'text-success',
		challenge_rejected: 'text-warning',
		account_banned: 'text-error',
		account_unbanned: 'text-success',
		// SKI-97 — coloration workflow challenge.
		slice_claimed: 'text-primary',
		slice_fork_created: 'text-primary',
		slice_pr_submitted: 'text-primary',
		slice_pr_submitted_announced: 'text-primary',
		slice_ci_green: 'text-success',
		validation_picked_up_by_you: 'text-primary',
		validation_picked_up_by_other: 'text-primary',
		slice_validated: 'text-success',
		slice_rejected: 'text-warning',
		slice_merged_upstream: 'text-success',
		slice_pr_rejected_upstream: 'text-warning',
		validator_application_status_changed: 'text-primary',
		validator_invitation_received: 'text-primary',
		slice_upstream_closed: 'text-text-muted',
		maintainer_digest_confirmation_sent: 'text-info',
		maintainer_digest_subscribed: 'text-success'
	};

	$effect(() => {
		loadNotifications();
	});

	const PER_PAGE = 50;

	async function loadNotifications() {
		loading = true;
		try {
			const res = await notificationsApi.list({ read: filterRead, page: 1, per_page: PER_PAGE });
			items = res.data;
			page = res.pagination.page;
			totalPages = res.pagination.total_pages;
		} catch (err) {
			if (err instanceof SkilluError) error = err.message;
			else error = 'Impossible de charger les notifications.';
		} finally {
			loading = false;
		}
	}

	/**
	 * Next page, appended.
	 *
	 * Without it the list stopped at fifty without saying so: past that,
	 * notifications existed server-side and no gesture could reach them.
	 */
	async function loadMore() {
		if (loadingMore || page >= totalPages) return;
		loadingMore = true;
		try {
			const res = await notificationsApi.list({
				read: filterRead,
				page: page + 1,
				per_page: PER_PAGE
			});
			items = [...items, ...res.data];
			page = res.pagination.page;
			totalPages = res.pagination.total_pages;
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			loadingMore = false;
		}
	}

	async function markRead(notif: Notification) {
		if (notif.read) return;
		try {
			await notificationsApi.markRead(notif.id);
			notif.read = true;
			notifications.decrement();
		} catch { /* silent */ }
	}

	// SKI-97 — decide a validator invitation without leaving the feed. The
	// outcome replaces the buttons in place: the backend drops the invitation
	// from the list, but the notification itself stays, so without this the
	// user would be looking at buttons for a decision already taken.
	let invitationBusy = $state<string | null>(null);
	let invitationDecisions = $state<Record<string, 'accepted' | 'declined'>>({});

	async function decideInvitation(invitationId: string, accept: boolean) {
		if (!accept && !confirm(i18n.t('notifActions.declineConfirm'))) return;
		invitationBusy = invitationId;
		try {
			if (accept) {
				await validatorApplicationsApi.accept(invitationId);
			} else {
				await validatorApplicationsApi.withdraw(invitationId);
			}
			invitationDecisions = {
				...invitationDecisions,
				[invitationId]: accept ? 'accepted' : 'declined'
			};
			toast.success(
				accept ? i18n.t('notifActions.acceptedOutcome') : i18n.t('notifActions.declinedOutcome')
			);
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : i18n.t('errors.generic'));
		} finally {
			invitationBusy = null;
		}
	}

	async function markAllRead() {
		try {
			await notificationsApi.markAllRead();
			items.forEach((n) => (n.read = true));
			notifications.reset();
		} catch { /* silent */ }
	}

	function formatDate(iso: string): string {
		const d = new Date(iso);
		const now = new Date();
		const diff = now.getTime() - d.getTime();
		if (diff < 3600000) return `${Math.floor(diff / 60000)}min`;
		if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
		return d.toLocaleDateString('fr', { day: 'numeric', month: 'short' });
	}
</script>

<svelte:head>
	<title>{i18n.t('notifications.title')} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-8">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-bold">{i18n.t('notifications.title')}</h1>
		{#if items.some((n) => !n.read)}
			<Button variant="ghost" size="sm" onclick={markAllRead}>{i18n.t('notifications.markAllRead')}</Button>
		{/if}
	</div>

	<!-- Filtres -->
	<div class="mb-4">
		<SegmentedControl
			items={[
				{ value: 'unread', label: i18n.t('notifications.unread') },
				{ value: 'all', label: i18n.t('notifications.all') }
			]}
			value={filterValue}
			onchange={(v) => { filterRead = v === 'unread' ? false : undefined; loadNotifications(); }}
			size="sm"
		/>
	</div>

	{#if loading}
		<div class="flex flex-col gap-2" aria-busy="true">
			{#each Array(5) as _}
				<div class="flex w-full items-start gap-3 rounded-2xl border border-border bg-surface p-4">
					<!-- type dot placeholder -->
					<div class="mt-2 h-2 w-2 shrink-0 rounded-full bg-surface-overlay animate-[skeleton-pulse_1.5s_ease-in-out_infinite]"></div>
					<div class="flex-1 space-y-2">
						<!-- title -->
						<div class="h-4 w-2/3 rounded bg-surface-overlay animate-[skeleton-pulse_1.5s_ease-in-out_infinite]"></div>
						<!-- body -->
						<div class="h-3 w-full rounded bg-surface-overlay animate-[skeleton-pulse_1.5s_ease-in-out_infinite]"></div>
					</div>
					<!-- date -->
					<div class="h-3 w-8 shrink-0 rounded bg-surface-overlay animate-[skeleton-pulse_1.5s_ease-in-out_infinite]"></div>
				</div>
			{/each}
		</div>
	{:else if error}
		<p class="py-8 text-center text-text-muted">{error}</p>
	{:else if items.length === 0}
		<EmptyState
			variant="seal-intact"
			title={i18n.locale === 'fr' ? 'Boîte vide.' : 'Inbox is quiet.'}
			body={i18n.locale === 'fr'
				? 'Quand quelqu\'un t\'aidera ou qu\'un challenge sera validé, tu recevras un sceau ici.'
				: 'When someone helps you or a challenge is validated, a seal will land here.'}
		/>
	{:else}
		<div class="flex flex-col gap-2">
			{#each grouped as row (row.notif.id)}
				{@const notif = row.notif}
				{@const Icon = iconFor(notif)}
				{@const d = ctx(notif)}
				{@const enrichedBody = renderBody(notif)}
				{@const actors = actorsLine(notif, i18n.t)}
				<div
					class="flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors
						{notif.read ? 'border-border bg-surface' : 'border-accent/20 bg-accent/5'}"
				>
					<!-- Icon (SKI-97) ou dot fallback -->
					{#if Icon}
						<span class="mt-0.5 shrink-0 {typeColor[notif.notification_type] ?? 'text-text-muted'}">
							<Icon size={16} strokeWidth={2} />
						</span>
					{:else}
						<span class="mt-2 h-2 w-2 shrink-0 rounded-full {typeColor[notif.notification_type] ?? 'text-text-muted'} bg-current"></span>
					{/if}

					<button
						type="button"
						class="flex-1 text-left"
						onclick={() => markRead(notif)}
					>
						<p class="text-sm font-medium {notif.read ? 'text-text-muted' : 'text-text-primary'}">{notif.title}</p>
						{#if actors}
							<p class="text-xs text-text-muted" data-testid="notif-group-actors">{actors}</p>
						{/if}
						{#if row.count > 1}
							<p class="text-xs text-text-muted" data-testid="notif-group-count">
								{ctx(notif).slice_id
									? i18n.t('notifTypes.groupedCount', { n: row.count })
									: i18n.t('notifTypes.groupedEvents', { n: row.count })}
							</p>
						{/if}
						{#if enrichedBody}
							<p class="text-xs text-text-muted">{enrichedBody}</p>
						{/if}
					</button>

					<div class="flex-1">
						<!-- CTA inline SKI-97 (rendus si contexte requis present).
						     Hors du bouton "marquer comme lu" : imbriquer des
						     elements interactifs est invalide, et le clic sur une
						     action remontait au parent. -->
						{#if notif.notification_type === 'slice_rejected' && d.slice_id}
							<div class="mt-2">
								<Button variant="ghost" size="sm" href={`/slices/${d.slice_id}`}>
									{i18n.t('notifActions.seeReasons')}
								</Button>
							</div>
						{:else if notif.notification_type === 'validator_invitation_received' && d.invitation_id}
							{@const invitationId = d.invitation_id}
							<div class="mt-2 flex flex-wrap items-center gap-2">
								{#if invitationDecisions[invitationId]}
									<span class="text-xs font-medium text-text-muted" data-testid="invitation-outcome">
										{invitationDecisions[invitationId] === 'accepted'
											? i18n.t('notifActions.acceptedOutcome')
											: i18n.t('notifActions.declinedOutcome')}
									</span>
								{:else}
									<Button
										variant="primary"
										size="sm"
										loading={invitationBusy === invitationId}
										onclick={() => decideInvitation(invitationId, true)}
									>
										{i18n.t('notifActions.accept')}
									</Button>
									<Button
										variant="ghost"
										size="sm"
										loading={invitationBusy === invitationId}
										onclick={() => decideInvitation(invitationId, false)}
									>
										{i18n.t('notifActions.decline')}
									</Button>
									<a
										href={`/settings/validator-invitations/${invitationId}`}
										class="text-xs text-text-muted underline hover:text-text-primary"
									>
										{i18n.t('notifActions.seeInvitation')}
									</a>
								{/if}
							</div>
						{:else if notif.notification_type === 'slice_validated' && d.attestation_hash}
							<div class="mt-2">
								<Button variant="ghost" size="sm" href={attestationApi.pdfUrl(d.attestation_hash)}>
									{i18n.t('notifActions.downloadPdf')}
								</Button>
							</div>
						{:else if notif.notification_type === 'slice_merged_upstream' && auth.user?.username}
							<div class="mt-2">
								<Button variant="ghost" size="sm" href={attestationApi.badgeUserUrl(auth.user.username)}>
									{i18n.t('notifActions.shareBadge')}
								</Button>
							</div>
						{:else if promotionKind(notif) === 'rank.promoted'}
							<!-- SKI-43 — celebrate at the moment it happens, and say what
							     the rank actually bought. -->
							<div class="mt-2 flex flex-wrap items-center gap-3">
								<Button variant="primary" size="sm" href="/challenges">
									{i18n.t('promotionNotifs.rankCta')}
								</Button>
								<span class="text-xs text-text-muted">
									{#if (d.unlock_hint?.unlocked_slices_count ?? 0) > 0}
										{i18n.t('promotionNotifs.unlockedSlices', {
											n: d.unlock_hint?.unlocked_slices_count ?? 0
										})}
									{:else}
										{i18n.t('promotionNotifs.unlockedNone')}
									{/if}
								</span>
							</div>
							{#if d.unlock_hint?.sample?.length}
								<ul class="mt-2 space-y-1" role="list">
									{#each d.unlock_hint.sample as slice (slice.slice_id)}
										<li>
											<a
												href={`/slices/${slice.slice_id}`}
												class="text-xs text-text-muted underline-offset-4 hover:text-text-primary hover:underline"
											>
												{slice.title}
											</a>
										</li>
									{/each}
								</ul>
							{/if}
						{:else if promotionKind(notif) === 'capability.granted' && auth.user?.username}
							<div class="mt-2">
								<Button variant="ghost" size="sm" href={`/profile/${auth.user.username}`}>
									{i18n.t('promotionNotifs.capabilityCta')}
								</Button>
							</div>
						{:else if promotionKind(notif) === 'badge.awarded' && auth.user?.username}
							<div class="mt-2">
								<Button variant="ghost" size="sm" href={`/profile/${auth.user.username}`}>
									{i18n.t('promotionNotifs.badgeCta')}
								</Button>
							</div>
						{:else if promotionKind(notif) === 'deliverable.first_verified' && auth.user?.username}
							<div class="mt-2">
								<Button variant="primary" size="sm" href={`/profile/${auth.user.username}`}>
									{i18n.t('promotionNotifs.firstVerifiedCta')}
								</Button>
							</div>
						{:else if promotionKind(notif) === 'goal.reached'}
							<div class="mt-2">
								<Button variant="ghost" size="sm" href="/dashboard/goals">
									{i18n.t('promotionNotifs.goalCta')}
								</Button>
							</div>
						{/if}
					</div>

					<!-- Date of the last folded event: on a grouped row the
					     creation date is the first one, hence the oldest, and
					     the row would look stale. -->
					<span class="shrink-0 text-xs text-text-muted">
						{formatDate(notif.updated_at ?? notif.created_at)}
					</span>
					{#if !notif.read}
						<span class="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent"></span>
					{/if}
				</div>
			{/each}
		</div>

		{#if page < totalPages}
			<div class="mt-4 flex justify-center">
				<Button
					variant="ghost"
					size="sm"
					loading={loadingMore}
					onclick={loadMore}
					data-testid="notif-load-more"
				>
					{i18n.t('common.actions.loadMore')}
				</Button>
			</div>
		{/if}
	{/if}
</div>
