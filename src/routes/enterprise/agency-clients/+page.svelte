<script lang="ts">
	import { onMount } from 'svelte';
	import { agencyClientsApi } from '$lib/api/agency_clients';
	import type { CreateAgencyClientBody, PatchAgencyClientBody } from '$lib/api/agency_clients';
	import { enterpriseTypesApi } from '$lib/api/enterprise_types';
	import { SkilluError } from '$lib/api/client';
	import { i18n } from '$lib/i18n';
	import type { AgencyClient, EnterpriseType } from '$lib/types';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { Pencil, Trash2, Plus, X } from '@lucide/svelte';

	let clients = $state<AgencyClient[]>([]);
	let enterpriseType = $state<EnterpriseType | null>(null);
	let loading = $state(true);
	let error = $state('');

	let showForm = $state(false);
	let editingId = $state<string | null>(null);
	let formName = $state('');
	let formEmail = $state('');
	let formNotes = $state('');
	let formActive = $state(true);
	let formError = $state('');
	let saving = $state(false);

	onMount(async () => {
		await load();
	});

	async function load() {
		loading = true;
		error = '';
		try {
			const [typeRes, clientsRes] = await Promise.allSettled([
				enterpriseTypesApi.get(),
				agencyClientsApi.list()
			]);
			if (typeRes.status === 'fulfilled') {
				enterpriseType = typeRes.value.data.enterprise_type;
			}
			if (clientsRes.status === 'fulfilled') {
				clients = clientsRes.value.data;
			} else if (clientsRes.reason instanceof SkilluError) {
				error = clientsRes.reason.message;
			}
		} finally {
			loading = false;
		}
	}

	function openCreate() {
		editingId = null;
		formName = '';
		formEmail = '';
		formNotes = '';
		formActive = true;
		formError = '';
		showForm = true;
	}

	function openEdit(c: AgencyClient) {
		editingId = c.id;
		formName = c.client_name;
		formEmail = c.client_contact_email ?? '';
		formNotes = c.notes ?? '';
		formActive = c.active;
		formError = '';
		showForm = true;
	}

	function closeForm() {
		showForm = false;
		editingId = null;
		formError = '';
	}

	async function saveClient(e: SubmitEvent) {
		e.preventDefault();
		formError = '';
		if (!formName.trim()) {
			formError = i18n.t('enterprise.agencyClients.nameError');
			return;
		}
		saving = true;
		try {
			if (editingId === null) {
				const body: CreateAgencyClientBody = {
					client_name: formName.trim(),
					client_contact_email: formEmail.trim() || undefined,
					notes: formNotes.trim() || undefined
				};
				const res = await agencyClientsApi.create(body);
				clients = [...clients, res.data];
			} else {
				const body: PatchAgencyClientBody = {
					client_name: formName.trim(),
					client_contact_email: formEmail.trim() || undefined,
					notes: formNotes.trim() || undefined,
					active: formActive
				};
				const res = await agencyClientsApi.patch(editingId, body);
				clients = clients.map((c) => (c.id === editingId ? res.data : c));
			}
			closeForm();
		} catch (err) {
			formError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			saving = false;
		}
	}

	async function archiveClient(c: AgencyClient) {
		if (!confirm(i18n.t('enterprise.agencyClients.deleteConfirm'))) return;
		try {
			await agencyClientsApi.remove(c.id);
			clients = clients.map((x) => (x.id === c.id ? { ...x, active: false } : x));
		} catch (err) {
			error = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		}
	}

	async function restoreClient(c: AgencyClient) {
		try {
			const res = await agencyClientsApi.patch(c.id, { active: true });
			clients = clients.map((x) => (x.id === c.id ? res.data : x));
		} catch (err) {
			error = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		}
	}

	let isAgency = $derived(enterpriseType === 'staffing_agency');
</script>

<svelte:head>
	<title>{i18n.t('enterprise.agencyClients.title')} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-8">
	<header class="mb-8 flex items-start justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold text-text-primary">
				{i18n.t('enterprise.agencyClients.title')}
			</h1>
			<p class="mt-1 text-sm text-text-muted">
				{i18n.t('enterprise.agencyClients.subtitle')}
			</p>
		</div>
		{#if !loading && isAgency && !showForm}
			<Button variant="primary" onclick={openCreate}>
				<Plus size={16} strokeWidth={2} />
				{i18n.t('enterprise.agencyClients.addBtn')}
			</Button>
		{/if}
	</header>

	{#if !loading && !isAgency}
		<div class="rounded-2xl border border-warning/40 bg-warning/5 p-6 text-center" role="alert">
			<p class="text-sm text-text-primary">{i18n.t('enterprise.agencyClients.ownerOnly')}</p>
		</div>
	{:else if loading}
		<div class="space-y-3">
			<Skeleton class="h-16 w-full" rounded="xl" />
			<Skeleton class="h-16 w-full" rounded="xl" />
			<Skeleton class="h-16 w-full" rounded="xl" />
		</div>
	{:else if error}
		<div class="rounded-2xl border border-error/40 bg-error/5 p-6 text-center" role="alert">
			<p class="text-sm text-error">{error}</p>
		</div>
	{:else}
		{#if showForm}
			<form
				onsubmit={saveClient}
				class="mb-6 rounded-2xl border border-border bg-surface-elevated p-6"
				aria-labelledby="agency-form-title"
			>
				<div class="mb-4 flex items-center justify-between">
					<h2 id="agency-form-title" class="text-lg font-bold text-text-primary">
						{editingId === null
							? i18n.t('enterprise.agencyClients.addBtn')
							: i18n.t('enterprise.agencyClients.edit')}
					</h2>
					<button
						type="button"
						onclick={closeForm}
						class="rounded-full p-1 text-text-muted transition-colors hover:bg-surface-overlay hover:text-text-primary"
						aria-label={i18n.t('enterprise.agencyClients.cancelBtn')}
					>
						<X size={16} strokeWidth={2} />
					</button>
				</div>

				<div class="grid gap-4">
					<Input
						name="client_name"
						label={i18n.t('enterprise.agencyClients.nameLabel')}
						bind:value={formName}
						error={formError}
						required
					/>
					<Input
						name="client_contact_email"
						type="email"
						label={i18n.t('enterprise.agencyClients.emailLabel')}
						bind:value={formEmail}
					/>
					<Input
						name="notes"
						label={i18n.t('enterprise.agencyClients.notesLabel')}
						bind:value={formNotes}
					/>
					{#if editingId !== null}
						<label class="flex items-center gap-2 text-sm">
							<input
								type="checkbox"
								bind:checked={formActive}
								class="h-4 w-4 rounded border-border accent-accent focus:ring-2 focus:ring-accent"
							/>
							<span>{i18n.t('enterprise.agencyClients.activeLabel')}</span>
						</label>
					{/if}
				</div>

				<div class="mt-5 flex justify-end gap-2">
					<Button variant="ghost" onclick={closeForm} disabled={saving}>
						{i18n.t('enterprise.agencyClients.cancelBtn')}
					</Button>
					<Button type="submit" variant="primary" loading={saving}>
						{i18n.t('enterprise.agencyClients.saveBtn')}
					</Button>
				</div>
			</form>
		{/if}

		{#if clients.length === 0}
			<EmptyState variant="keyring" title={i18n.t('enterprise.agencyClients.empty')}>
				{#snippet action()}
					<Button variant="primary" onclick={openCreate}>
						<Plus size={16} strokeWidth={2} />
						{i18n.t('enterprise.agencyClients.emptyAction')}
					</Button>
				{/snippet}
			</EmptyState>
		{:else}
			<ul class="space-y-3" role="list">
				{#each clients as c (c.id)}
					<li
						class="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface-elevated p-4 {c.active
							? ''
							: 'opacity-60'}"
					>
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 flex-wrap">
								<p class="font-medium text-text-primary">{c.client_name}</p>
								{#if !c.active}
									<span class="rounded bg-surface-overlay px-2 py-0.5 text-[10px] uppercase text-text-muted">
										{i18n.t('enterprise.agencyClients.archivedBadge')}
									</span>
								{/if}
							</div>
							{#if c.client_contact_email}
								<p class="mt-0.5 text-xs text-text-muted">{c.client_contact_email}</p>
							{/if}
							{#if c.notes}
								<p class="mt-1 text-sm text-text-muted">{c.notes}</p>
							{/if}
							<p class="mt-1 text-[10px] uppercase tracking-wide text-text-muted">
								{i18n.t('enterprise.agencyClients.createdOn', {
									date: new Date(c.created_at).toLocaleDateString(i18n.locale)
								})}
							</p>
						</div>
						<div class="flex shrink-0 items-center gap-2">
							<button
								type="button"
								onclick={() => openEdit(c)}
								class="rounded-lg border border-border p-2 text-text-muted transition-colors hover:bg-surface-overlay hover:text-text-primary"
								aria-label={i18n.t('enterprise.agencyClients.edit')}
							>
								<Pencil size={14} strokeWidth={2} />
							</button>
							{#if c.active}
								<button
									type="button"
									onclick={() => archiveClient(c)}
									class="rounded-lg border border-border p-2 text-text-muted transition-colors hover:bg-error/10 hover:text-error"
									aria-label={i18n.t('enterprise.agencyClients.deleteBtn')}
								>
									<Trash2 size={14} strokeWidth={2} />
								</button>
							{:else}
								<Button variant="ghost" size="sm" onclick={() => restoreClient(c)}>
									{i18n.t('enterprise.agencyClients.restoreBtn')}
								</Button>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</div>
