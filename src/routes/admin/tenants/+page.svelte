<script lang="ts">
	import { onMount } from 'svelte';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import { goto } from '$app/navigation';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Modal from '$components/ui/Modal.svelte';
	import { tenantsApi, type TenantSummary, type TenantPlan } from '$api/tenants';
	import { toast } from '$stores/toast.svelte';
	import { SkilluError } from '$api/client';

	let tenants = $state<TenantSummary[]>([]);
	let loading = $state(true);
	let showCreate = $state(false);
	let creating = $state(false);

	// Create form
	let slug = $state('');
	let name = $state('');
	let subdomain = $state('');
	let contactEmail = $state('');
	let plan = $state<TenantPlan>('starter');
	let maxUsers = $state(100);
	let primaryColor = $state('#6C5CE7');
	let logoUrl = $state('');

	async function load() {
		loading = true;
		try {
			const res = await tenantsApi.list();
			tenants = res.data.tenants;
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			loading = false;
		}
	}

	async function submitCreate(e: SubmitEvent) {
		e.preventDefault();
		if (!slug.trim() || !name.trim() || !contactEmail.trim() || creating) return;
		creating = true;
		try {
			const res = await tenantsApi.create({
				slug: slug.trim().toLowerCase(),
				name: name.trim(),
				subdomain: subdomain.trim() || undefined,
				contact_email: contactEmail.trim().toLowerCase(),
				plan,
				max_users: maxUsers,
				primary_color: primaryColor,
				logo_url: logoUrl.trim() || undefined
			});
			toast.success(i18n.locale === 'fr' ? 'Tenant créé' : 'Tenant created');
			showCreate = false;
			slug = ''; name = ''; subdomain = ''; contactEmail = '';
			plan = 'starter'; maxUsers = 100; primaryColor = '#6C5CE7'; logoUrl = '';
			await load();
			void goto(`/admin/tenants/${res.data.tenant_id}`);
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			creating = false;
		}
	}

	function planVariant(p: string): 'default' | 'primary' | 'accent' | 'warning' {
		return p === 'enterprise' ? 'accent' : p === 'pro' ? 'primary' : 'default';
	}

	function fmtDate(iso: string): string {
		return new Intl.DateTimeFormat(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', {
			day: '2-digit', month: 'short', year: 'numeric'
		}).format(new Date(iso));
	}

	onMount(() => {
		if (!auth.isAuthenticated) {
			goto('/auth/login?redirect=/admin/tenants');
			return;
		}
		void load();
	});
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Tenants — Admin' : 'Tenants — Admin'}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-10 sm:py-14">
	<nav class="mb-6 flex items-center gap-2 text-sm text-text-muted">
		<a href="/admin" class="hover:text-text-primary">Admin</a>
		<span>›</span>
		<span class="text-text-primary">Tenants</span>
	</nav>

	<div class="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
		<div>
			<p class="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">White-label</p>
			<h1 class="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight">
				{i18n.locale === 'fr' ? 'Tenants.' : 'Tenants.'}
			</h1>
			<p class="mt-3 max-w-xl text-sm text-text-muted">
				{i18n.locale === 'fr'
					? 'Bootcamps et écoles hébergés sur leur propre sous-domaine, avec charte et cohortes isolées.'
					: 'Bootcamps and schools hosted on their own subdomain with custom branding and isolated cohorts.'}
			</p>
		</div>
		<Button variant="accent" onclick={() => (showCreate = true)}>
			+ {i18n.locale === 'fr' ? 'Nouveau tenant' : 'New tenant'}
		</Button>
	</div>

	{#if loading}
		<div class="space-y-2">
			{#each Array(4) as _}
				<div class="animate-pulse rounded-2xl border border-border bg-surface-elevated h-24"></div>
			{/each}
		</div>
	{:else if tenants.length === 0}
		<div class="rounded-2xl border border-border bg-surface-elevated p-10 text-center">
			<div class="mb-3 text-4xl text-text-muted">⬢</div>
			<p class="text-text-muted">
				{i18n.locale === 'fr' ? 'Aucun tenant. Crée le premier.' : 'No tenant yet. Create the first one.'}
			</p>
		</div>
	{:else}
		<div class="space-y-2">
			{#each tenants as t}
				<a
					href={`/admin/tenants/${t.id}`}
					class="flex items-center gap-4 rounded-2xl border {t.active ? 'border-border' : 'border-error/30 opacity-70'} bg-surface-elevated p-5 hover:border-primary/40 hover:shadow-md transition-all"
				>
					<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-black text-primary uppercase">
						{t.slug.charAt(0)}
					</div>
					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-2 flex-wrap">
							<h2 class="text-lg font-bold truncate">{t.name}</h2>
							<Badge variant={planVariant(t.plan)} size="sm">{t.plan}</Badge>
							{#if !t.active}
								<Badge variant="error" size="sm">{i18n.locale === 'fr' ? 'Désactivé' : 'Inactive'}</Badge>
							{/if}
						</div>
						<p class="mt-0.5 font-mono text-xs text-text-muted">
							{t.slug}
							{#if t.subdomain}
								<span> · {t.subdomain}.skilluv.com</span>
							{/if}
						</p>
					</div>
					<div class="text-right shrink-0">
						<div class="text-2xl font-black text-primary">{t.members_count}</div>
						<div class="text-xs text-text-muted">
							/ {t.max_users} {i18n.locale === 'fr' ? 'membres' : 'members'}
						</div>
					</div>
					<div class="hidden sm:block text-xs text-text-muted shrink-0 pl-2 border-l border-border">
						{fmtDate(t.created_at)}
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

<!-- Create modal -->
<Modal open={showCreate} title={i18n.locale === 'fr' ? 'Nouveau tenant' : 'New tenant'} onclose={() => (showCreate = false)}>
	<form onsubmit={submitCreate} class="space-y-4">
		<div class="grid grid-cols-2 gap-3">
			<div>
				<label for="t-slug" class="mb-1 block text-xs font-bold uppercase tracking-wider text-text-muted">
					Slug *
				</label>
				<input
					id="t-slug"
					bind:value={slug}
					required
					pattern={'[a-z0-9\\-]{2,60}'}
					placeholder="acme"
					class="w-full rounded-full border border-border bg-surface-overlay px-4 py-2 text-sm lowercase focus:border-primary focus:outline-none"
				/>
			</div>
			<div>
				<label for="t-name" class="mb-1 block text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.locale === 'fr' ? 'Nom *' : 'Name *'}
				</label>
				<input
					id="t-name"
					bind:value={name}
					required
					placeholder="Acme Bootcamp"
					class="w-full rounded-full border border-border bg-surface-overlay px-4 py-2 text-sm focus:border-primary focus:outline-none"
				/>
			</div>
		</div>
		<div>
			<label for="t-sub" class="mb-1 block text-xs font-bold uppercase tracking-wider text-text-muted">
				{i18n.locale === 'fr' ? 'Sous-domaine' : 'Subdomain'}
			</label>
			<div class="flex items-center gap-1">
				<input
					id="t-sub"
					bind:value={subdomain}
					placeholder="acme"
					class="flex-1 rounded-full border border-border bg-surface-overlay px-4 py-2 text-sm lowercase focus:border-primary focus:outline-none"
				/>
				<span class="text-sm text-text-muted">.skilluv.com</span>
			</div>
		</div>
		<div>
			<label for="t-email" class="mb-1 block text-xs font-bold uppercase tracking-wider text-text-muted">
				{i18n.locale === 'fr' ? 'Contact *' : 'Contact *'}
			</label>
			<input
				id="t-email"
				type="email"
				bind:value={contactEmail}
				required
				placeholder="admin@acme.com"
				class="w-full rounded-full border border-border bg-surface-overlay px-4 py-2 text-sm focus:border-primary focus:outline-none"
			/>
		</div>
		<div class="grid grid-cols-3 gap-3">
			<div>
				<label for="t-plan" class="mb-1 block text-xs font-bold uppercase tracking-wider text-text-muted">
					Plan
				</label>
				<select
					id="t-plan"
					bind:value={plan}
					class="w-full rounded-full border border-border bg-surface-overlay px-4 py-2 text-sm focus:border-primary focus:outline-none"
				>
					<option value="starter">Starter</option>
					<option value="pro">Pro</option>
					<option value="enterprise">Enterprise</option>
				</select>
			</div>
			<div>
				<label for="t-max" class="mb-1 block text-xs font-bold uppercase tracking-wider text-text-muted">
					Max users
				</label>
				<input
					id="t-max"
					type="number"
					bind:value={maxUsers}
					min="1"
					class="w-full rounded-full border border-border bg-surface-overlay px-4 py-2 text-sm focus:border-primary focus:outline-none"
				/>
			</div>
			<div>
				<label for="t-color" class="mb-1 block text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.locale === 'fr' ? 'Couleur' : 'Color'}
				</label>
				<input
					id="t-color"
					type="color"
					bind:value={primaryColor}
					class="w-full h-10 rounded-full border border-border cursor-pointer"
				/>
			</div>
		</div>
		<div>
			<label for="t-logo" class="mb-1 block text-xs font-bold uppercase tracking-wider text-text-muted">
				{i18n.locale === 'fr' ? 'Logo URL' : 'Logo URL'}
			</label>
			<input
				id="t-logo"
				bind:value={logoUrl}
				placeholder="https://cdn.acme.com/logo.svg"
				class="w-full rounded-full border border-border bg-surface-overlay px-4 py-2 text-sm focus:border-primary focus:outline-none"
			/>
		</div>
		<div class="flex justify-end gap-2 pt-2">
			<Button variant="ghost" onclick={() => (showCreate = false)}>
				{i18n.locale === 'fr' ? 'Annuler' : 'Cancel'}
			</Button>
			<Button variant="accent" loading={creating}>
				{i18n.locale === 'fr' ? 'Créer' : 'Create'}
			</Button>
		</div>
	</form>
</Modal>
