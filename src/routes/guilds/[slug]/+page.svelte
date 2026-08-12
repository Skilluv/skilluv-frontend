<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import { guildApi, type Guild, type GuildMember, type GuildWar } from '$api/guild';
	import { toast } from '$stores/toast.svelte';
	import { SkilluError } from '$api/client';

	let slug = $derived(page.params.slug ?? '');
	let guild = $state<Guild | null>(null);
	// `total_fragments.toLocaleString()` on an absent counter threw and wiped the
	// whole page body, leaving only the breadcrumb. Every aggregate below is now
	// defaulted because the detail endpoint does not return them.
	let guildColor = $derived(guild?.color_hex ?? guild?.color_primary ?? 'var(--sk-primary)');
	let members = $state<GuildMember[]>([]);
	let wars = $state<GuildWar[]>([]);

	type Tab = 'composition' | 'wars' | 'members';
	let tab = $state<Tab>('composition');

	// Composition is derived from the member list: the backend has no dedicated
	// endpoint for it, and roles are already part of the members payload.
	let composition = $derived.by(() => {
		const counts: Record<GuildMember['role'], number> = { owner: 0, officer: 0, member: 0 };
		for (const m of members) counts[m.role] += 1;
		return counts;
	});

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	let loading = $state(true);
	let applying = $state(false);

	async function load() {
		loading = true;
		try {
			const gRes = await guildApi.getBySlug(slug);
			guild = gRes.data.guild;
			const mRes = await guildApi.members(guild.id).catch(() => null);
			if (mRes) members = Array.isArray(mRes.data?.members) ? mRes.data.members : [];
			// Wars live under /guild-wars, not /guilds/{id}/wars. Optional signal:
			// a failure here must not hide the guild.
			const wRes = await guildApi.listWars().catch(() => null);
			if (wRes) wars = Array.isArray(wRes.data?.wars) ? wRes.data.wars : [];
		} catch (e) {
			guild = null;
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
		const won = guild.total_wars_won ?? 0;
		const total = won + (guild.total_wars_lost ?? 0);
		return total > 0 ? Math.round((won / total) * 100) : 0;
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
		<div data-testid="guild-page" class="contents">
		<!-- Header -->
		<header class="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start">
			<div
				class="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-4 text-3xl font-black"
				style={`border-color: ${guildColor}; color: ${guildColor}`}
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
				<p class="mt-1 text-3xl font-black">{guild.member_count ?? 0}</p>
			</div>
			<div class="rounded-2xl border border-border bg-surface-elevated p-5">
				<p class="text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.locale === 'fr' ? 'Fragments' : 'Fragments'}
				</p>
				<p class="mt-1 text-3xl font-black text-primary">{(guild.total_fragments ?? 0).toLocaleString()}</p>
			</div>
			<div class="rounded-2xl border border-border bg-surface-elevated p-5">
				<p class="text-xs font-bold uppercase tracking-wider text-text-muted">
					▲ {i18n.locale === 'fr' ? 'Wars' : 'Wars'}
				</p>
				<p class="mt-1 text-2xl font-black">
					<span class="text-success">{guild.total_wars_won ?? 0}W</span>
					<span class="text-text-muted text-lg">/</span>
					<span class="text-error">{guild.total_wars_lost ?? 0}L</span>
				</p>
			</div>
			<div class="rounded-2xl border border-border bg-surface-elevated p-5">
				<p class="text-xs font-bold uppercase tracking-wider text-text-muted">Win rate</p>
				<p class="mt-1 text-3xl font-black text-accent">{winRate}%</p>
			</div>
		</div>

		<!-- Tabs: composition / wars / members -->
		<div class="mb-4 flex flex-wrap gap-2" role="tablist" aria-label={i18n.t('guilds.tabsLabel')}>
			{#each [{ id: 'composition', label: i18n.t('guilds.tabComposition') }, { id: 'wars', label: i18n.t('guilds.tabWars') }, { id: 'members', label: i18n.t('guilds.tabMembers') }] as t (t.id)}
				<button
					type="button"
					role="tab"
					id={`guild-tab-${t.id}`}
					data-testid={`guild-tab-${t.id}`}
					aria-selected={tab === t.id}
					aria-controls={`guild-panel-${t.id}`}
					onclick={() => (tab = t.id as Tab)}
					class="rounded-full border px-4 py-2 text-sm font-medium transition-colors {tab === t.id
						? 'border-accent bg-accent/10 text-accent'
						: 'border-border text-text-muted hover:text-text-primary'}"
				>
					{t.label}
				</button>
			{/each}
		</div>

		{#if tab === 'composition'}
			<div
				id="guild-panel-composition"
				role="tabpanel"
				aria-labelledby="guild-tab-composition"
				data-testid="composition-panel"
				class="grid grid-cols-1 gap-3 sm:grid-cols-3"
			>
				{#each [{ key: 'owner', label: i18n.t('guilds.roleOwner'), n: composition.owner }, { key: 'officer', label: i18n.t('guilds.roleOfficer'), n: composition.officer }, { key: 'member', label: i18n.t('guilds.roleMember'), n: composition.member }] as row (row.key)}
					<div class="rounded-2xl border border-border bg-surface-elevated p-5">
						<p class="text-xs font-bold uppercase tracking-wider text-text-muted">{row.label}</p>
						<p class="mt-1 text-3xl font-black text-text-primary">{row.n}</p>
					</div>
				{/each}
			</div>
		{:else if tab === 'wars'}
			<div
				id="guild-panel-wars"
				role="tabpanel"
				aria-labelledby="guild-tab-wars"
				data-testid="wars-panel"
			>
				{#if wars.length === 0}
					<div class="rounded-2xl border border-border bg-surface-elevated p-8 text-center text-sm text-text-muted">
						{i18n.t('guilds.warsEmpty')}
					</div>
				{:else}
					<ul class="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface-elevated" role="list">
						{#each wars as war (war.id)}
							<li class="flex flex-wrap items-center justify-between gap-3 p-4">
								<div class="min-w-0">
									<p class="truncate font-semibold text-text-primary">
										{war.challenger_name} <span class="text-text-muted">vs</span> {war.opponent_name}
									</p>
									{#if war.starts_at}
										<p class="text-xs text-text-muted">{fmtDate(war.starts_at)}</p>
									{/if}
								</div>
								<Badge variant={war.status === 'concluded' ? 'success' : 'accent'} size="sm">
									{i18n.t(`guilds.warStatus.${war.status}`)}
								</Badge>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{:else}
			<div
				id="guild-panel-members"
				role="tabpanel"
				aria-labelledby="guild-tab-members"
			>
				{#if members.length === 0}
					<div class="rounded-2xl border border-border bg-surface-elevated p-8 text-center text-sm text-text-muted">
						{i18n.t('guilds.membersEmpty')}
					</div>
				{:else}
					<div
						data-testid="members-list"
						class="divide-y divide-border rounded-2xl border border-border bg-surface-elevated overflow-hidden"
					>
						{#each members as m (m.user_id)}
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
											<Badge variant="warning" size="sm">{i18n.t('guilds.roleOwner')}</Badge>
										{:else if m.role === 'officer'}
											<Badge variant="accent" size="sm">{i18n.t('guilds.roleOfficer')}</Badge>
										{/if}
									</div>
									<div class="font-mono text-xs text-text-muted">@{m.username}</div>
								</div>
								<div class="text-right shrink-0">
									<div class="text-sm font-black text-primary">
										{(m.total_fragments ?? 0).toLocaleString()}
									</div>
									<div class="text-xs text-text-muted">{i18n.t('common.fragments')}</div>
								</div>
							</a>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
		</div>
	{:else}
		<!-- Unknown or unreachable slug. Without this branch the page rendered
		     nothing at all: no heading, no message, no way back. -->
		<div class="py-16 text-center" data-testid="guild-not-found">
			<h1 class="mb-3 text-2xl font-bold text-text-primary">{i18n.t('errors.notFound')}</h1>
			<p class="mb-6 text-text-muted">{i18n.t('errors.notFoundMessage')}</p>
			<Button variant="primary" href="/guilds">Guilds</Button>
		</div>
	{/if}
</div>
