<script lang="ts">
	import { notificationsApi } from '$api/notifications';
	import { notifications } from '$stores/notifications.svelte';
	import { attestationApi } from '$api/attestation';
	import { auth } from '$stores/auth.svelte';
	import { SkilluError } from '$api/client';
	import Button from '$components/ui/Button.svelte';
	import SegmentedControl from '$components/ui/SegmentedControl.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import { i18n } from '$lib/i18n';
	import type { Notification, NotificationType } from '$types';
	import { Rocket, CheckCircle2, UserPlus, Mail } from '@lucide/svelte';
	import type { Component } from 'svelte';

	// SKI-97 — 4 categories iconiques :
	//   workflow (claim/PR/CI/merge/close) -> Rocket
	//   validation (validated/rejected/pickups)  -> CheckCircle2
	//   candidature validateur                   -> UserPlus
	//   maintainer digest                        -> Mail
	const typeIcon: Partial<Record<NotificationType, Component>> = {
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
	}

	function ctx(n: Notification): NotifData {
		return (n.data as NotifData | null) ?? {};
	}

	/** Rendu FR du body enrichi. Fallback : `n.body` renvoye par le back. */
	function renderBody(n: Notification): string {
		const d = ctx(n);
		switch (n.notification_type) {
			case 'slice_claimed':
				return `Tu as claim la slice ${d.slice_title ?? ''}. 7 jours pour livrer.`;
			case 'slice_fork_created':
				return `Ton fork est pret : ${d.fork_url ?? ''}`;
			case 'slice_pr_submitted':
				return `PR ${d.pr_url ?? ''} enregistree, en attente CI`;
			case 'slice_pr_submitted_announced':
				return 'Commentaire poste sur ta PR';
			case 'slice_ci_green':
				return 'Ta PR a passe la CI, en attente de validation Skilluv';
			case 'validation_picked_up_by_you':
				return `Tu as pris en charge la validation de la PR de @${d.claimer ?? ''}`;
			case 'validation_picked_up_by_other':
				return `Ta PR est en cours de review par @${d.validator ?? ''}`;
			case 'slice_validated':
				return 'Ta PR a ete validee. Attestation generee. Fragments credites.';
			case 'slice_rejected':
				return `Ta PR a ete refusee par @${d.validator ?? ''}. Raison : ${d.reason ?? '—'}`;
			case 'slice_merged_upstream':
				return `Ta PR a ete mergee sur ${d.repo ?? ''}. Bonus de ${d.fragments_bonus ?? 0} fragments.`;
			case 'slice_pr_rejected_upstream':
				return 'Ta PR a ete fermee upstream sans merge. Tu peux reprendre la slice ou passer a autre chose.';
			case 'validator_application_status_changed':
				return `Ta candidature validateur (${d.domain ?? ''}) a ete ${d.status ?? ''}`;
			case 'validator_invitation_received':
				return `Skilluv t'invite a devenir validateur ${d.domain ?? ''}. Raison : ${d.notes ?? '—'}`;
			case 'slice_upstream_closed':
				return `L'issue upstream ${d.upstream_issue_url ?? ''} a ete fermee. Ta claim a ete relachee.`;
			case 'maintainer_digest_confirmation_sent':
				return 'Email de confirmation envoye';
			case 'maintainer_digest_subscribed':
				return 'Ton abonnement digest est confirme';
			default:
				return n.body ?? '';
		}
	}
	// TODO(J-05 v2): grouper par slice_id si plusieurs notifs consecutives.

	let items = $state<Notification[]>([]);
	let loading = $state(true);
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

	async function loadNotifications() {
		loading = true;
		try {
			const res = await notificationsApi.list({ read: filterRead, per_page: 50 });
			items = res.data;
		} catch (err) {
			if (err instanceof SkilluError) error = err.message;
			else error = 'Impossible de charger les notifications.';
		} finally {
			loading = false;
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
			{#each items as notif}
				{@const Icon = typeIcon[notif.notification_type]}
				{@const d = ctx(notif)}
				{@const enrichedBody = renderBody(notif)}
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
						{#if enrichedBody}
							<p class="text-xs text-text-muted">{enrichedBody}</p>
						{/if}

						<!-- CTA inline SKI-97 (rendus si contexte requis present). -->
						{#if notif.notification_type === 'slice_rejected' && d.slice_id}
							<div class="mt-2">
								<Button variant="ghost" size="sm" href={`/slices/${d.slice_id}`}>
									Voir raisons et reclaim
								</Button>
							</div>
						{:else if notif.notification_type === 'validator_invitation_received' && d.invitation_id}
							<div class="mt-2 flex gap-2">
								<Button variant="primary" size="sm" href={`/settings/validator-invitations/${d.invitation_id}`}>
									Accepter
								</Button>
								<Button variant="ghost" size="sm" href={`/settings/validator-invitations/${d.invitation_id}`}>
									Refuser
								</Button>
							</div>
						{:else if notif.notification_type === 'slice_validated' && d.attestation_hash}
							<div class="mt-2">
								<Button variant="ghost" size="sm" href={attestationApi.pdfUrl(d.attestation_hash)}>
									Telecharger PDF
								</Button>
							</div>
						{:else if notif.notification_type === 'slice_merged_upstream' && auth.user?.username}
							<div class="mt-2">
								<Button variant="ghost" size="sm" href={attestationApi.badgeUserUrl(auth.user.username)}>
									Partager mon badge
								</Button>
							</div>
						{/if}
					</button>

					<span class="shrink-0 text-xs text-text-muted">{formatDate(notif.created_at)}</span>
					{#if !notif.read}
						<span class="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent"></span>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
