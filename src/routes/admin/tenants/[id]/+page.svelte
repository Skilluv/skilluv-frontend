<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import { goto } from '$app/navigation';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Modal from '$components/ui/Modal.svelte';
	import Select from '$components/ui/Select.svelte';
	import { tenantsApi, type TenantFull, type TenantMember, type TenantCohort, type TenantPlan, type TenantMemberRole } from '$api/tenants';
	import { toast } from '$stores/toast.svelte';
	import { SkilluError } from '$api/client';

	let tenantId = $derived(page.params.id ?? '');
	let tenant = $state<TenantFull | null>(null);
	let members = $state<TenantMember[]>([]);
	let cohorts = $state<TenantCohort[]>([]);
	let loading = $state(true);
	let activeTab = $state<'config' | 'members' | 'cohorts'>('config');

	// Config form
	let saving = $state(false);
	let editName = $state('');
	let editSubdomain = $state<string>('');
	let editCustomDomain = $state<string>('');
	let editLogoUrl = $state<string>('');
	let editPrimaryColor = $state<string>('#6C5CE7');
	let editSecondaryColor = $state<string>('#EA580C');
	let editPlan = $state<TenantPlan>('starter');
	let editMaxUsers = $state<number>(100);
	let editActive = $state(true);

	// Members
	let showAddMember = $state(false);
	let newMemberUserId = $state('');
	let newMemberRole = $state<TenantMemberRole>('member');
	let addingMember = $state(false);

	// Cohorts
	let showAddCohort = $state(false);
	let newCohortName = $state('');
	let newCohortStart = $state('');
	let newCohortEnd = $state('');
	let addingCohort = $state(false);

	async function load() {
		loading = true;
		try {
			const [tRes, mRes, cRes] = await Promise.all([
				tenantsApi.get(tenantId),
				tenantsApi.listMembers(tenantId).catch(() => null),
				tenantsApi.listCohorts(tenantId).catch(() => null)
			]);
			tenant = tRes.data;
			editName = tenant.name;
			editSubdomain = tenant.subdomain ?? '';
			editCustomDomain = tenant.custom_domain ?? '';
			editLogoUrl = tenant.logo_url ?? '';
			editPrimaryColor = tenant.primary_color ?? '#6C5CE7';
			editSecondaryColor = tenant.secondary_color ?? '#EA580C';
			editPlan = tenant.plan;
			editMaxUsers = tenant.max_users;
			editActive = tenant.active;
			if (mRes) members = mRes.data.members;
			if (cRes) cohorts = cRes.data.cohorts;
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			loading = false;
		}
	}

	async function saveConfig(e: SubmitEvent) {
		e.preventDefault();
		saving = true;
		try {
			await tenantsApi.update(tenantId, {
				name: editName.trim(),
				subdomain: editSubdomain.trim() || null,
				custom_domain: editCustomDomain.trim() || null,
				logo_url: editLogoUrl.trim() || null,
				primary_color: editPrimaryColor,
				secondary_color: editSecondaryColor,
				plan: editPlan,
				max_users: editMaxUsers,
				active: editActive
			});
			toast.success(i18n.locale === 'fr' ? 'Sauvegardé' : 'Saved');
			await load();
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			saving = false;
		}
	}

	async function addMember(e: SubmitEvent) {
		e.preventDefault();
		if (!newMemberUserId.trim() || addingMember) return;
		addingMember = true;
		try {
			await tenantsApi.addMember(tenantId, newMemberUserId.trim(), newMemberRole);
			toast.success(i18n.locale === 'fr' ? 'Membre ajouté' : 'Member added');
			newMemberUserId = '';
			newMemberRole = 'member';
			showAddMember = false;
			await load();
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			addingMember = false;
		}
	}

	async function addCohort(e: SubmitEvent) {
		e.preventDefault();
		if (!newCohortName.trim() || addingCohort) return;
		addingCohort = true;
		try {
			await tenantsApi.createCohort(
				tenantId,
				newCohortName.trim(),
				newCohortStart ? new Date(newCohortStart).toISOString() : undefined,
				newCohortEnd ? new Date(newCohortEnd).toISOString() : undefined
			);
			toast.success(i18n.locale === 'fr' ? 'Cohorte créée' : 'Cohort created');
			newCohortName = ''; newCohortStart = ''; newCohortEnd = '';
			showAddCohort = false;
			await load();
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			addingCohort = false;
		}
	}

	function roleVariant(r: string): 'default' | 'primary' | 'accent' | 'warning' {
		return r === 'owner' ? 'warning' : r === 'admin' ? 'accent' : r === 'instructor' ? 'primary' : 'default';
	}

	function fmtDate(iso: string): string {
		return new Intl.DateTimeFormat(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', {
			day: '2-digit', month: 'short', year: 'numeric'
		}).format(new Date(iso));
	}

	function fmtDateOnly(iso: string | null): string {
		if (!iso) return '—';
		return new Intl.DateTimeFormat(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', {
			day: '2-digit', month: 'short', year: 'numeric'
		}).format(new Date(iso));
	}

	let previewUrl = $derived.by(() => {
		if (!tenant) return '';
		if (tenant.custom_domain) return `https://${tenant.custom_domain}`;
		if (tenant.subdomain) return `https://${tenant.subdomain}.skilluv.com`;
		return `https://skilluv.com/?X-Skilluv-Tenant=${tenant.slug}`;
	});

	onMount(() => {
		if (!auth.isAuthenticated) {
			goto('/auth/login?redirect=/admin/tenants');
			return;
		}
		void load();
	});
</script>

<svelte:head>
	<title>{tenant?.name ?? 'Tenant'} — Admin Skilluv</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-10 sm:py-14">
	<nav class="mb-6 flex items-center gap-2 text-sm text-text-muted">
		<a href="/admin" class="hover:text-text-primary">Admin</a>
		<span>›</span>
		<a href="/admin/tenants" class="hover:text-text-primary">Tenants</a>
		<span>›</span>
		<span class="text-text-primary truncate">{tenant?.name ?? '...'}</span>
	</nav>

	{#if loading}
		<div class="animate-pulse space-y-4">
			<div class="h-32 rounded bg-surface-elevated"></div>
			<div class="h-96 rounded bg-surface-elevated"></div>
		</div>
	{:else if tenant}
		<!-- Header -->
		<header class="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
			<div class="flex items-start gap-4">
				<div
					class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-border text-3xl font-black"
					style={`border-color: ${tenant.primary_color ?? 'var(--sk-primary)'}; color: ${tenant.primary_color ?? 'var(--sk-primary)'}`}
				>
					{tenant.slug.charAt(0).toUpperCase()}
				</div>
				<div>
					<div class="flex items-center gap-2 flex-wrap">
						<h1 class="text-3xl sm:text-4xl font-black tracking-tight">{tenant.name}</h1>
						<Badge variant={tenant.plan === 'enterprise' ? 'accent' : tenant.plan === 'pro' ? 'primary' : 'default'} size="md">
							{tenant.plan}
						</Badge>
						{#if !tenant.active}
							<Badge variant="error" size="sm">{i18n.locale === 'fr' ? 'Désactivé' : 'Inactive'}</Badge>
						{/if}
					</div>
					<p class="mt-1 font-mono text-sm text-text-muted">{tenant.slug}</p>
					<a href={previewUrl} target="_blank" rel="noopener" class="mt-2 inline-block text-xs underline hover:text-primary">
						{previewUrl} ↗
					</a>
				</div>
			</div>
			<div class="text-right shrink-0">
				<p class="text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.locale === 'fr' ? 'Contact' : 'Contact'}
				</p>
				<a href={`mailto:${tenant.contact_email}`} class="text-sm hover:text-primary">
					{tenant.contact_email}
				</a>
			</div>
		</header>

		<!-- Tabs -->
		<div class="mb-6 flex gap-1 border-b border-border">
			{#each [
				{ v: 'config' as const, fr: 'Configuration', en: 'Configuration' },
				{ v: 'members' as const, fr: `Membres (${members.length})`, en: `Members (${members.length})` },
				{ v: 'cohorts' as const, fr: `Cohortes (${cohorts.length})`, en: `Cohorts (${cohorts.length})` }
			] as tab}
				<button
					onclick={() => (activeTab = tab.v)}
					class="px-4 py-2 text-sm font-semibold transition-colors border-b-2 {activeTab === tab.v ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-primary'}"
				>
					{i18n.locale === 'fr' ? tab.fr : tab.en}
				</button>
			{/each}
		</div>

		<!-- Tab: Config -->
		{#if activeTab === 'config'}
			<form onsubmit={saveConfig} class="space-y-5 rounded-2xl border border-border bg-surface-elevated p-6">
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="e-name" class="mb-1 block text-xs font-bold uppercase tracking-wider text-text-muted">
							{i18n.locale === 'fr' ? 'Nom' : 'Name'}
						</label>
						<input id="e-name" bind:value={editName} required class="w-full rounded-full border border-border bg-surface-overlay px-4 py-2 text-sm focus:border-primary focus:outline-none" />
					</div>
					<div>
						<label for="e-plan" class="mb-1 block text-xs font-bold uppercase tracking-wider text-text-muted">
							Plan
						</label>
						<Select
							items={[
								{ value: 'starter', label: 'Starter' },
								{ value: 'pro', label: 'Pro' },
								{ value: 'enterprise', label: 'Enterprise' }
							]}
							bind:value={editPlan}
							class="w-full"
						/>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="e-sub" class="mb-1 block text-xs font-bold uppercase tracking-wider text-text-muted">
							{i18n.locale === 'fr' ? 'Sous-domaine' : 'Subdomain'}
						</label>
						<div class="flex items-center gap-1">
							<input id="e-sub" bind:value={editSubdomain} placeholder="acme" class="flex-1 rounded-full border border-border bg-surface-overlay px-4 py-2 text-sm lowercase focus:border-primary focus:outline-none" />
							<span class="text-xs text-text-muted">.skilluv.com</span>
						</div>
					</div>
					<div>
						<label for="e-dom" class="mb-1 block text-xs font-bold uppercase tracking-wider text-text-muted">
							{i18n.locale === 'fr' ? 'Domaine custom' : 'Custom domain'}
						</label>
						<input id="e-dom" bind:value={editCustomDomain} placeholder="app.acme.com" class="w-full rounded-full border border-border bg-surface-overlay px-4 py-2 text-sm focus:border-primary focus:outline-none" />
					</div>
				</div>

				<div>
					<label for="e-logo" class="mb-1 block text-xs font-bold uppercase tracking-wider text-text-muted">
						Logo URL
					</label>
					<input id="e-logo" bind:value={editLogoUrl} placeholder="https://cdn..." class="w-full rounded-full border border-border bg-surface-overlay px-4 py-2 text-sm focus:border-primary focus:outline-none" />
				</div>

				<div class="grid grid-cols-3 gap-3">
					<div>
						<label for="e-c1" class="mb-1 block text-xs font-bold uppercase tracking-wider text-text-muted">
							{i18n.locale === 'fr' ? 'Couleur primaire' : 'Primary color'}
						</label>
						<input id="e-c1" type="color" bind:value={editPrimaryColor} class="w-full h-10 rounded-full border border-border cursor-pointer" />
					</div>
					<div>
						<label for="e-c2" class="mb-1 block text-xs font-bold uppercase tracking-wider text-text-muted">
							{i18n.locale === 'fr' ? 'Couleur accent' : 'Accent color'}
						</label>
						<input id="e-c2" type="color" bind:value={editSecondaryColor} class="w-full h-10 rounded-full border border-border cursor-pointer" />
					</div>
					<div>
						<label for="e-max" class="mb-1 block text-xs font-bold uppercase tracking-wider text-text-muted">
							Max users
						</label>
						<input id="e-max" type="number" bind:value={editMaxUsers} min="1" class="w-full rounded-full border border-border bg-surface-overlay px-4 py-2 text-sm focus:border-primary focus:outline-none" />
					</div>
				</div>

				<label class="flex items-center gap-2 text-sm">
					<input type="checkbox" bind:checked={editActive} class="h-4 w-4 accent-primary" />
					<span>{i18n.locale === 'fr' ? 'Tenant actif (visible)' : 'Tenant active (visible)'}</span>
				</label>

				<div class="flex justify-end">
					<Button variant="accent" loading={saving}>
						{i18n.locale === 'fr' ? 'Sauvegarder' : 'Save'}
					</Button>
				</div>
			</form>

			<!-- Preview -->
			<div class="mt-6 rounded-2xl border border-border bg-surface-elevated p-6">
				<p class="mb-3 text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.locale === 'fr' ? 'Aperçu du thème' : 'Theme preview'}
				</p>
				<div class="flex items-center gap-4">
					<div
						class="flex h-16 w-16 items-center justify-center rounded-2xl text-white font-black text-2xl"
						style={`background-color: ${editPrimaryColor}`}
					>
						{tenant.slug.charAt(0).toUpperCase()}
					</div>
					<div class="flex-1">
						<div class="flex items-center gap-2 mb-2">
							<span class="rounded-full px-4 py-1 text-white text-xs font-bold" style={`background-color: ${editPrimaryColor}`}>Primary</span>
							<span class="rounded-full px-4 py-1 text-white text-xs font-bold" style={`background-color: ${editSecondaryColor}`}>Accent</span>
						</div>
						<div class="h-2 w-full rounded-full" style={`background: linear-gradient(90deg, ${editPrimaryColor}, ${editSecondaryColor})`}></div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Tab: Members -->
		{#if activeTab === 'members'}
			<div class="mb-4 flex justify-between items-center">
				<p class="text-sm text-text-muted">
					{members.length} / {tenant.max_users} {i18n.locale === 'fr' ? 'membres' : 'members'}
				</p>
				<Button variant="accent" onclick={() => (showAddMember = true)}>
					+ {i18n.locale === 'fr' ? 'Ajouter' : 'Add'}
				</Button>
			</div>
			{#if members.length === 0}
				<div class="rounded-2xl border border-border bg-surface-elevated p-10 text-center">
					<p class="text-text-muted">
						{i18n.locale === 'fr' ? 'Aucun membre.' : 'No members.'}
					</p>
				</div>
			{:else}
				<div class="divide-y divide-border rounded-2xl border border-border bg-surface-elevated overflow-hidden">
					{#each members as m}
						<a href={`/profile/${m.username}`} class="flex items-center gap-3 p-4 hover:bg-surface-overlay transition-colors">
							<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-lg font-black text-primary shrink-0">
								{m.display_name.charAt(0)}
							</div>
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<span class="font-semibold truncate">{m.display_name}</span>
									<Badge variant={roleVariant(m.role)} size="sm">{m.role}</Badge>
								</div>
								<div class="font-mono text-xs text-text-muted">@{m.username} · {m.email}</div>
							</div>
							<div class="text-xs text-text-muted shrink-0">
								{fmtDate(m.joined_at)}
							</div>
						</a>
					{/each}
				</div>
			{/if}
		{/if}

		<!-- Tab: Cohorts -->
		{#if activeTab === 'cohorts'}
			<div class="mb-4 flex justify-between items-center">
				<p class="text-sm text-text-muted">
					{cohorts.length} {i18n.locale === 'fr' ? 'cohortes' : 'cohorts'}
				</p>
				<Button variant="accent" onclick={() => (showAddCohort = true)}>
					+ {i18n.locale === 'fr' ? 'Nouvelle cohorte' : 'New cohort'}
				</Button>
			</div>
			{#if cohorts.length === 0}
				<div class="rounded-2xl border border-border bg-surface-elevated p-10 text-center">
					<p class="text-text-muted">
						{i18n.locale === 'fr' ? 'Aucune cohorte.' : 'No cohorts.'}
					</p>
				</div>
			{:else}
				<div class="space-y-2">
					{#each cohorts as c}
						<div class="rounded-2xl border border-border bg-surface-elevated p-5">
							<div class="flex items-center gap-4">
								<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-lg text-accent">
									⬢
								</div>
								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-2">
										<span class="font-semibold">{c.name}</span>
										{#if !c.active}
											<Badge variant="default" size="sm">
												{i18n.locale === 'fr' ? 'Inactive' : 'Inactive'}
											</Badge>
										{/if}
									</div>
									<p class="mt-0.5 text-xs text-text-muted">
										{fmtDateOnly(c.starts_at)} → {fmtDateOnly(c.ends_at)}
									</p>
								</div>
								<div class="text-right shrink-0">
									<div class="text-2xl font-black text-primary">{c.members_count}</div>
									<div class="text-xs text-text-muted">
										{i18n.locale === 'fr' ? 'membres' : 'members'}
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	{/if}
</div>

<!-- Add member modal -->
<Modal open={showAddMember} title={i18n.locale === 'fr' ? 'Ajouter un membre' : 'Add member'} onclose={() => (showAddMember = false)}>
	<form onsubmit={addMember} class="space-y-4">
		<div>
			<label for="m-uid" class="mb-1 block text-xs font-bold uppercase tracking-wider text-text-muted">
				User ID (UUID)
			</label>
			<input id="m-uid" bind:value={newMemberUserId} required placeholder="00000000-0000-..." class="w-full rounded-full border border-border bg-surface-overlay px-4 py-2 text-sm font-mono focus:border-primary focus:outline-none" />
		</div>
		<div>
			<label for="m-role" class="mb-1 block text-xs font-bold uppercase tracking-wider text-text-muted">
				{i18n.locale === 'fr' ? 'Rôle' : 'Role'}
			</label>
			<Select
				items={[
					{ value: 'member', label: 'Member' },
					{ value: 'instructor', label: 'Instructor' },
					{ value: 'admin', label: 'Admin' },
					{ value: 'owner', label: 'Owner' }
				]}
				bind:value={newMemberRole}
				class="w-full"
			/>
		</div>
		<div class="flex justify-end gap-2 pt-2">
			<Button variant="ghost" onclick={() => (showAddMember = false)}>
				{i18n.locale === 'fr' ? 'Annuler' : 'Cancel'}
			</Button>
			<Button variant="accent" loading={addingMember}>
				{i18n.locale === 'fr' ? 'Ajouter' : 'Add'}
			</Button>
		</div>
	</form>
</Modal>

<!-- Add cohort modal -->
<Modal open={showAddCohort} title={i18n.locale === 'fr' ? 'Nouvelle cohorte' : 'New cohort'} onclose={() => (showAddCohort = false)}>
	<form onsubmit={addCohort} class="space-y-4">
		<div>
			<label for="c-name" class="mb-1 block text-xs font-bold uppercase tracking-wider text-text-muted">
				{i18n.locale === 'fr' ? 'Nom' : 'Name'}
			</label>
			<input id="c-name" bind:value={newCohortName} required placeholder="Promo 2026" class="w-full rounded-full border border-border bg-surface-overlay px-4 py-2 text-sm focus:border-primary focus:outline-none" />
		</div>
		<div class="grid grid-cols-2 gap-3">
			<div>
				<label for="c-start" class="mb-1 block text-xs font-bold uppercase tracking-wider text-text-muted">
					Start
				</label>
				<input id="c-start" type="date" bind:value={newCohortStart} class="w-full rounded-full border border-border bg-surface-overlay px-4 py-2 text-sm focus:border-primary focus:outline-none" />
			</div>
			<div>
				<label for="c-end" class="mb-1 block text-xs font-bold uppercase tracking-wider text-text-muted">
					End
				</label>
				<input id="c-end" type="date" bind:value={newCohortEnd} class="w-full rounded-full border border-border bg-surface-overlay px-4 py-2 text-sm focus:border-primary focus:outline-none" />
			</div>
		</div>
		<div class="flex justify-end gap-2 pt-2">
			<Button variant="ghost" onclick={() => (showAddCohort = false)}>
				{i18n.locale === 'fr' ? 'Annuler' : 'Cancel'}
			</Button>
			<Button variant="accent" loading={addingCohort}>
				{i18n.locale === 'fr' ? 'Créer' : 'Create'}
			</Button>
		</div>
	</form>
</Modal>
