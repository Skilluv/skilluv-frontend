<script lang="ts">
	import { adminApi } from '$api/admin';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import Table from '$components/ui/Table.svelte';
	import Pagination from '$components/ui/Pagination.svelte';
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
	{:else}
		<Table
			columns={[
				{ key: 'date', label: i18n.t('admin.audit.date') },
				{ key: 'admin', label: i18n.t('admin.audit.admin') },
				{ key: 'action', label: i18n.t('admin.audit.action') },
				{ key: 'target', label: i18n.t('admin.audit.target') },
				{ key: 'details', label: i18n.t('admin.audit.details') }
			]}
			rows={entries.map((e) => ({
				date: new Date(e.created_at).toLocaleString('fr'),
				admin: e.admin_username,
				action: e.action,
				target: `${e.target_type}:${e.target_id.slice(0, 8)}`,
				details: e.details ?? '—'
			}))}
			emptyLabel={i18n.t('admin.audit.empty')}
		/>

		<Pagination
			current={currentPage}
			total={totalPages}
			onchange={(p) => { currentPage = p; loadAudit(); }}
			compact
		/>
	{/if}
</div>
