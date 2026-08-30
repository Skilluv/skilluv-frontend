<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { badgeEventsApi } from '$lib/api/badge_events';
	import { SkilluError } from '$lib/api/client';
	import { i18n } from '$lib/i18n';
	import { auth } from '$lib/stores/auth.svelte';
	import type { MyEventRow, SkilluvEvent } from '$lib/api/badge_events';
	import { EventCard } from '$lib/components/events';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';

	let events = $state<SkilluvEvent[]>([]);
	let myEvents = $state<MyEventRow[]>([]);
	let loading = $state(true);
	let error = $state('');

	onMount(async () => {
		try {
			const [listRes, myRes] = await Promise.allSettled([
				badgeEventsApi.list(),
				auth.isAuthenticated ? badgeEventsApi.myEvents() : Promise.resolve(null)
			]);
			if (listRes.status === 'fulfilled') events = listRes.value.data?.events ?? [];
			else if (listRes.reason instanceof SkilluError) error = listRes.reason.message;
			else error = i18n.t('events.loadError');
			if (myRes.status === 'fulfilled' && myRes.value) myEvents = myRes.value.data?.events ?? [];
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
			{#each Array(6) as _, i (i)}
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
					<!-- A joined row carries a slug and a name, not the whole event
					     — ten events do not need ten visual themes. So the card is
					     taken from the list where it is there, and the row prints
					     its own name where it is not. -->
					{#each myEvents as m (m.event_slug)}
						{@const full = events.find((e) => e.slug === m.event_slug)}
						<li class="relative">
							{#if full}
								<EventCard event={full} />
							{:else}
								<a
									href={resolve(`/events/${m.event_slug}`)}
									class="block rounded-2xl border border-border bg-surface-elevated p-5 hover:border-accent"
								>
									<p class="font-semibold text-text-primary">{m.event_name}</p>
									<p class="mt-1 text-xs text-text-muted">{m.role}</p>
								</a>
							{/if}
							<!-- The old client claimed a `stamp_earned` boolean that no
							     endpoint has ever served. The row carries
							     `contribution_ref` — the PR or repo counted for this
							     event — which is a different claim: something was
							     counted, not that a stamp was issued. `badge_engine`
							     emits the stamp and does not say so here, so this shows
							     what it knows rather than dressing one fact as another
							     (SKI-352). -->
							{#if m.contribution_ref}
								<span class="absolute right-3 top-3">
									<Badge variant="default" size="sm">{i18n.t('events.counted')}</Badge>
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
