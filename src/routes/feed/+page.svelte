<script lang="ts">
	import { onMount } from 'svelte';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import { goto } from '$app/navigation';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import { feedApi, type FeedEvent } from '$api/feed';
	import { toast } from '$stores/toast.svelte';
	import { SkilluError } from '$api/client';
	import type { Component } from 'svelte';
	import {
		Target,
		TrendingUp,
		Award,
		Pencil,
		Shield,
		Trophy,
		MessageSquare,
		UserPlus,
		Dot
	} from '@lucide/svelte';

	let events = $state<FeedEvent[]>([]);
	let loading = $state(true);

	async function load() {
		loading = true;
		try {
			const res = await feedApi.me({ per_page: 50 });
			events = res.data.events;
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			loading = false;
		}
	}

	function fmtRelative(iso: string): string {
		const d = new Date(iso);
		const diff = Math.floor((Date.now() - d.getTime()) / 1000);
		if (diff < 60) return i18n.locale === 'fr' ? "à l'instant" : 'just now';
		if (diff < 3600) return `${Math.floor(diff / 60)}m`;
		if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
		if (diff < 604800) return `${Math.floor(diff / 86400)}j`;
		return new Intl.DateTimeFormat(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'short' }).format(d);
	}

	function iconForKind(k: string): Component {
		switch (k) {
			case 'submission_evaluated': return Target;
			case 'level_up': return TrendingUp;
			case 'badge_earned': return Award;
			case 'challenge_created': return Pencil;
			case 'guild_joined': return Shield;
			case 'guild_war_won': return Shield;
			case 'forum_post_created': return MessageSquare;
			case 'tournament_registered': return Trophy;
			case 'follow_started': return UserPlus;
			default: return Dot;
		}
	}

	function labelForKind(k: string): string {
		const labels: Record<string, { fr: string; en: string }> = {
			submission_evaluated: { fr: 'Soumission évaluée', en: 'Submission evaluated' },
			level_up: { fr: 'Niveau supérieur', en: 'Level up' },
			badge_earned: { fr: 'Badge obtenu', en: 'Badge earned' },
			challenge_created: { fr: 'Challenge créé', en: 'Challenge created' },
			guild_joined: { fr: 'A rejoint une guilde', en: 'Joined a guild' },
			guild_war_won: { fr: 'Guild war remportée', en: 'Guild war won' },
			forum_post_created: { fr: 'Nouveau post forum', en: 'New forum post' },
			tournament_registered: { fr: 'Inscrit tournoi', en: 'Tournament registered' },
			follow_started: { fr: 'Nouveau follower', en: 'New follower' }
		};
		return labels[k]?.[i18n.locale as 'fr' | 'en'] ?? k;
	}

	function targetLink(e: FeedEvent): string | null {
		if (!e.target_type || !e.target_id) return null;
		switch (e.target_type) {
			case 'challenge': return `/challenges/${e.target_id}`;
			case 'submission': return `/challenges/${e.target_id}`;
			case 'guild': return `/guilds/${e.target_id}`;
			case 'forum_post': return `/forum/${e.target_id}`;
			case 'tournament': return `/tournaments/${e.target_id}`;
			case 'user': return `/profile/${e.actor_username}`;
			default: return null;
		}
	}

	onMount(() => {
		if (!auth.isAuthenticated) {
			goto('/auth/login?redirect=/feed');
			return;
		}
		void load();
	});
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Fil d\'activité — Skilluv' : 'Activity feed — Skilluv'}</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-10 sm:py-14">
	<div class="mb-10">
		<p class="mb-2 text-xs font-bold uppercase tracking-widest text-accent">Activity</p>
		<h1 class="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight">
			{i18n.locale === 'fr' ? 'Ton fil.' : 'Your feed.'}
		</h1>
		<p class="mt-3 max-w-xl text-sm text-text-muted">
			{i18n.locale === 'fr'
				? 'Ce que tu suis, ce que tes guildes font, ce qui bouge dans ton domaine.'
				: 'What you follow, what your guilds do, what moves in your domain.'}
		</p>
	</div>

	{#if loading}
		<div class="space-y-2">
			{#each Array(8) as _}
				<div class="animate-pulse rounded-xl border border-border bg-surface-elevated h-16"></div>
			{/each}
		</div>
	{:else if events.length === 0}
		<EmptyState
			variant="scroll"
			title={i18n.locale === 'fr' ? 'Tout est calme ce matin.' : 'All quiet this morning.'}
			body={i18n.locale === 'fr'
				? 'Suis des skilluvers ou rejoins une guilde pour voir de la vie ici.'
				: 'Follow skilluvers or join a guild to see life happen here.'}
		>
			{#snippet action()}
				<div class="flex justify-center gap-2">
					<Button variant="accent" href="/challenges">
						{i18n.locale === 'fr' ? 'Explorer' : 'Explore'}
					</Button>
					<Button variant="ghost" href="/guilds">
						{i18n.locale === 'fr' ? 'Guildes' : 'Guilds'}
					</Button>
				</div>
			{/snippet}
		</EmptyState>
	{:else}
		<div class="space-y-2">
			{#each events as ev}
				{@const href = targetLink(ev)}
				{@const KindIcon = iconForKind(ev.kind)}
				<svelte:element
					this={href ? 'a' : 'div'}
					{...href ? { href } : {}}
					class="block rounded-2xl border border-border bg-surface-elevated p-4 {href ? 'hover:border-primary/40 hover:bg-surface-overlay transition-colors' : ''}"
				>
					<div class="flex items-start gap-3">
						<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
							<KindIcon size={18} strokeWidth={2} />
						</div>
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2 flex-wrap">
								<Badge variant="default" size="sm">{labelForKind(ev.kind)}</Badge>
								<span class="text-xs text-text-muted">{fmtRelative(ev.created_at)}</span>
							</div>
							{#if ev.title}
								<p class="mt-1 font-medium truncate">{ev.title}</p>
							{/if}
							{#if ev.body}
								<p class="mt-1 line-clamp-2 text-sm text-text-muted">{ev.body}</p>
							{/if}
							{#if ev.actor_username}
								<p class="mt-1 text-xs text-text-muted">
									{i18n.locale === 'fr' ? 'par' : 'by'} @{ev.actor_username}
								</p>
							{/if}
						</div>
					</div>
				</svelte:element>
			{/each}
		</div>
	{/if}
</div>
