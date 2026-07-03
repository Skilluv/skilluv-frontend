<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import { guildApi, type Guild, type GuildMember } from '$api/guild';
	import { toast } from '$stores/toast.svelte';
	import { SkilluError } from '$api/client';

	let slug = $derived(page.params.slug ?? '');
	let guild = $state<Guild | null>(null);
	let members = $state<GuildMember[]>([]);
	let loading = $state(true);
	let applying = $state(false);

	async function load() {
		loading = true;
		try {
			const gRes = await guildApi.getBySlug(slug);
			guild = gRes.data;
			const mRes = await guildApi.members(guild.id).catch(() => null);
			if (mRes) members = mRes.data.members;
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			loading = false;
		}
	}

	async function apply() {
		if (!guild) return;
		applying = true;
		try {
			await guildApi.apply(guild.id, undefined);
			toast.success(i18n.locale === 'fr' ? 'Candidature envoyée' : 'Application sent');
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			applying = false;
		}
	}

	let winRate = $derived.by(() => {
		if (!guild) return 0;
		const total = guild.total_wars_won + guild.total_wars_lost;
		return total > 0 ? Math.round((guild.total_wars_won / total) * 100) : 0;
	});

	onMount(() => void load());
</script>

<svelte:head>
	<title>{guild?.name ?? 'Guild'} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-10 sm:py-14">
	<nav class="mb-6 flex items-center gap-2 text-sm text-text-muted">
		<a href="/guilds" class="hover:text-text-primary">Guilds</a>
		<span>›</span>
		<span class="text-text-primary">{guild?.name ?? '...'}</span>
	</nav>

	{#if loading}
		<div class="animate-pulse space-y-4">
			<div class="h-40 rounded bg-surface-elevated"></div>
			<div class="h-64 rounded bg-surface-elevated"></div>
		</div>
	{:else if guild}
		<!-- Header -->
		<header class="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start">
			<div
				class="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-4 text-3xl font-black"
				style={`border-color: ${guild.color_hex ?? 'var(--sk-primary)'}; color: ${guild.color_hex ?? 'var(--sk-primary)'}`}
			>
				{guild.tag}
			</div>
			<div class="min-w-0 flex-1">
				<h1 class="text-4xl sm:text-5xl font-black tracking-tight">{guild.name}</h1>
				<p class="mt-2 text-sm text-text-muted">
					{guild.description ?? (i18n.locale === 'fr' ? 'Aucune description' : 'No description')}
				</p>
				{#if auth.isAuthenticated}
					<div class="mt-4">
						<Button variant="accent" loading={applying} onclick={apply}>
							{i18n.locale === 'fr' ? 'Postuler pour rejoindre' : 'Apply to join'}
						</Button>
					</div>
				{/if}
			</div>
		</header>

		<!-- Stats grid -->
		<div class="mb-10 grid gap-3 grid-cols-2 sm:grid-cols-4">
			<div class="rounded-2xl border border-border bg-surface-elevated p-5">
				<p class="text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.locale === 'fr' ? 'Membres' : 'Members'}
				</p>
				<p class="mt-1 text-3xl font-black">{guild.member_count}</p>
			</div>
			<div class="rounded-2xl border border-border bg-surface-elevated p-5">
				<p class="text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.locale === 'fr' ? 'Fragments' : 'Fragments'}
				</p>
				<p class="mt-1 text-3xl font-black text-primary">{guild.total_fragments.toLocaleString()}</p>
			</div>
			<div class="rounded-2xl border border-border bg-surface-elevated p-5">
				<p class="text-xs font-bold uppercase tracking-wider text-text-muted">
					▲ {i18n.locale === 'fr' ? 'Wars' : 'Wars'}
				</p>
				<p class="mt-1 text-2xl font-black">
					<span class="text-success">{guild.total_wars_won}W</span>
					<span class="text-text-muted text-lg">/</span>
					<span class="text-error">{guild.total_wars_lost}L</span>
				</p>
			</div>
			<div class="rounded-2xl border border-border bg-surface-elevated p-5">
				<p class="text-xs font-bold uppercase tracking-wider text-text-muted">Win rate</p>
				<p class="mt-1 text-3xl font-black text-accent">{winRate}%</p>
			</div>
		</div>

		<!-- Members list -->
		<section>
			<h2 class="mb-4 text-xs font-bold uppercase tracking-wider text-accent">
				{i18n.locale === 'fr' ? 'Membres' : 'Members'}
			</h2>
			<div class="divide-y divide-border rounded-2xl border border-border bg-surface-elevated overflow-hidden">
				{#each members as m}
					<a
						href={`/profile/${m.username}`}
						class="flex items-center gap-3 p-4 hover:bg-surface-overlay transition-colors"
					>
						<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-lg font-black text-primary shrink-0">
							{m.display_name.charAt(0)}
						</div>
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2">
								<span class="font-semibold truncate">{m.display_name}</span>
								{#if m.role === 'owner'}
									<Badge variant="warning" size="sm">★ Owner</Badge>
								{:else if m.role === 'officer'}
									<Badge variant="accent" size="sm">★ Officer</Badge>
								{/if}
							</div>
							<div class="font-mono text-xs text-text-muted">@{m.username}</div>
						</div>
						<div class="text-right shrink-0">
							<div class="text-sm font-black text-primary">{m.total_fragments.toLocaleString()}</div>
							<div class="text-xs text-text-muted">fragments</div>
						</div>
					</a>
				{/each}
			</div>
		</section>
	{/if}
</div>
