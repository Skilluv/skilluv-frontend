<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { auth } from '$stores/auth.svelte';
	import { i18n } from '$lib/i18n';

	let { children } = $props();

	let pathname = $derived($page.url.pathname);

	// TOTP mandatory for enterprise/recruiter roles. This mirrors the backend
	// gate in `require_enterprise` — done here so we redirect early instead of
	// letting every child API call return 403 AUTH_TOTP_SETUP_REQUIRED.
	//
	// Two exceptions: the register endpoint (fresh account, no TOTP yet) and
	// the invite/accept flow (the invitee needs to complete the join before we
	// force TOTP on them). Both live outside this layout guard by design.
	$effect(() => {
		if (!auth.isAuthenticated || !auth.user) return;
		const role = auth.user.role;
		const needsGate = role === 'enterprise' || role === 'recruiter';
		if (needsGate && !auth.user.totp_enabled) {
			goto('/settings/security?setup_totp=required');
		}
	});

	const navItems = [
		{ href: '/enterprise/dashboard', key: 'enterprise.nav.dashboard', icon: '◻' },
		{ href: '/enterprise/talents', key: 'enterprise.nav.talents', icon: '◎' },
		{ href: '/enterprise/bookmarks', key: 'enterprise.nav.bookmarks', icon: '★' },
		{ href: '/enterprise/lists', key: 'enterprise.nav.lists', icon: '≡' },
		{ href: '/enterprise/messages', key: 'enterprise.nav.messages', icon: '◆' }
	];

	// Owner-only entries. Recruiters don't see the SSO / SCIM settings page.
	const ownerNavItems = $derived(
		auth.user?.role === 'enterprise'
			? [{ href: '/enterprise/settings/sso', label: 'SSO & SCIM', icon: '⚙' }]
			: []
	);

	function isActive(href: string): boolean {
		return pathname === href || pathname.startsWith(href + '/');
	}
</script>

{#if !auth.isAuthenticated}
	<!-- Visiteurs non connectés : pas de sidebar dashboard (sinon liens cassés) -->
	{@render children()}
{:else}
<div class="flex min-h-[calc(100vh-4rem)]">
	<!-- Sidebar desktop -->
	<aside class="hidden w-56 shrink-0 border-r border-border bg-surface-elevated p-4 lg:block">
		<div class="mb-6">
			<p class="text-xs font-semibold uppercase tracking-wider text-text-muted">Entreprise</p>
		</div>

		<nav class="flex flex-col gap-1">
			{#each navItems as item}
				<a
					href={item.href}
					class="flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors
						{isActive(item.href)
						? 'bg-primary/10 text-primary font-medium'
						: 'text-text-muted hover:bg-surface-overlay hover:text-text-primary'}"
				>
					<span class="text-base">{item.icon}</span>
					{i18n.t(item.key)}
				</a>
			{/each}

			{#if ownerNavItems.length > 0}
				<div class="mt-4 border-t border-border pt-4">
					<p class="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
						{i18n.locale === 'fr' ? 'Owner' : 'Owner'}
					</p>
					{#each ownerNavItems as item}
						<a
							href={item.href}
							class="flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors
								{isActive(item.href)
								? 'bg-primary/10 text-primary font-medium'
								: 'text-text-muted hover:bg-surface-overlay hover:text-text-primary'}"
						>
							<span class="text-base">{item.icon}</span>
							{item.label}
						</a>
					{/each}
				</div>
			{/if}
		</nav>
	</aside>

	<!-- Mobile nav -->
	<div class="fixed bottom-0 left-0 right-0 z-50 flex justify-around border-t border-border bg-surface-elevated/95 py-2 backdrop-blur-sm lg:hidden">
		{#each navItems as item}
			<a
				href={item.href}
				class="flex flex-col items-center gap-0.5 px-2 text-xs
					{isActive(item.href) ? 'text-primary' : 'text-text-muted'}"
			>
				<span class="text-lg">{item.icon}</span>
				<span>{i18n.t(item.key)}</span>
			</a>
		{/each}
	</div>

	<!-- Content -->
	<main class="flex-1 overflow-y-auto pb-20 lg:pb-0">
		{@render children()}
	</main>
</div>
{/if}
