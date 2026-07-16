<script lang="ts">
	import { onMount } from 'svelte';
	import { badgeEventsApi } from '$lib/api/badge_events';
	import { SkilluError } from '$lib/api/client';
	import { i18n } from '$lib/i18n';
	import { auth } from '$lib/stores/auth.svelte';
	import type { BadgeEvent, UserBadgeEvent } from '$lib/types';
	import { EventCard } from '$lib/components/events';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';

	let events = $state<BadgeEvent[]>([]);
	let myEvents = $state<UserBadgeEvent[]>([]);
	let loading = $state(true);
	let error = $state('');

	onMount(async () => {
		try {
			const [listRes, myRes] = await Promise.allSettled([
				badgeEventsApi.list(),
				auth.isAuthenticated ? badgeEventsApi.myEvents() : Promise.resolve(null)
			]);
			if (listRes.status === 'fulfilled') events = listRes.value.data;
			else if (listRes.reason instanceof SkilluError) error = listRes.reason.message;
			else error = i18n.t('events.loadError');
			if (myRes.status === 'fulfilled' && myRes.value) myEvents = myRes.value.data;
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>{i18n.t('events.title')} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-8">
	<header class="mb-8">
		<h1 class="text-3xl font-bold text-text-primary">{i18n.t('events.title')}</h1>
		<p class="mt-2 max-w-3xl text-text-muted">{i18n.t('events.subtitle')}</p>
	</header>

	{#if loading}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each Array(6) as _}
				<Skeleton class="h-48 w-full" rounded="xl" />
			{/each}
		</div>
	{:else if error}
		<div class="rounded-2xl border border-error/40 bg-error/5 p-6 text-center" role="alert">
			<p class="text-sm text-error">{error}</p>
		</div>
	{:else}
		{#if myEvents.length > 0}
			<section class="mb-10" aria-labelledby="my-events-title">
				<h2 id="my-events-title" class="mb-4 text-xl font-bold text-text-primary">
					{i18n.t('events.myEventsTitle')}
				</h2>
				<ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
					{#each myEvents as m (m.event.slug)}
						<li class="relative">
							<EventCard event={m.event} />
							{#if m.stamp_earned}
								<span class="absolute right-3 top-3">
									<Badge variant="success" size="sm">{i18n.t('events.stampEarned')}</Badge>
								</span>
							{/if}
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if events.length === 0}
			<EmptyState variant="scroll" title={i18n.t('events.empty')} />
		{:else}
			<ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
				{#each events as event (event.slug)}
					<li>
						<EventCard {event} />
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</div>
