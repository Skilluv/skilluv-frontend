<script lang="ts">
	import { onMount } from 'svelte';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import { guildApi, type Guild } from '$api/guild';
	import { toast } from '$stores/toast.svelte';
	import { SkilluError } from '$api/client';

	let guilds = $state<Guild[]>([]);
	let loading = $state(true);

	async function load() {
		loading = true;
		try {
			const res = await guildApi.leaderboard({ per_page: 50 });
			guilds = res.data.guilds;
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			loading = false;
		}
	}

	onMount(() => void load());
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Guildes — Skilluv' : 'Guilds — Skilluv'}</title>
</svelte:head>

<!-- Hero -->
<section class="relative overflow-hidden border-b border-border">
	<div
		aria-hidden="true"
		class="pointer-events-none absolute inset-x-0 -top-20 h-[100vh] opacity-[0.04]"
		style="background-image: linear-gradient(var(--sk-text) 1px, transparent 1px), linear-gradient(90deg, var(--sk-text) 1px, transparent 1px); background-size: 60px 60px; mask-image: linear-gradient(to bottom, black 70%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, black 70%, transparent 100%);"
	></div>
	<div class="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
		<p class="mb-4 text-xs font-bold uppercase tracking-widest text-accent">Community</p>
		<h1 class="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black leading-[1.05] tracking-tight">
			{#if i18n.locale === 'fr'}
				Formez<br />
				<span class="text-primary">votre guilde.</span>
			{:else}
				Form<br />
				<span class="text-primary">your guild.</span>
			{/if}
		</h1>
		<p class="mt-8 max-w-2xl text-lg text-text-muted">
			{i18n.locale === 'fr'
				? "Rejoignez une guilde pour combattre, apprendre, cultiver. Guildes MMO au style écurie F1 : bannière, tag, chef, wars. Classement live sur la somme des fragments."
				: 'Join a guild to fight, learn, cultivate. MMO-style guilds F1-team-inspired: banner, tag, leader, wars. Live ranking on total fragments.'}
		</p>
		{#if auth.isAuthenticated}
			<div class="mt-8 flex flex-wrap gap-3">
				<Button variant="accent" size="lg" href="/guilds/new">
					{i18n.locale === 'fr' ? '+ Créer une guilde' : '+ Create a guild'}
				</Button>
			</div>
		{/if}
	</div>
</section>

<!-- Leaderboard -->
<section class="mx-auto max-w-6xl px-4 py-14">
	<div class="mb-8 flex items-end justify-between">
		<div>
			<p class="mb-1 text-xs font-bold uppercase tracking-widest text-accent">Live</p>
			<h2 class="text-3xl sm:text-4xl font-black tracking-tight">
				{i18n.locale === 'fr' ? 'Classement.' : 'Ranking.'}
			</h2>
		</div>
	</div>

	{#if loading}
		<div class="space-y-2">
			{#each Array(8) as _}
				<div class="animate-pulse rounded-2xl border border-border bg-surface-elevated h-20"></div>
			{/each}
		</div>
	{:else if guilds.length === 0}
		<div class="rounded-2xl border border-border bg-surface-elevated p-10 text-center">
			<div class="mb-3 text-4xl text-text-muted">⬢</div>
			<p class="mb-4 text-text-muted">
				{i18n.locale === 'fr' ? 'Aucune guilde pour l\'instant. Sois le·la premier·e !' : 'No guild yet. Be the first!'}
			</p>
			{#if auth.isAuthenticated}
				<Button variant="accent" href="/guilds/new">
					{i18n.locale === 'fr' ? 'Créer une guilde' : 'Create a guild'}
				</Button>
			{/if}
		</div>
	{:else}
		<div class="space-y-2">
			{#each guilds as g, i}
				<a
					href={`/guilds/${g.slug}`}
					class="flex items-center gap-4 rounded-2xl border border-border bg-surface-elevated p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
				>
					<!-- Rank -->
					<div class="w-12 text-center shrink-0">
						<div class="text-3xl font-black tracking-tight {i === 0 ? 'text-warning' : i === 1 ? 'text-text-muted' : i === 2 ? 'text-accent' : 'text-text-muted'}">
							{i + 1}
						</div>
					</div>

					<!-- Logo -->
					<div
						class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border text-2xl font-black"
						style={`border-color: ${g.color_hex ?? 'var(--sk-primary)'}; color: ${g.color_hex ?? 'var(--sk-primary)'}`}
					>
						{g.tag}
					</div>

					<!-- Info -->
					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-2">
							<h3 class="text-lg font-bold truncate">{g.name}</h3>
							{#if g.total_wars_won > 0}
								<Badge variant="warning" size="sm">▲ {g.total_wars_won}W</Badge>
							{/if}
						</div>
						<p class="mt-0.5 line-clamp-1 text-sm text-text-muted">
							{g.description ?? (i18n.locale === 'fr' ? 'Aucune description' : 'No description')}
						</p>
					</div>

					<!-- Stats -->
					<div class="hidden sm:block text-right shrink-0">
						<div class="text-2xl font-black text-primary">{g.total_fragments.toLocaleString()}</div>
						<div class="text-xs text-text-muted">
							{g.member_count} {i18n.locale === 'fr' ? 'membres' : 'members'}
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</section>
