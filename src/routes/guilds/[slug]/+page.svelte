<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import {
		guildApi,
		type Guild,
		type GuildMember,
		type GuildWar,
		type GuildApplication,
		type GuildInvitation
	} from '$api/guild';
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

	type Tab = 'composition' | 'wars' | 'members' | 'applications' | 'invitations';
	let tab = $state<Tab>('composition');

	// Applications and invitations are owner/officer-only: the backend returns
	// 403 for everyone else, so the tabs are hidden rather than shown broken.
	let applications = $state<GuildApplication[]>([]);
	let invitations = $state<GuildInvitation[]>([]);
	let deciding = $state<string | null>(null);
	let revoking = $state<string | null>(null);

	let myRole = $derived(members.find((m) => m.user_id === auth.user?.id)?.role ?? null);
	let canManage = $derived(myRole === 'owner' || myRole === 'officer');

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
			await loadManagement();
		} catch (e) {
			guild = null;
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			loading = false;
		}
	}

	/**
	 * Owner/officer-only lists. Both are optional signals: a 403 for a plain
	 * member must not take the guild page down with it.
	 */
	async function loadManagement() {
		if (!guild) return;
		const id = guild.id;
		const [aRes, iRes] = await Promise.all([
			guildApi.applications(id).catch(() => null),
			guildApi.invitations(id).catch(() => null)
		]);
		applications = Array.isArray(aRes?.data?.applications) ? aRes.data.applications : [];
		invitations = Array.isArray(iRes?.data?.invitations) ? iRes.data.invitations : [];
	}

	async function decide(applicationId: string, accept: boolean) {
		deciding = applicationId;
		try {
			await guildApi.decideApplication(applicationId, accept);
			toast.success(
				accept
					? i18n.t('guilds.manage.applicationAccepted')
					: i18n.t('guilds.manage.applicationRejected')
			);
			// A newly accepted member changes the roster too.
			const mRes = await guildApi.members(guild!.id).catch(() => null);
			if (mRes) members = Array.isArray(mRes.data?.members) ? mRes.data.members : [];
			await loadManagement();
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : i18n.t('errors.generic'));
		} finally {
			deciding = null;
		}
	}

	async function revokeInvitation(invitationId: string) {
		if (!guild) return;
		if (!confirm(i18n.t('guilds.manage.revokeConfirm'))) return;
		revoking = invitationId;
		try {
			await guildApi.revokeInvitation(guild.id, invitationId);
			toast.success(i18n.t('guilds.manage.invitationRevoked'));
			await loadManagement();
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : i18n.t('errors.generic'));
		} finally {
			revoking = null;
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
			{#each [{ id: 'composition', label: i18n.t('guilds.tabComposition') }, { id: 'wars', label: i18n.t('guilds.tabWars') }, { id: 'members', label: i18n.t('guilds.tabMembers') }, ...(canManage ? [{ id: 'applications', label: i18n.t('guilds.tabApplications') }, { id: 'invitations', label: i18n.t('guilds.tabInvitations') }] : [])] as t (t.id)}
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
		{:else if tab === 'applications'}
			<div
				id="guild-panel-applications"
				role="tabpanel"
				aria-labelledby="guild-tab-applications"
				data-testid="applications-panel"
			>
				{#if applications.length === 0}
					<div class="rounded-2xl border border-border bg-surface-elevated p-8 text-center text-sm text-text-muted">
						{i18n.t('guilds.manage.applicationsEmpty')}
					</div>
				{:else}
					<ul class="divide-y divide-border rounded-2xl border border-border bg-surface-elevated overflow-hidden">
						{#each applications as a (a.id)}
							<li class="flex flex-wrap items-center gap-3 p-4" data-testid="application-row">
								<div class="min-w-0 flex-1">
									<p class="font-semibold truncate">
										{a.applicant.display_name ?? a.applicant.username ?? a.applicant.id}
									</p>
									{#if a.applicant.username}
										<p class="font-mono text-xs text-text-muted">@{a.applicant.username}</p>
									{/if}
									{#if a.message}
										<p class="mt-1 text-sm text-text-muted">{a.message}</p>
									{/if}
									<p class="mt-1 text-xs text-text-muted">{fmtDate(a.applied_at)}</p>
								</div>
								<div class="flex shrink-0 gap-2">
									<Button
										variant="accent"
										size="sm"
										loading={deciding === a.id}
										onclick={() => decide(a.id, true)}
									>
										{i18n.t('guilds.manage.accept')}
									</Button>
									<Button
										variant="ghost"
										size="sm"
										loading={deciding === a.id}
										onclick={() => decide(a.id, false)}
									>
										{i18n.t('guilds.manage.reject')}
									</Button>
								</div>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{:else if tab === 'invitations'}
			<div
				id="guild-panel-invitations"
				role="tabpanel"
				aria-labelledby="guild-tab-invitations"
				data-testid="invitations-panel"
			>
				{#if invitations.length === 0}
					<div class="rounded-2xl border border-border bg-surface-elevated p-8 text-center text-sm text-text-muted">
						{i18n.t('guilds.manage.invitationsEmpty')}
					</div>
				{:else}
					<ul class="divide-y divide-border rounded-2xl border border-border bg-surface-elevated overflow-hidden">
						{#each invitations as inv (inv.id)}
							<li class="flex flex-wrap items-center gap-3 p-4" data-testid="invitation-row">
								<div class="min-w-0 flex-1">
									{#if inv.invitee}
										<p class="font-semibold truncate">
											{inv.invitee.display_name ?? inv.invitee.username ?? inv.invitee.id}
										</p>
										{#if inv.invitee.username}
											<p class="font-mono text-xs text-text-muted">@{inv.invitee.username}</p>
										{/if}
									{:else}
										<!-- Link invitation: nobody is named, anyone holding the
										     token can join, which is precisely why revoking matters. -->
										<p class="font-semibold">{i18n.t('guilds.manage.linkInvitation')}</p>
									{/if}
									<p class="mt-1 text-xs text-text-muted">
										{i18n.t('guilds.manage.expiresOn', { date: fmtDate(inv.expires_at) })}
									</p>
								</div>
								<Button
									variant="ghost"
									size="sm"
									loading={revoking === inv.id}
									onclick={() => revokeInvitation(inv.id)}
								>
									{i18n.t('guilds.manage.revoke')}
								</Button>
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
