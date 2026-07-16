<script lang="ts">
	import { page } from '$app/stores';
	import { badgeEventsApi } from '$lib/api/badge_events';
	import { SkilluError } from '$lib/api/client';
	import { i18n } from '$lib/i18n';
	import { auth } from '$lib/stores/auth.svelte';
	import type { BadgeEvent } from '$lib/types';
	import Button from '$lib/components/ui/Button.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { ChevronLeft, Calendar } from '@lucide/svelte';

	let slug = $derived($page.params.slug ?? '');

	let event = $state<BadgeEvent | null>(null);
	let joined = $state(false);
	let loading = $state(true);
	let joining = $state(false);
	let error = $state('');

	$effect(() => {
		if (slug) void load(slug);
	});

	async function load(s: string) {
		loading = true;
		error = '';
		try {
			const [detailRes, myRes] = await Promise.allSettled([
				badgeEventsApi.detail(s),
				auth.isAuthenticated ? badgeEventsApi.myEvents() : Promise.resolve(null)
			]);
			if (detailRes.status === 'fulfilled') event = detailRes.value.data;
			else if (detailRes.reason instanceof SkilluError && detailRes.reason.code === 'RESOURCE_NOT_FOUND') {
				error = i18n.t('errors.notFoundMessage');
			} else {
				error = i18n.t('events.loadError');
			}
			if (myRes.status === 'fulfilled' && myRes.value) {
				joined = myRes.value.data.some((m) => m.event.slug === s);
			}
		} finally {
			loading = false;
		}
	}

	async function joinEvent() {
		if (!event) return;
		joining = true;
		try {
			await badgeEventsApi.join(event.slug);
			joined = true;
			toast.success(i18n.t('events.alreadyJoined'));
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			joining = false;
		}
	}

	let status = $derived.by<'active' | 'upcoming' | 'ended'>(() => {
		if (!event) return 'upcoming';
		const now = Date.now();
		const starts = new Date(event.starts_at).getTime();
		const ends = event.ends_at ? new Date(event.ends_at).getTime() : Infinity;
		if (starts > now) return 'upcoming';
		if (ends < now) return 'ended';
		return 'active';
	});

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>{event?.name ?? i18n.t('events.title')} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-10">
	<a
		href="/events"
		class="mb-6 inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text-primary"
	>
		<ChevronLeft size={16} strokeWidth={2} />
		{i18n.t('events.backToList')}
	</a>

	{#if loading}
		<Skeleton class="mb-4 h-10 w-2/3" />
		<Skeleton class="h-40 w-full" rounded="xl" />
	{:else if error}
		<div class="rounded-2xl border border-error/40 bg-error/5 p-6 text-center" role="alert">
			<p class="text-sm text-error">{error}</p>
		</div>
	{:else if event}
		<article>
			<header class="mb-6 flex items-center gap-2 flex-wrap">
				<Badge variant={status === 'active' ? 'accent' : status === 'upcoming' ? 'primary' : 'default'} size="sm">
					{i18n.t(`events.${status}`)}
				</Badge>
				{#if event.is_partner}
					<Badge variant="primary" size="sm">{i18n.t('events.partner')}</Badge>
				{/if}
			</header>

			<h1 class="mb-4 text-4xl font-bold text-text-primary">{event.name}</h1>
			<p class="mb-6 text-lg text-text-muted">{event.description}</p>

			<dl class="mb-8 grid gap-3 rounded-2xl border border-border bg-surface-elevated p-5 sm:grid-cols-2">
				<div>
					<dt class="mb-1 flex items-center gap-1.5 text-xs uppercase tracking-wide text-text-muted">
						<Calendar size={12} strokeWidth={2} aria-hidden="true" />
						{i18n.t('events.startsOn', { date: '' }).replace(/\{date\}\s*$/, '').trim() || 'Starts'}
					</dt>
					<dd class="font-medium text-text-primary">{fmtDate(event.starts_at)}</dd>
				</div>
				{#if event.ends_at}
					<div>
						<dt class="mb-1 flex items-center gap-1.5 text-xs uppercase tracking-wide text-text-muted">
							<Calendar size={12} strokeWidth={2} aria-hidden="true" />
							{i18n.t('events.endsOn', { date: '' }).replace(/\{date\}\s*$/, '').trim() || 'Ends'}
						</dt>
						<dd class="font-medium text-text-primary">{fmtDate(event.ends_at)}</dd>
					</div>
				{/if}
			</dl>

			<div class="flex justify-end">
				{#if joined}
					<Button variant="secondary" disabled>{i18n.t('events.joinedCta')}</Button>
				{:else if status === 'ended'}
					<Button variant="ghost" disabled>{i18n.t('events.ended')}</Button>
				{:else}
					<Button variant="primary" onclick={joinEvent} loading={joining} disabled={!auth.isAuthenticated}>
						{i18n.t('events.joinCta')}
					</Button>
				{/if}
			</div>
		</article>
	{/if}
</div>
