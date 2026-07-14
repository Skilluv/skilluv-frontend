<script lang="ts">
	import { onMount } from 'svelte';
	import { enterpriseApi } from '$lib/api/enterprise';
	import { SkilluError } from '$lib/api/client';
	import { toast } from '$lib/stores/toast.svelte';
	import { i18n } from '$lib/i18n';
	import { Check, ChevronDown, Building2 } from '@lucide/svelte';

	// Workspace switcher shown in EnterpriseHeader for users who belong to more
	// than one enterprise. Fetches /enterprise/memberships on mount, renders a
	// dropdown, and calls POST /enterprise/switch/:id when the user picks a
	// different workspace. We hard-reload after switching because a full SSR
	// pass is the simplest way to re-run every `require_enterprise` gate with
	// the new cookie (dashboards, sidebars, etc. all read from that).

	type Membership = {
		enterprise_id: string;
		company_name: string;
		slug: string | null;
		logo_url: string | null;
		role: 'owner' | 'recruiter' | 'enterprise';
		accepted_at: string | null;
		is_active: boolean;
	};

	let memberships = $state<Membership[]>([]);
	let loading = $state(true);
	let open = $state(false);
	let switching = $state(false);

	let active = $derived(memberships.find((m) => m.is_active) ?? memberships[0]);

	async function load() {
		try {
			const res = await enterpriseApi.memberships();
			memberships = res.data.memberships;
		} catch {
			// Silently degrade — the switcher is auxiliary UI, a fetch failure
			// shouldn't break the enterprise header rendering.
			memberships = [];
		} finally {
			loading = false;
		}
	}

	async function pick(m: Membership) {
		if (switching || m.is_active) {
			open = false;
			return;
		}
		switching = true;
		try {
			await enterpriseApi.switchEnterprise(m.enterprise_id);
			// Full reload so every server-rendered route (dashboard header,
			// sidebar counts, breadcrumbs) picks up the new active enterprise.
			window.location.href = '/enterprise/dashboard';
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
			switching = false;
		}
	}

	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('[data-enterprise-switcher]')) open = false;
	}

	onMount(() => void load());
</script>

<svelte:window on:click={handleClickOutside} />

{#if !loading && memberships.length > 0}
	<div class="relative" data-enterprise-switcher>
		{#if memberships.length === 1}
			<!-- Single membership → static label, no dropdown affordance. -->
			<div
				class="flex items-center gap-2 rounded-full border border-border bg-surface-overlay px-2.5 py-1 text-xs font-semibold text-text-primary"
			>
				{#if active?.logo_url}
					<img src={active.logo_url} alt="" class="h-4 w-4 rounded object-cover" />
				{:else}
					<Building2 size={12} strokeWidth={2.5} class="text-text-muted" />
				{/if}
				<span class="max-w-[140px] truncate">{active?.company_name}</span>
			</div>
		{:else}
			<button
				type="button"
				onclick={() => (open = !open)}
				class="flex items-center gap-2 rounded-full border border-border bg-surface-overlay px-2.5 py-1 text-xs font-semibold text-text-primary transition-colors hover:border-accent"
				aria-haspopup="menu"
				aria-expanded={open}
			>
				{#if active?.logo_url}
					<img src={active.logo_url} alt="" class="h-4 w-4 rounded object-cover" />
				{:else}
					<Building2 size={12} strokeWidth={2.5} class="text-text-muted" />
				{/if}
				<span class="max-w-[140px] truncate">{active?.company_name ?? '—'}</span>
				<ChevronDown size={12} strokeWidth={2.5} class="text-text-muted" />
			</button>

			{#if open}
				<div
					role="menu"
					class="absolute left-0 top-full mt-2 w-72 rounded-xl border border-border bg-surface-elevated p-1.5 shadow-lg"
				>
					<p class="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-text-muted">
						{i18n.locale === 'fr' ? 'Espaces entreprise' : 'Enterprise workspaces'}
					</p>
					{#each memberships as m (m.enterprise_id)}
						<button
							type="button"
							role="menuitem"
							onclick={() => pick(m)}
							disabled={switching}
							class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-surface-overlay {m.is_active
								? 'bg-surface-overlay text-text-primary'
								: 'text-text-muted'} disabled:opacity-60"
						>
							{#if m.logo_url}
								<img src={m.logo_url} alt="" class="h-6 w-6 rounded object-cover" />
							{:else}
								<div class="flex h-6 w-6 items-center justify-center rounded bg-surface-overlay text-[10px] font-black text-primary">
									{m.company_name[0]?.toUpperCase() ?? '?'}
								</div>
							{/if}
							<div class="flex-1 text-left">
								<p class="truncate font-medium text-text-primary">{m.company_name}</p>
								<p class="text-[10px] uppercase tracking-wider text-text-muted">{m.role}</p>
							</div>
							{#if m.is_active}
								<Check size={14} strokeWidth={2.5} class="text-accent" />
							{/if}
						</button>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
{/if}
