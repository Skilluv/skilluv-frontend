<script lang="ts">
	import { adminApi } from '$api/admin';
	import Button from '$components/ui/Button.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import { i18n } from '$lib/i18n';

	interface AuditEntry {
		id: string; admin_id: string; admin_username: string;
		action: string; target_type: string; target_id: string;
		details: string | null; created_at: string;
	}

	let entries = $state<AuditEntry[]>([]);
	let loading = $state(true);
	let currentPage = $state(1);
	let totalPages = $state(1);

	$effect(() => { loadAudit(); });

	async function loadAudit() {
		loading = true;
		try {
			const res = await adminApi.auditLog({ page: currentPage, per_page: 30 });
			entries = res.data as AuditEntry[];
			totalPages = res.pagination.total_pages;
		} catch { /* silent */ }
		loading = false;
	}
</script>

<svelte:head>
	<title>{i18n.t('admin.audit.title')} — Admin Skilluv</title>
</svelte:head>

<div class="p-6 lg:p-8">
	<h1 class="mb-6 text-2xl font-bold">{i18n.t('admin.audit.title')}</h1>

	{#if loading}
		<div class="flex flex-col gap-2">{#each Array(10) as _}<Skeleton class="h-10 w-full" rounded="lg" />{/each}</div>
	{:else if entries.length === 0}
		<p class="py-8 text-center text-text-muted">{i18n.t('admin.audit.empty')}</p>
	{:else}
		<div class="overflow-hidden rounded-2xl border border-border">
			<table class="w-full text-sm">
				<thead class="border-b border-border bg-surface-overlay text-left text-xs text-text-muted">
					<tr>
						<th class="px-4 py-2">{i18n.t('admin.audit.date')}</th>
						<th class="px-4 py-2">{i18n.t('admin.audit.admin')}</th>
						<th class="px-4 py-2">{i18n.t('admin.audit.action')}</th>
						<th class="px-4 py-2">{i18n.t('admin.audit.target')}</th>
						<th class="px-4 py-2">{i18n.t('admin.audit.details')}</th>
					</tr>
				</thead>
				<tbody>
					{#each entries as entry}
						<tr class="border-b border-border last:border-0">
							<td class="whitespace-nowrap px-4 py-2 text-xs text-text-muted">
								{new Date(entry.created_at).toLocaleString('fr')}
							</td>
							<td class="px-4 py-2 font-medium">{entry.admin_username}</td>
							<td class="px-4 py-2">{entry.action}</td>
							<td class="px-4 py-2 text-xs text-text-muted">{entry.target_type}:{entry.target_id.slice(0, 8)}</td>
							<td class="px-4 py-2 text-xs text-text-muted">{entry.details ?? '—'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		{#if totalPages > 1}
			<div class="mt-4 flex items-center justify-center gap-4">
				<Button variant="ghost" size="sm" disabled={currentPage <= 1} onclick={() => { currentPage--; loadAudit(); }}>←</Button>
				<span class="text-sm text-text-muted">{currentPage}/{totalPages}</span>
				<Button variant="ghost" size="sm" disabled={currentPage >= totalPages} onclick={() => { currentPage++; loadAudit(); }}>→</Button>
			</div>
		{/if}
	{/if}
</div>
