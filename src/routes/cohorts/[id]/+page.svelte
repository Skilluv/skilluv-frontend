<script lang="ts">
	/**
	 * SKI-40 — one cohort: what it is, who is in it, what it owes itself, and
	 * the group discussion.
	 *
	 * Members and milestones are readable by anyone who can read the cohort;
	 * the discussion is members-only server-side, so a non-member sees the
	 * reason rather than an empty thread.
	 */
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { CalendarRange, Send, Trash2, Users } from '@lucide/svelte';
	import { cohortsApi } from '$lib/api/cohorts';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import Modal from '$components/ui/Modal.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import { CohortOutcomes, EducationOutcomes } from '$components/leadership';
	import type {
		CohortDetail,
		CohortMemberListing,
		CohortMessage,
		CohortMilestone
	} from '$types';

	const MESSAGE_PAGE = 50;

	let cohortId = $derived($page.params.id ?? '');

	let detail = $state<CohortDetail | null>(null);
	let members = $state<CohortMemberListing[]>([]);
	let milestones = $state<CohortMilestone[]>([]);
	let messages = $state<CohortMessage[]>([]);
	let loading = $state(true);
	let loadError = $state('');
	let busy = $state(false);

	let draft = $state('');
	let sending = $state(false);
	let messagesExhausted = $state(false);
	let loadingOlder = $state(false);

	let milestoneOpen = $state(false);
	let milestoneTitle = $state('');
	let milestoneDescription = $state('');
	let milestoneDate = $state('');

	let isMember = $derived(detail?.my_role != null);
	let isOrganizer = $derived(detail?.my_role === 'organizer');
	let isOver = $derived(
		detail ? new Date(detail.cohort.ends_at).getTime() < Date.now() : false
	);
	let canJoin = $derived(
		!!auth.user && !!detail && !isMember && detail.cohort.is_public && detail.seats_left > 0 && !isOver
	);

	/** Oldest first, so the thread reads top to bottom like a conversation. */
	let orderedMessages = $derived(
		[...messages].sort(
			(a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
		)
	);

	let memberName = $derived(new Map(members.map((m) => [m.user_id, m.display_name])));

	async function load() {
		loading = true;
		loadError = '';
		try {
			const res = await cohortsApi.fetch(cohortId);
			detail = res.data;

			const [membersRes, milestonesRes] = await Promise.allSettled([
				cohortsApi.members(cohortId),
				cohortsApi.milestones(cohortId)
			]);
			if (membersRes.status === 'fulfilled') members = membersRes.value.data?.members ?? [];
			if (milestonesRes.status === 'fulfilled') {
				milestones = milestonesRes.value.data?.milestones ?? [];
			}

			if (detail.my_role) await loadMessages();
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

	async function loadMessages(before?: string) {
		const res = await cohortsApi.messages(cohortId, { limit: MESSAGE_PAGE, before });
		const batch = res.data?.messages ?? [];
		messages = before ? [...messages, ...batch] : batch;
		messagesExhausted = batch.length < MESSAGE_PAGE;
	}

	async function loadOlder() {
		const oldest = orderedMessages[0];
		if (!oldest) return;
		loadingOlder = true;
		try {
			await loadMessages(oldest.created_at);
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			loadingOlder = false;
		}
	}

	async function send() {
		const body = draft.trim();
		if (!body) return;
		sending = true;
		try {
			const res = await cohortsApi.postMessage(cohortId, body);
			messages = [...messages, res.data.message];
			draft = '';
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			sending = false;
		}
	}

	async function join() {
		busy = true;
		try {
			await cohortsApi.join(cohortId);
			toast.success(i18n.t('cohorts.joinedToast'));
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			busy = false;
		}
	}

	async function leave() {
		if (!confirm(i18n.t('cohorts.leaveConfirm'))) return;
		busy = true;
		try {
			await cohortsApi.leave(cohortId);
			toast.success(i18n.t('cohorts.leftToast'));
			messages = [];
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			busy = false;
		}
	}

	async function addMilestone() {
		busy = true;
		try {
			const res = await cohortsApi.createMilestone(cohortId, {
				title: milestoneTitle.trim(),
				description: milestoneDescription.trim() || undefined,
				target_date: milestoneDate
			});
			milestones = [...milestones, res.data.milestone].sort((a, b) =>
				a.target_date.localeCompare(b.target_date)
			);
			toast.success(i18n.t('cohorts.milestoneAddedToast'));
			milestoneOpen = false;
			milestoneTitle = '';
			milestoneDescription = '';
			milestoneDate = '';
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			busy = false;
		}
	}

	async function removeMilestone(id: string) {
		try {
			await cohortsApi.removeMilestone(cohortId, id);
			milestones = milestones.filter((m) => m.id !== id);
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		}
	}

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	function fmtDateTime(iso: string): string {
		return new Date(iso).toLocaleString(i18n.locale, {
			day: 'numeric',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	onMount(load);
</script>

<svelte:head>
	<title>{detail ? `${detail.cohort.name} — Skilluv` : `${i18n.t('cohorts.title')} — Skilluv`}</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-8" data-testid="cohort-detail-page">
	{#if loading}
		<Skeleton class="h-32 w-full" rounded="xl" />
		<div class="mt-6 grid gap-6 lg:grid-cols-3">
			<Skeleton class="h-64 w-full lg:col-span-2" rounded="xl" />
			<Skeleton class="h-64 w-full" rounded="xl" />
		</div>
	{:else if loadError}
		<div class="rounded-2xl border border-error/40 bg-error/5 p-6 text-center" role="alert">
			<p class="text-sm text-error">{loadError}</p>
			<Button variant="ghost" size="sm" class="mt-3" href="/cohorts">
				{i18n.t('cohorts.browseCta')}
			</Button>
		</div>
	{:else if detail}
		<header class="rounded-2xl border border-border bg-surface-elevated p-6">
			<div class="flex flex-wrap items-start justify-between gap-4">
				<div class="min-w-0 flex-1">
					<div class="flex flex-wrap items-center gap-2">
						<h1 class="text-2xl font-bold text-text-primary">{detail.cohort.name}</h1>
						{#if detail.cohort.archived_at}
							<Badge size="sm">{i18n.t('cohorts.archived')}</Badge>
						{:else if isOver}
							<Badge size="sm">{i18n.t('cohorts.over')}</Badge>
						{/if}
						{#if !detail.cohort.is_public}
							<Badge size="sm">{i18n.t('cohorts.privateLabel')}</Badge>
						{/if}
						{#if detail.my_role}
							<Badge variant="accent" size="sm">
								{i18n.t(`cohorts.role${detail.my_role === 'organizer' ? 'Organizer' : 'Member'}`)}
							</Badge>
						{/if}
					</div>
					<p class="mt-2 flex flex-wrap items-center gap-4 text-xs text-text-muted">
						<span class="inline-flex items-center gap-1.5">
							<CalendarRange size={12} strokeWidth={2} />
							{i18n.t('cohorts.runsFrom', {
								start: fmtDate(detail.cohort.starts_at),
								end: fmtDate(detail.cohort.ends_at)
							})}
						</span>
						<span class="inline-flex items-center gap-1.5">
							<Users size={12} strokeWidth={2} />
							{i18n.t('cohorts.memberCount', { n: detail.member_count })}
						</span>
						<span>
							{detail.seats_left > 0
								? i18n.t('cohorts.seatsLeft', { n: detail.seats_left })
								: i18n.t('cohorts.full')}
						</span>
					</p>
				</div>
				<div class="flex items-center gap-2">
					{#if canJoin}
						<Button variant="accent" loading={busy} onclick={join}>{i18n.t('cohorts.join')}</Button>
					{:else if isMember}
						<Button variant="ghost" loading={busy} onclick={leave}>{i18n.t('cohorts.leave')}</Button>
					{/if}
				</div>
			</div>

			{#if detail.cohort.description}
				<p class="mt-4 whitespace-pre-wrap border-t border-border pt-4 text-sm text-text-muted">
					{detail.cohort.description}
				</p>
			{/if}
		</header>

		<div class="mt-6 grid gap-6 lg:grid-cols-3">
			<div class="space-y-6 lg:col-span-2">
				<!-- Discussion -->
				<section class="rounded-2xl border border-border bg-surface-elevated overflow-hidden">
					<div class="border-b border-border px-5 py-3">
						<span class="text-xs font-bold uppercase tracking-wider text-text-muted">
							{i18n.t('cohorts.chatTitle')}
						</span>
					</div>
					<div class="p-5">
						{#if !isMember}
							<p class="text-sm text-text-muted">{i18n.t('cohorts.chatMembersOnly')}</p>
						{:else}
							{#if !messagesExhausted && orderedMessages.length > 0}
								<div class="mb-4 text-center">
									<Button variant="ghost" size="sm" loading={loadingOlder} onclick={loadOlder}>
										{i18n.t('cohorts.chatLoadOlder')}
									</Button>
								</div>
							{/if}

							{#if orderedMessages.length === 0}
								<p class="text-sm text-text-muted">{i18n.t('cohorts.chatEmpty')}</p>
							{:else}
								<ul class="space-y-4" role="list">
									{#each orderedMessages as message (message.id)}
										<li>
											<p class="text-xs text-text-muted">
												<span class="font-semibold text-text-primary">
													{message.sender_id ? (memberName.get(message.sender_id) ?? '—') : '—'}
												</span>
												<span class="mx-1.5">·</span>
												{fmtDateTime(message.created_at)}
											</p>
											<p class="mt-1 whitespace-pre-wrap text-sm text-text-primary">
												{message.body}
											</p>
										</li>
									{/each}
								</ul>
							{/if}

							<form
								class="mt-5 flex items-end gap-2 border-t border-border pt-4"
								onsubmit={(e) => {
									e.preventDefault();
									void send();
								}}
							>
								<textarea
									bind:value={draft}
									rows="2"
									maxlength={4000}
									placeholder={i18n.t('cohorts.chatPlaceholder')}
									aria-label={i18n.t('cohorts.chatPlaceholder')}
									class="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
								></textarea>
								<Button
									variant="accent"
									type="submit"
									loading={sending}
									disabled={draft.trim().length === 0}
								>
									<span class="inline-flex items-center gap-1.5">
										<Send size={14} strokeWidth={2} />
										{i18n.t('cohorts.chatSend')}
									</span>
								</Button>
							</form>
						{/if}
					</div>
				</section>
			</div>

			<div class="space-y-6">
				<!-- Milestones -->
				<section class="rounded-2xl border border-border bg-surface-elevated overflow-hidden">
					<div class="flex items-center justify-between border-b border-border px-5 py-3">
						<span class="text-xs font-bold uppercase tracking-wider text-text-muted">
							{i18n.t('cohorts.milestonesTitle')}
						</span>
						{#if isOrganizer}
							<Button variant="ghost" size="sm" onclick={() => (milestoneOpen = true)}>
								{i18n.t('cohorts.milestoneAdd')}
							</Button>
						{/if}
					</div>
					<div class="p-5">
						{#if milestones.length === 0}
							<p class="text-sm text-text-muted">{i18n.t('cohorts.milestonesEmpty')}</p>
						{:else}
							<ul class="space-y-3" role="list">
								{#each milestones as milestone (milestone.id)}
									{@const past = new Date(milestone.target_date).getTime() < Date.now()}
									<li class="flex items-start justify-between gap-2">
										<div class="min-w-0">
											<p class="text-sm font-semibold text-text-primary">{milestone.title}</p>
											{#if milestone.description}
												<p class="mt-0.5 text-xs text-text-muted">{milestone.description}</p>
											{/if}
											<p class="mt-0.5 text-xs {past ? 'text-text-muted' : 'text-accent'}">
												{past
													? i18n.t('cohorts.milestoneDone')
													: i18n.t('cohorts.milestoneDue', { date: fmtDate(milestone.target_date) })}
											</p>
										</div>
										{#if isOrganizer}
											<button
												type="button"
												onclick={() => removeMilestone(milestone.id)}
												aria-label={i18n.t('cohorts.milestoneDelete')}
												title={i18n.t('cohorts.milestoneDelete')}
												class="shrink-0 rounded-full border border-border p-1.5 text-text-muted transition-colors duration-200 hover:border-error hover:text-error"
											>
												<Trash2 size={12} strokeWidth={2} />
											</button>
										{/if}
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				</section>

				<!-- Members -->
				<section class="rounded-2xl border border-border bg-surface-elevated overflow-hidden">
					<div class="border-b border-border px-5 py-3">
						<span class="text-xs font-bold uppercase tracking-wider text-text-muted">
							{i18n.t('cohorts.membersTitle')}
						</span>
					</div>
					<ul class="divide-y divide-border" role="list">
						{#each members as member (member.user_id)}
							<li class="flex items-center justify-between gap-2 px-5 py-3">
								<span class="truncate text-sm text-text-primary">{member.display_name}</span>
								{#if member.role === 'organizer'}
									<Badge variant="accent" size="sm">{i18n.t('cohorts.roleOrganizer')}</Badge>
								{/if}
							</li>
						{/each}
					</ul>
				</section>

				<!-- What became of this cohort. Readable by anybody who can read
				     the cohort, because its record is what somebody weighing
				     joining actually wants. The lead's acts are the lead's. -->
				<section class="rounded-2xl border border-border bg-surface-elevated p-6">
					<CohortOutcomes
						cohortId={cohortId}
						isOrganizer={isOrganizer}
						members={members.map((m) => ({ user_id: m.user_id, display_name: m.display_name }))}
					/>
				</section>

				<!-- The teaching record, beside the leadership one. Different
				     question on the same cohort: one asks whether somebody led the
				     group, the other what the learners got. -->
				<section class="rounded-2xl border border-border bg-surface-elevated p-6">
					<EducationOutcomes cohortId={cohortId} isOrganizer={isOrganizer} />
				</section>
			</div>
		</div>
	{/if}
</div>

<Modal
	open={milestoneOpen}
	title={i18n.t('cohorts.milestoneAdd')}
	onclose={() => (milestoneOpen = false)}
	size="sm"
>
	<div class="space-y-4">
		<Input label={i18n.t('cohorts.milestoneTitle')} bind:value={milestoneTitle} maxlength={200} />
		<Input
			label={i18n.t('cohorts.milestoneDescription')}
			bind:value={milestoneDescription}
			maxlength={2000}
		/>
		<Input label={i18n.t('cohorts.milestoneTargetDate')} type="date" bind:value={milestoneDate} />
	</div>

	{#snippet actions()}
		<Button variant="ghost" onclick={() => (milestoneOpen = false)}>
			{i18n.t('common.actions.cancel')}
		</Button>
		<Button
			variant="accent"
			loading={busy}
			disabled={milestoneTitle.trim().length === 0 || milestoneDate === ''}
			onclick={addMilestone}
		>
			{i18n.t('common.actions.create')}
		</Button>
	{/snippet}
</Modal>
