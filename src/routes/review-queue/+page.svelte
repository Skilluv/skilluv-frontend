<script lang="ts">
	/**
	 * What is waiting on your judgement: review tasks, and beginner
	 * verifications.
	 *
	 * Two queues on one page because they ask the same thing of the same
	 * person — read somebody's work and say what you think — and because a
	 * reviewer who has to remember two URLs checks one of them.
	 *
	 * ## A claim is a lease, and the page says when it runs out
	 *
	 * `claim_expires_at` exists so a reviewer who claims a task and vanishes
	 * does not hold it forever — the deliverable behind it belongs to somebody
	 * waiting. So the row shows the time remaining rather than the word
	 * "claimed": a reviewer who does not know the lease is running loses work
	 * they had half finished.
	 *
	 * ## The SLA is about the person waiting, not the reviewer
	 *
	 * `sla_deadline` is how long somebody has been waiting for a verdict on
	 * work they submitted. Past it, the row is marked — not to shame whoever
	 * has it, but because that is the one signal that says which task to pick
	 * next.
	 *
	 * ## Neither queue is gated on a role here
	 *
	 * Both answer 403 without the capability, and that answer is the authority.
	 * A section that renders empty because the server said no looks the same as
	 * one with nothing in it, which is the honest outcome: this page does not
	 * claim to know what somebody is allowed to judge.
	 */
	import { onMount } from 'svelte';
	import { Gavel } from '@lucide/svelte';
	import { reviewQueueApi, claimIsLive, isPastSla, type ReviewTask } from '$api/review_queue';
	import { apprenticeVerificationsApi, type VerificationRequest } from '$api/apprentice_verifications';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';

	let tasks = $state<ReviewTask[]>([]);
	let verifications = $state<VerificationRequest[]>([]);
	let loading = $state(true);
	let busy = $state<Record<string, boolean>>({});

	let nothing = $derived(tasks.length === 0 && verifications.length === 0);

	/** Past the promise first — that is what says which one to pick. */
	let sorted = $derived(
		[...tasks].sort((a, b) => {
			const late = Number(isPastSla(b)) - Number(isPastSla(a));
			return late !== 0 ? late : b.priority - a.priority;
		})
	);

	/** How long a lease has left, in the reader's words. */
	function leaseLeft(t: ReviewTask): string | null {
		if (!t.claim_expires_at) return null;
		const ms = new Date(t.claim_expires_at).getTime() - Date.now();
		if (ms <= 0) return null;
		const mins = Math.round(ms / 60000);
		if (mins < 60) return i18n.t('reviewQueue.minutesLeft', { n: mins });
		return i18n.t('reviewQueue.hoursLeft', { n: Math.round(mins / 60) });
	}

	async function load() {
		loading = true;
		// A caller without one capability must still see the other queue.
		const [t, v] = await Promise.allSettled([
			reviewQueueApi.open({ per_page: 50 }),
			apprenticeVerificationsApi.queue({ limit: 50 })
		]);
		if (t.status === 'fulfilled') tasks = t.value.data?.tasks ?? [];
		if (v.status === 'fulfilled') verifications = v.value.data?.pending ?? [];
		loading = false;
	}

	async function claim(id: string) {
		if (busy[id]) return;
		busy = { ...busy, [id]: true };
		try {
			const res = await reviewQueueApi.claim(id);
			// The server says what the claim means and how long it lasts.
			// Replacing that with a generic toast throws it away.
			toast.success(res.data?.message ?? i18n.t('reviewQueue.claimed'));
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			busy = { ...busy, [id]: false };
		}
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('reviewQueue.title')} · Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-3xl space-y-8 px-4 py-8" data-testid="review-queue-page">
	<header class="space-y-2">
		<h1 class="flex items-center gap-2 text-2xl font-bold text-text">
			<Gavel size={22} />
			{i18n.t('reviewQueue.title')}
		</h1>
		<p class="text-sm text-text-muted">{i18n.t('reviewQueue.subtitle')}</p>
	</header>

	{#if loading}
		<Skeleton class="h-64 w-full" rounded="xl" />
	{:else if nothing}
		<EmptyState
			title={i18n.t('reviewQueue.empty')}
			body={i18n.t('reviewQueue.emptyHint')}
			size="sm"
		/>
	{:else}
		{#if sorted.length > 0}
			<section class="space-y-3" data-testid="review-tasks">
				<h2 class="text-sm font-bold uppercase tracking-wider text-text-muted">
					{i18n.t('reviewQueue.tasksTitle')}
				</h2>
				<ul class="space-y-3">
					{#each sorted as t (t.id)}
						{@const late = isPastSla(t)}
						{@const lease = claimIsLive(t) ? leaseLeft(t) : null}
						<li
							class="rounded-xl border border-border bg-surface-elevated p-4"
							data-testid="review-task"
						>
							<div class="flex flex-wrap items-start justify-between gap-2">
								<div class="min-w-0 space-y-1">
									<h3 class="text-sm font-bold text-text">{t.task_type}</h3>
									<p class="text-xs text-text-muted">
										{t.primary_domain} · {i18n.t('reviewQueue.seniority', {
											level: t.required_seniority
										})}
									</p>
								</div>
								{#if lease}
									<!-- The remaining lease, not the word "claimed". Somebody who
									     does not know it is running loses half-finished work. -->
									<Badge size="sm" variant="accent">{lease}</Badge>
								{:else}
									<Button
										size="sm"
										loading={busy[t.id]}
										onclick={() => claim(t.id)}
										data-testid="claim-task"
									>
										{i18n.t('reviewQueue.claimCta')}
									</Button>
								{/if}
							</div>

							{#if late}
								<!-- About the person waiting, not about whoever holds it. -->
								<p class="mt-2 text-xs text-warning">{i18n.t('reviewQueue.pastSla')}</p>
							{/if}
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if verifications.length > 0}
			<section class="space-y-3" data-testid="review-verifications">
				<h2 class="text-sm font-bold uppercase tracking-wider text-text-muted">
					{i18n.t('reviewQueue.verificationsTitle')}
				</h2>
				<!-- Said before the list: this is not a test somebody can fail at
				     being a beginner. It is what lets a beginner's work count. -->
				<p class="text-sm text-text-muted">{i18n.t('reviewQueue.verificationsHint')}</p>
				<ul class="space-y-2">
					{#each verifications as v (v.id)}
						<li class="rounded-xl border border-border bg-surface-elevated p-4 text-sm">
							<span class="font-mono text-xs text-text-muted">{v.id}</span>
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	{/if}
</div>
