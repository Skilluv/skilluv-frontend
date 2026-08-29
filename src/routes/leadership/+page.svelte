<script lang="ts">
	/**
	 * The leadership workbench: retrospectives you facilitated, and what came
	 * of them.
	 *
	 * Fifteen endpoints served and one read. The domain whose whole claim is
	 * "something happened because of this" had nowhere to record that anything
	 * did.
	 *
	 * ## Actions are the point, not the retrospective
	 *
	 * A retrospective with no resolved actions is a meeting. The backend
	 * returns `followthrough` alongside the actions for exactly that reason, so
	 * this page opens a retrospective onto its actions rather than onto its
	 * insights — the insights are already in the card.
	 *
	 * ## Abandoning is a first-class outcome
	 *
	 * `resolve` takes an optional `abandoned_reason`, and an action dropped
	 * because the problem went away is a good retrospective. Rendering only
	 * done/not-done would push people to fake completion, so abandoned actions
	 * are shown with their reason rather than hidden or counted as failures.
	 *
	 * ## What is not here
	 *
	 * Redaction, links and cohorts are addressed by a slice or a cohort id, so
	 * they live on those. `confirmRedaction` in particular is a reviewer's act
	 * on somebody else's artefact and would be wrong to offer from a page about
	 * your own work.
	 */
	import { onMount } from 'svelte';
	import { ClipboardList } from '@lucide/svelte';
	import {
		leadershipApi,
		actionIsLate,
		actionIsOpen,
		type Retrospective,
		type RetrospectiveAction
	} from '$api/leadership';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Input from '$components/ui/Input.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';

	let retros = $state<Retrospective[]>([]);
	let loading = $state(true);

	/** The retrospective whose actions are open, and the actions themselves. */
	let openId = $state<string | null>(null);
	let actions = $state<RetrospectiveAction[]>([]);
	let actionsLoading = $state(false);
	let busy = $state<Record<string, boolean>>({});

	let newAction = $state('');

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	async function load() {
		loading = true;
		try {
			const res = await leadershipApi.myRetrospectives();
			retros = res.data?.retrospectives ?? [];
		} catch {
			retros = [];
		} finally {
			loading = false;
		}
	}

	async function openActions(id: string) {
		if (openId === id) {
			openId = null;
			return;
		}
		openId = id;
		actionsLoading = true;
		actions = [];
		try {
			const res = await leadershipApi.actions(id);
			actions = res.data?.actions ?? [];
		} catch {
			actions = [];
		} finally {
			actionsLoading = false;
		}
	}

	async function addAction(retroId: string) {
		const text = newAction.trim();
		if (!text || busy[retroId]) return;
		busy = { ...busy, [retroId]: true };
		try {
			await leadershipApi.addAction(retroId, { description: text });
			newAction = '';
			toast.success(i18n.t('leadership.actionAdded'));
			const res = await leadershipApi.actions(retroId);
			actions = res.data?.actions ?? [];
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			busy = { ...busy, [retroId]: false };
		}
	}

	async function resolve(actionId: string, retroId: string, abandonedReason?: string) {
		if (busy[actionId]) return;
		busy = { ...busy, [actionId]: true };
		try {
			await leadershipApi.resolveAction(actionId, abandonedReason);
			toast.success(
				abandonedReason ? i18n.t('leadership.actionAbandoned') : i18n.t('leadership.actionDone')
			);
			const res = await leadershipApi.actions(retroId);
			actions = res.data?.actions ?? [];
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			busy = { ...busy, [actionId]: false };
		}
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('leadership.title')} · Skilluv</title>
	<meta name="description" content={i18n.t('leadership.subtitle')} />
</svelte:head>

<div class="mx-auto max-w-3xl space-y-8 px-4 py-8" data-testid="leadership-page">
	<header class="space-y-2">
		<h1 class="flex items-center gap-2 text-2xl font-bold text-text">
			<ClipboardList size={22} />
			{i18n.t('leadership.title')}
		</h1>
		<p class="text-sm text-text-muted">{i18n.t('leadership.subtitle')}</p>
	</header>

	{#if loading}
		<Skeleton class="h-64 w-full" rounded="xl" />
	{:else if retros.length === 0}
		<EmptyState
			title={i18n.t('leadership.empty')}
			body={i18n.t('leadership.emptyHint')}
			size="sm"
		/>
	{:else}
		<ul class="space-y-3">
			{#each retros as r (r.id)}
				<li
					class="rounded-xl border border-border bg-surface-elevated p-4"
					data-testid="retrospective"
				>
					<div class="flex flex-wrap items-start justify-between gap-2">
						<div class="min-w-0 space-y-1">
							<h2 class="text-sm font-bold text-text">{r.title}</h2>
							<p class="text-xs text-text-muted">
								{r.format} · {i18n.t('leadership.participants', { n: r.participants_count })}
								· {fmtDate(r.held_on)}
							</p>
						</div>
						<!-- A retrospective whose insights never went back to the room is
						     a private note. Said, because the endpoint tracks it. -->
						{#if r.shared_with_participants_at}
							<Badge size="sm" variant="success">{i18n.t('leadership.shared')}</Badge>
						{:else}
							<Badge size="sm" variant="warning">{i18n.t('leadership.notShared')}</Badge>
						{/if}
					</div>

					<p class="mt-2 text-sm text-text-muted">{r.insights_md}</p>

					<Button
						size="sm"
						variant="ghost"
						class="mt-3"
						onclick={() => openActions(r.id)}
						data-testid="open-actions"
					>
						{openId === r.id ? i18n.t('leadership.hideActions') : i18n.t('leadership.showActions')}
					</Button>

					{#if openId === r.id}
						<div class="mt-3 space-y-3 border-t border-border pt-3">
							{#if actionsLoading}
								<Skeleton class="h-16 w-full" rounded="lg" />
							{:else if actions.length === 0}
								<!-- The thing worth saying out loud on this domain: without
								     actions, it was a meeting. -->
								<p class="text-sm text-text-muted">{i18n.t('leadership.noActions')}</p>
							{:else}
								<ul class="space-y-2">
									{#each actions as a (a.id)}
										{@const open = actionIsOpen(a)}
										{@const late = actionIsLate(a)}
										<li class="flex flex-wrap items-center gap-2 text-sm">
											<span class="min-w-0 flex-1 text-text">{a.description}</span>

											{#if a.done_at}
												<Badge size="sm" variant="success">{i18n.t('leadership.done')}</Badge>
											{:else if a.abandoned_reason}
												<!-- Shown with its reason rather than hidden. An
												     action dropped because the problem went away is a
												     good retrospective, and hiding it would push
												     people to fake completion. -->
												<span class="text-xs text-text-muted">
													{i18n.t('leadership.abandonedBecause', {
														reason: a.abandoned_reason
													})}
												</span>
											{:else if late}
												<Badge size="sm" variant="warning">{i18n.t('leadership.late')}</Badge>
											{/if}

											{#if a.owner_label}
												<span class="text-xs text-text-muted">{a.owner_label}</span>
											{/if}

											{#if open}
												<Button
													size="sm"
													variant="ghost"
													loading={busy[a.id]}
													onclick={() => resolve(a.id, r.id)}
												>
													{i18n.t('leadership.markDoneCta')}
												</Button>
											{/if}
										</li>
									{/each}
								</ul>
							{/if}

							<div class="flex flex-wrap items-end gap-2">
								<div class="min-w-0 flex-1">
									<Input
										placeholder={i18n.t('leadership.newActionPlaceholder')}
										bind:value={newAction}
										data-testid="new-action"
									/>
								</div>
								<Button
									size="sm"
									loading={busy[r.id]}
									disabled={!newAction.trim()}
									onclick={() => addAction(r.id)}
								>
									{i18n.t('leadership.addActionCta')}
								</Button>
							</div>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}

	<!-- Where the rest of this domain is addressed from. -->
	<p class="text-xs text-text-muted">{i18n.t('leadership.whereTheRestIs')}</p>
</div>
