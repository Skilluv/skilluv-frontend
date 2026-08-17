<script lang="ts">
	/**
	 * Chronological profile history (SKI-39).
	 *
	 * The event catalogue is an allowlist server-side and grows without a
	 * frontend release, so an unknown `event_type` renders under a neutral
	 * label rather than disappearing. Same for metadata: each known event
	 * contributes one detail line, anything else shows the label alone.
	 */
	import { onMount } from 'svelte';
	import {
		Award,
		CalendarCheck,
		Coins,
		Compass,
		FileCheck2,
		KeyRound,
		Sparkles,
		Trophy,
		UserPlus
	} from '@lucide/svelte';
	import type { Component } from 'svelte';
	import { timelineApi } from '$lib/api/timeline';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import type { TimelineEvent } from '$types';

	interface Props {
		userId: string;
		/** Drives the empty-state copy: your own blank timeline reads differently. */
		isOwn?: boolean;
		/** How many events to pull per page. */
		pageSize?: number;
	}

	let { userId, isOwn = false, pageSize = 25 }: Props = $props();

	const eventIcon: Record<string, Component> = {
		signup: UserPlus,
		orientation_added: Compass,
		deliverable_verified: FileCheck2,
		rank_promoted: Trophy,
		capability_granted: KeyRound,
		attestation_received: Award,
		event_participation: Sparkles,
		first_bounty_earned: Coins,
		first_mentor_session: CalendarCheck
	};

	let events = $state<TimelineEvent[]>([]);
	let total = $state(0);
	let loading = $state(true);
	let loadingMore = $state(false);
	let loadError = $state('');

	let exhausted = $derived(events.length >= total);

	async function load(offset: number) {
		const res = await timelineApi.forUser(userId, { limit: pageSize, offset });
		total = res.data?.total ?? 0;
		return res.data?.events ?? [];
	}

	async function loadMore() {
		loadingMore = true;
		try {
			events = [...events, ...(await load(events.length))];
		} catch {
			// The already-rendered page stays; the button can be pressed again.
		} finally {
			loadingMore = false;
		}
	}

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}

	function label(e: TimelineEvent): string {
		const key = `timeline.events.${e.event_type}`;
		const translated = i18n.t(key);
		return translated === key ? i18n.t('timeline.eventFallback') : translated;
	}

	/** One line of context, drawn from the metadata each event carries. */
	function detail(e: TimelineEvent): string {
		const m = e.metadata ?? {};
		const str = (k: string): string | undefined => {
			const v = m[k];
			return typeof v === 'string' && v.length > 0 ? v : undefined;
		};
		switch (e.event_type) {
			case 'orientation_added':
				return str('orientation_slug') ?? '';
			case 'deliverable_verified':
				return str('artifact_type') ?? '';
			case 'rank_promoted': {
				const to = str('to_rank');
				return to ? i18n.t(`common.titles.${to}`) : '';
			}
			case 'capability_granted': {
				const cap = str('capability');
				if (!cap) return '';
				const key = `capabilities.items.${cap}.label`;
				const translated = i18n.t(key);
				return translated === key ? cap : translated;
			}
			case 'attestation_received':
				return str('title') ?? str('attestation_type') ?? '';
			case 'event_participation':
				return str('event_title') ?? '';
			default:
				return '';
		}
	}

	onMount(async () => {
		try {
			events = await load(0);
		} catch (err) {
			loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	});
</script>

<section data-testid="profile-timeline" aria-label={i18n.t('timeline.title')}>
	{#if loading}
		<div class="space-y-3">
			{#each Array(3) as _, i (i)}
				<Skeleton class="h-14 w-full" rounded="lg" />
			{/each}
		</div>
	{:else if loadError}
		<p class="text-sm text-error" role="alert">{loadError}</p>
	{:else if events.length === 0}
		<EmptyState
			variant="scroll"
			size="sm"
			align="left"
			title={i18n.t('timeline.emptyTitle')}
			body={isOwn ? i18n.t('timeline.ownEmptyBody') : i18n.t('timeline.emptyBody')}
		/>
	{:else}
		<ol class="relative space-y-5 border-l border-border pl-6" role="list">
			{#each events as event (event.id)}
				{@const Icon = eventIcon[event.event_type]}
				{@const line = detail(event)}
				<li class="relative">
					<span
						class="absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full border border-border bg-surface-elevated text-text-muted"
						aria-hidden="true"
					>
						{#if Icon}
							<Icon size={11} strokeWidth={2} />
						{/if}
					</span>
					<p class="text-xs text-text-muted">{fmtDate(event.event_at)}</p>
					<p class="mt-0.5 text-sm font-semibold text-text-primary">{label(event)}</p>
					{#if line}
						<p class="mt-0.5 text-sm text-text-muted">{line}</p>
					{/if}
				</li>
			{/each}
		</ol>

		<div class="mt-5 flex flex-wrap items-center justify-between gap-3">
			<span class="text-xs text-text-muted">{i18n.t('timeline.totalLabel', { n: total })}</span>
			{#if !exhausted}
				<Button variant="ghost" size="sm" loading={loadingMore} onclick={loadMore}>
					{i18n.t('timeline.loadMore')}
				</Button>
			{/if}
		</div>
	{/if}
</section>
