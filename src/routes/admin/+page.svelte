<script lang="ts">
	import { adminApi } from '$api/admin';
	import { SkilluError } from '$api/client';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import Button from '$components/ui/Button.svelte';
	import { i18n } from '$lib/i18n';

	let stats = $state<{
		users: { total: number; active_30d: number; banned: number };
		challenges: { total: number; published: number; draft: number; archived: number };
		submissions: { total: number; today: number };
		websocket: { connections: number };
	} | null>(null);

	let moderation = $state<{
		banned_users: number;
		reports: { pending: number; resolved: number; dismissed: number; total: number };
		recent_bans_30d: number;
		admin_actions_today: number;
	} | null>(null);

	let loading = $state(true);

	$effect(() => { loadDashboard(); });

	async function loadDashboard() {
		loading = true;
		try {
			const [sRes, mRes] = await Promise.all([adminApi.stats(), adminApi.moderationDashboard()]);
			stats = sRes.data;
			moderation = mRes.data;
		} catch { /* silent */ }
		loading = false;
	}
</script>

<svelte:head>
	<title>{i18n.t('admin.dashboard.title')} — Skilluv</title>
</svelte:head>

<div class="p-6 lg:p-8">
	<h1 class="mb-6 text-2xl font-bold">{i18n.t('admin.dashboard.title')}</h1>

	{#if loading}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{#each Array(8) as _}
				<Skeleton class="h-24 w-full" rounded="xl" />
			{/each}
		</div>
	{:else}
		{#if stats}
			<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-text-muted">{i18n.t('admin.dashboard.platform')}</h2>
			<div class="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<div class="rounded-xl border border-border bg-surface-elevated p-4">
					<p class="text-xs text-text-muted">{i18n.t('admin.dashboard.users')}</p>
					<p class="mt-1 text-2xl font-bold">{stats.users.total.toLocaleString()}</p>
					<p class="text-xs text-text-muted">{stats.users.active_30d} {i18n.t('admin.dashboard.activeUsers')}</p>
				</div>
				<div class="rounded-xl border border-border bg-surface-elevated p-4">
					<p class="text-xs text-text-muted">{i18n.t('admin.dashboard.challenges')}</p>
					<p class="mt-1 text-2xl font-bold">{stats.challenges.published}</p>
					<p class="text-xs text-text-muted">{stats.challenges.draft} {i18n.t('admin.dashboard.drafts')}</p>
				</div>
				<div class="rounded-xl border border-border bg-surface-elevated p-4">
					<p class="text-xs text-text-muted">{i18n.t('admin.dashboard.submissions')}</p>
					<p class="mt-1 text-2xl font-bold">{stats.submissions.total.toLocaleString()}</p>
					<p class="text-xs text-text-muted">{stats.submissions.today} {i18n.t('admin.dashboard.today')}</p>
				</div>
				<div class="rounded-xl border border-border bg-surface-elevated p-4">
					<p class="text-xs text-text-muted">WebSocket</p>
					<p class="mt-1 text-2xl font-bold">{stats.websocket.connections}</p>
					<p class="text-xs text-text-muted">{i18n.t('admin.dashboard.wsConnections')}</p>
				</div>
			</div>
		{/if}

		{#if moderation}
			<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-text-muted">{i18n.t('admin.dashboard.moderation')}</h2>
			<div class="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<div class="rounded-xl border border-border bg-surface-elevated p-4">
					<p class="text-xs text-text-muted">{i18n.t('admin.dashboard.pendingReports')}</p>
					<p class="mt-1 text-2xl font-bold {moderation.reports.pending > 0 ? 'text-warning' : ''}">{moderation.reports.pending}</p>
				</div>
				<div class="rounded-xl border border-border bg-surface-elevated p-4">
					<p class="text-xs text-text-muted">{i18n.t('admin.dashboard.bans30d')}</p>
					<p class="mt-1 text-2xl font-bold">{moderation.recent_bans_30d}</p>
				</div>
				<div class="rounded-xl border border-border bg-surface-elevated p-4">
					<p class="text-xs text-text-muted">{i18n.t('admin.dashboard.actionsToday')}</p>
					<p class="mt-1 text-2xl font-bold">{moderation.admin_actions_today}</p>
				</div>
				<div class="rounded-xl border border-border bg-surface-elevated p-4">
					<p class="text-xs text-text-muted">{i18n.t('admin.dashboard.totalReports')}</p>
					<p class="mt-1 text-2xl font-bold">{moderation.reports.total}</p>
					<p class="text-xs text-success">{moderation.reports.resolved} {i18n.t('admin.dashboard.resolved')}</p>
				</div>
			</div>
		{/if}

		<div class="flex flex-wrap gap-3">
			<Button variant="accent" href="/admin/reports">{i18n.t('admin.dashboard.viewReports')}</Button>
			<Button variant="secondary" href="/admin/challenges">{i18n.t('admin.dashboard.manageChallenges')}</Button>
			<Button variant="secondary" href="/admin/community">{i18n.t('admin.dashboard.reviewCommunity')}</Button>
		</div>
	{/if}
</div>
