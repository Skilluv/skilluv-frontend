<script lang="ts">
	import { page } from '$app/stores';
	import { i18n } from '$lib/i18n';

	let { children } = $props();
	let pathname = $derived($page.url.pathname);

	const navItems = $derived([
		{ href: '/admin', label: i18n.t('admin.dashboard.title').replace(' Admin', ''), icon: '◻' },
		{ href: '/admin/users', label: i18n.t('admin.users.title'), icon: '◎' },
		{ href: '/admin/reports', label: i18n.t('admin.reports.title'), icon: '⚑' },
		{ href: '/admin/challenges', label: i18n.t('admin.challenges.title'), icon: '{ }' },
		{ href: '/admin/community', label: i18n.t('common.nav.community'), icon: '★' },
		{ href: '/admin/audit-log', label: 'Audit', icon: '⏱' },
		{ href: '/admin/sso-sessions', label: 'SSO sessions', icon: '🔐' }
	]);

	function isActive(href: string): boolean {
		if (href === '/admin') return pathname === '/admin';
		return pathname.startsWith(href);
	}
</script>

<div class="flex min-h-[calc(100vh-4rem)]">
	<aside class="hidden w-52 shrink-0 border-r border-border bg-surface-elevated p-4 lg:block">
		<p class="mb-4 text-xs font-semibold uppercase tracking-wider text-text-muted">Administration</p>
		<nav class="flex flex-col gap-1">
			{#each navItems as item}
				<a
					href={item.href}
					class="flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors
						{isActive(item.href)
						? 'bg-primary/10 text-primary font-medium'
						: 'text-text-muted hover:bg-surface-overlay hover:text-text-primary'}"
				>
					<span>{item.icon}</span>
					{item.label}
				</a>
			{/each}
		</nav>
	</aside>

	<main class="flex-1 overflow-y-auto">
		{@render children()}
	</main>
</div>
